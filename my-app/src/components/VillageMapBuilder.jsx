import { useState, useEffect, useMemo, useRef } from 'react';
import { getUser } from '../utils/db'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// --- 🏘️ ASSETS (Same as before) ---
const ASSETS = {
  activeBuildings: [
    "https://cdn-icons-png.flaticon.com/512/4418/4418865.png", // Cottage
    "https://cdn-icons-png.flaticon.com/512/2555/2555013.png", // Shop
    "https://cdn-icons-png.flaticon.com/512/4525/4525143.png", // School
    "https://cdn-icons-png.flaticon.com/512/2234/2234674.png", // Villa
  ],
  decorBuildings: [
    "https://cdn-icons-png.flaticon.com/512/4600/4600417.png", // Barn
    "https://cdn-icons-png.flaticon.com/512/2942/2942544.png", // Greenhouse
    "https://cdn-icons-png.flaticon.com/512/1660/1660139.png"  // Well
  ],
  environment: [
    "https://cdn-icons-png.flaticon.com/512/620/620713.png",   // Tree 1 
    "https://cdn-icons-png.flaticon.com/512/490/490091.png",   // Tree 2 
    "https://cdn-icons-png.flaticon.com/512/5863/5863242.png", // Rock
    "https://cdn-icons-png.flaticon.com/512/10609/10609562.png" // Bush
  ],
  ui: {
    lock: "https://cdn-icons-png.flaticon.com/512/61/61457.png",
  }
};

export default function VillageMapBuilder({ subject, title }) {
  const [levels, setLevels] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const transformComponentRef = useRef(null);

  // --- 1. DATA LOADING ---
  useEffect(() => {
    async function init() {
      let allData = [];
      try {
        const response = await fetch('/data/knowledge_en.json');
        if (!response.ok) throw new Error("Network error");
        allData = await response.json();
        localStorage.setItem('offline_content', JSON.stringify(allData));
      } catch (err) {
        const cached = localStorage.getItem('offline_content');
        if (cached) allData = JSON.parse(cached);
      }

      if (allData.length > 0) {
        const subjectLevels = allData.filter(item => 
          (item.subject || "").toLowerCase().includes(subject.toLowerCase())
        );
        setLevels(subjectLevels);
      }

      const user = await getUser();
      if (user && user.progress) setCompletedIds(user.progress);
      setLoading(false);
    }
    init();
  }, [subject]);

  // --- 2. PROGRESS LISTENER ---
  useEffect(() => {
    const handleProgressUpdate = (event) => setCompletedIds(event.detail);
    window.addEventListener('progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('progress-updated', handleProgressUpdate);
  }, []);

  // --- 3. 🔥 CLEANER WORLD GENERATOR ---
  const worldObjects = useMemo(() => {
    if (levels.length === 0) return [];

    const CANVAS_SIZE = 2400;
    const BORDER_THICKNESS = 500; // Slightly thinner border zone
    const SAFE_MIN = BORDER_THICKNESS;
    const SAFE_MAX = CANVAS_SIZE - BORDER_THICKNESS;
    
    const objects = [];
    let objectCounter = 0;

    const checkCollision = (x, y, buffer) => {
      return objects.some(obj => {
        const dx = obj.x - x;
        const dy = obj.y - y;
        return Math.sqrt(dx*dx + dy*dy) < buffer;
      });
    }

    // --- A. PLACE ACTIVE LEVELS (Much more spread out) ---
    levels.forEach((level, index) => {
      let x, y, attempts = 0;
      do {
         x = SAFE_MIN + Math.random() * (SAFE_MAX - SAFE_MIN);
         y = SAFE_MIN + Math.random() * (SAFE_MAX - SAFE_MIN);
         attempts++;
         // 🔥 INCREASED BUFFER: Changed from 160 to 250 for more space
      } while (checkCollision(x, y, 250) && attempts < 500); 

      if (attempts < 500) {
          const buildingImg = ASSETS.activeBuildings[index % ASSETS.activeBuildings.length];
          objects.push({
            id: level.id,
            type: 'active',
            x, y,
            img: buildingImg,
            data: level,
            index: index,
            width: 120,
            zIndex: Math.floor(y)
          });
      }
    });

    // --- B. PLACE FILLER DECOR (Reduced count and increased spacing) ---
    // 🔥 REDUCED COUNT: Changed multiplier from *2 to *1
    const fillerCount = levels.length * 1; 
    for(let i=0; i<fillerCount; i++) {
        let x, y, attempts = 0;
        do {
           x = SAFE_MIN + Math.random() * (SAFE_MAX - SAFE_MIN);
           y = SAFE_MIN + Math.random() * (SAFE_MAX - SAFE_MIN);
           attempts++;
           // 🔥 INCREASED BUFFER: Changed from 100 to 180
        } while (checkCollision(x, y, 180) && attempts < 200);

        if(attempts < 200) {
            const isBuilding = Math.random() > 0.7; // Less likely to be a big building
            const img = isBuilding 
              ? ASSETS.decorBuildings[Math.floor(Math.random() * ASSETS.decorBuildings.length)]
              : ASSETS.environment[Math.floor(Math.random() * 2)]; 

            objects.push({
              id: `decor-center-${i}`,
              type: 'decor',
              x, y,
              img: img,
              width: isBuilding ? 80 : 60, // Slightly smaller decor
              zIndex: Math.floor(y)
            });
        }
    }

    // --- C. 🔥 GENERATE SPARSE FOREST BORDER ---
    // 🔥 DECREASED DENSITY: Changed step from 60 to 180 (much cleaner border)
    const DENSITY = 180; 
    for(let x = 0; x < CANVAS_SIZE; x += DENSITY) {
        for(let y = 0; y < CANVAS_SIZE; y += DENSITY) {
            const isBorder = x < SAFE_MIN || x > SAFE_MAX || y < SAFE_MIN || y > SAFE_MAX;
            
            if (isBorder) {
                const posX = x + Math.random() * 60 - 30;
                const posY = y + Math.random() * 60 - 30;

                let imgIdx = 0; 
                const rand = Math.random();
                // More rocks and bushes for a cleaner look than just big trees
                if (rand > 0.8) imgIdx = 2; // Rock
                else if (rand > 0.6) imgIdx = 1; // Tree 2
                else if (rand > 0.4) imgIdx = 3; // Bush

                objects.push({
                    id: `forest-${objectCounter++}`,
                    type: 'environment',
                    x: posX,
                    y: posY,
                    img: ASSETS.environment[imgIdx],
                    width: 60 + Math.random() * 30, 
                    zIndex: Math.floor(posY)
                });
            }
        }
    }

    return objects.sort((a, b) => a.zIndex - b.zIndex);
  }, [levels]);


  // --- 4. STATUS HELPER ---
  const getLevelStatus = (id, index) => {
    if (completedIds.includes(id)) return 'completed';
    if (index === 0) return 'unlocked';
    const prevLevelId = levels[index - 1]?.id;
    if (completedIds.includes(prevLevelId)) return 'unlocked';
    return 'locked';
  };

  // --- 5. AUTO-FOCUS CAMERA ---
  useEffect(() => {
    if (!loading && worldObjects.length > 0 && transformComponentRef.current) {
      let targetObj = worldObjects.find(obj => 
        obj.type === 'active' && getLevelStatus(obj.id, obj.index) === 'unlocked'
      );
      if (!targetObj) targetObj = worldObjects.find(obj => obj.type === 'active');

      if (targetObj) {
        const { setTransform } = transformComponentRef.current;
        // 🔥 INITIAL ZOOM: Adjusted to 0.6 for a better initial overview of the cleaner map
        const scale = 0.6; 
        const viewportX = window.innerWidth / 2;
        const viewportY = window.innerHeight / 2;
        const x = viewportX - (targetObj.x * scale);
        const y = viewportY - (targetObj.y * scale);
        
        setTimeout(() => setTransform(x, y, scale, 0), 200);
      }
    }
  }, [loading, worldObjects, completedIds]);

  // --- 6. CLICK HANDLER ---
  const handleLevelClick = (obj) => {
    if (obj.type !== 'active') return;
    const status = getLevelStatus(obj.id, obj.index);
    if (status === 'locked') {
       alert("🔒 Complete previous buildings first to unlock this one!");
       return;
    }
    navigate(location.pathname, { state: { openTopic: obj.data } });
  };


  if (loading) return <div className="h-screen flex items-center justify-center bg-[#5b8c3a] text-white font-bold">Loading Village...</div>;

  return (
    // Changed base color to a slightly cleaner green
    <div className="h-screen w-full bg-[#5b8c3a] relative overflow-hidden">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none flex justify-between items-start">
         <div className="pointer-events-auto bg-white/90 backdrop-blur rounded-xl p-2 shadow-xl border-b-4 border-green-800">
            <button onClick={() => navigate('/map')} className="px-3 py-1 font-bold text-green-900">⬅️ Exit Village</button>
         </div>
      </div>

      <TransformWrapper
        ref={transformComponentRef}
        initialScale={0.6}
        minScale={0.3}
        maxScale={3}
        limitToBounds={false} 
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }} 
      >
        {({ zoomIn, zoomOut }) => (
          <TransformComponent 
             wrapperClass="w-full h-full" 
             contentClass="" 
             wrapperStyle={{ width: "100%", height: "100%" }}
          >
            <div className="relative bg-[#5b8c3a]" style={{ width: 2400, height: 2400 }}>
               {/* 1. Ground Texture - 🔥 REDUCED OPACITY for cleaner look */}
               <div className="absolute inset-0 opacity-25" style={{ 
                  backgroundImage: `url('https://cdn.transparenttextures.com/patterns/grass.png')`, 
                  backgroundSize: '150px',
                  filter: 'contrast(1.1) sepia(0.1)' 
               }}></div>

               {/* 2. All Objects */}
               {worldObjects.map((obj) => {
                  const style = {
                      left: obj.x - obj.width / 2, 
                      top: obj.y - obj.width / 2, 
                      width: obj.width, 
                      zIndex: obj.zIndex
                  };

                  if (obj.type === 'active') {
                      const status = getLevelStatus(obj.id, obj.index);
                      return (
                        <div 
                           key={obj.id}
                           className="absolute flex flex-col items-center justify-center transition-transform active:scale-95"
                           style={style}
                           onClick={(e) => { e.stopPropagation(); handleLevelClick(obj); }}
                           onTouchEnd={() => handleLevelClick(obj)}
                        >
                           <img 
                              src={obj.img} 
                              alt="building" 
                              className={`w-full drop-shadow-2xl transition-all duration-300 ${status === 'locked' ? 'grayscale opacity-80 brightness-90' : 'hover:scale-105 brightness-105'}`}
                           />
                           {status !== 'locked' && (
                             <div className={`absolute -top-2 -right-2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs text-white shadow-md z-30 ${status === 'completed' ? 'bg-yellow-500' : 'bg-blue-500 animate-bounce'}`}>
                                {status === 'completed' ? '✓' : obj.index + 1}
                             </div>
                           )}
                           {status === 'locked' && (
                             <img src={ASSETS.ui.lock} className="absolute top-1/3 w-8 opacity-80 invert drop-shadow-lg z-30" />
                           )}
                           <div className="bg-black/50 text-white px-2 py-0.5 rounded text-[10px] font-bold mt-[-5px] z-20 backdrop-blur-sm max-w-[120px] text-center truncate border border-white/20">
                              {obj.data.topic}
                           </div>
                        </div>
                      );
                  } else {
                      return (
                        <img 
                           key={obj.id}
                           src={obj.img}
                           className={`absolute pointer-events-none drop-shadow-lg ${obj.type === 'environment' ? 'brightness-95 opacity-90' : 'opacity-95'}`} 
                           style={style}
                        />
                      );
                  }
               })}
            </div>
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
}