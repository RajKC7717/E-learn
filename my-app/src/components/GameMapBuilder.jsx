import { useState, useEffect, useMemo } from 'react';
import { getUser } from '../utils/db'; 
import { useNavigate, useLocation } from 'react-router-dom';

// --- 🌲 ASSET MAPPING (Science Specific) 🌲 ---
const scienceAssets = {
  default: {
    locked: "https://cdn-icons-png.flaticon.com/512/628/628283.png",   // Sprout
    completed: "https://cdn-icons-png.flaticon.com/512/2990/2990656.png" // Tree
  },
  "sci_6_4": {
    locked: "https://cdn-icons-png.flaticon.com/512/616/616490.png",   // Battery Off
    completed: "https://cdn-icons-png.flaticon.com/512/2933/2933116.png" // Battery On
  }
};

export default function GameMapBuilder({ subject, title }) {
  // Theme Config
  const THEME = {
    bgStart: "from-lime-50",
    bgEnd: "to-emerald-50",
    path: "text-emerald-300",
    nodeLocked: "bg-lime-200",
    nodeCompleted: "bg-emerald-600",
    patchLocked: "bg-lime-100",  
    patchCompleted: "bg-emerald-200"
  };

  const [levels, setLevels] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  const LEVEL_HEIGHT = 160; 
  const X_AMPLITUDE = 80;   

  // --- 1. DATA LOADING (Offline Proof) ---
  useEffect(() => {
    async function init() {
      let allData = [];
      try {
        // Try Online Fetch
        const response = await fetch('/data/knowledge_en.json');
        if (!response.ok) throw new Error("Network error");
        allData = await response.json();
        
        // Save to Cache
        localStorage.setItem('offline_content', JSON.stringify(allData));
      } catch (err) {
        // Fallback to Cache
        console.warn("⚠️ Offline Mode: Loading from Cache");
        const cached = localStorage.getItem('offline_content');
        if (cached) allData = JSON.parse(cached);
      }

      // Filter for Science
      if (allData.length > 0) {
        const subjectLevels = allData.filter(item => 
          item.subject.toLowerCase() === "science"
        );
        setLevels(subjectLevels);
      }

      // Load User Progress
      const user = await getUser();
      if (user && user.progress) {
        setCompletedIds(user.progress);
      }

      setLoading(false);
    }
    init();
  }, []);

  // --- 2. LISTEN FOR PROGRESS UPDATES ---
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      const newProgress = event.detail;
      console.log("♻️ Map received update:", newProgress);
      setCompletedIds(newProgress);
    };

    window.addEventListener('progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('progress-updated', handleProgressUpdate);
  }, []);

  // --- 3. HELPER: CHECK STATUS ---
  // (This is the function that was missing/undefined)
  const getLevelStatus = (id, index) => {
    if (completedIds.includes(id)) return 'completed';
    
    // First level is always unlocked
    if (index === 0) return 'unlocked';

    // If previous level is completed, this one unlocks
    const prevLevelId = levels[index - 1]?.id;
    if (completedIds.includes(prevLevelId)) return 'unlocked';
    
    return 'locked';
  };

  // --- 4. CLICK HANDLER ---
  const handleLevelClick = (level, index) => {
    const status = getLevelStatus(level.id, index); 
    if (status === 'locked') {
      alert("🔒 Complete the previous level first!");
      return;
    }
    navigate(location.pathname, { state: { openTopic: level } });
  };

  // --- 5. CALCULATE POSITIONS ---
  const nodes = useMemo(() => {
    return levels.map((level, index) => {
      const xOffset = Math.sin(index * 2.2) * X_AMPLITUDE; 
      return { ...level, x: xOffset, y: index * LEVEL_HEIGHT };
    });
  }, [levels]);

  const pathData = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x + 150} ${nodes[0].y + 60}`; 
    for (let i = 1; i < nodes.length; i++) {
      const startX = nodes[i - 1].x + 150; 
      const startY = nodes[i - 1].y + 60;  
      const endX = nodes[i].x + 150;
      const endY = nodes[i].y + 60;
      const cp1X = startX;
      const cp1Y = startY + LEVEL_HEIGHT / 2;
      const cp2X = endX;
      const cp2Y = endY - LEVEL_HEIGHT / 2;
      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    }
    return d;
  }, [nodes]);

  if (loading) return <div className="p-10 text-center text-emerald-600">Loading Forest...</div>;
  if (levels.length === 0) return <div className="p-10 text-center text-gray-400">No Science levels found (Offline).</div>;

  const totalHeight = levels.length * LEVEL_HEIGHT + 150;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${THEME.bgStart} ${THEME.bgEnd} relative overflow-x-hidden`}>
      
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 px-4 py-3 flex items-center shadow-sm border-b border-lime-100">
        <button onClick={() => navigate('/map')} className="p-2 rounded-full hover:bg-gray-100 transition mr-2">
          ⬅️
        </button>
        <div>
           <h1 className="font-bold text-emerald-900 text-lg leading-none">{title || "Science Forest"}</h1>
           <span className="text-[10px] text-emerald-600 font-medium">UNIT 1: The Beginning</span>
        </div>
      </div>

      <div className="relative w-full max-w-[350px] mx-auto pt-28 pb-32">
        
        {/* SVG Path */}
        <svg 
          className="absolute top-0 left-0 w-full pointer-events-none z-0"
          style={{ height: totalHeight }}
          viewBox={`0 0 300 ${totalHeight}`}
        >
          <path d={pathData} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="16" strokeLinecap="round" />
          <path 
            d={pathData} 
            fill="none" 
            stroke="#6ee7b7" 
            strokeWidth="8" 
            strokeDasharray="10, 10" 
            strokeLinecap="round"
          />
        </svg>

        {/* Nodes Loop */}
        {nodes.map((node, index) => {
          // CALLING THE FUNCTION HERE CAUSED THE ERROR BEFORE
          const status = getLevelStatus(node.id, index);
          
          const specificAsset = scienceAssets[node.id];
          const defaultAsset = scienceAssets.default;
          
          const activeImage = status === 'completed' 
            ? (specificAsset?.completed || defaultAsset.completed) 
            : (specificAsset?.locked || defaultAsset.locked);

          return (
            <div 
              key={node.id}
              className="absolute w-full flex justify-center"
              style={{ top: node.y, transform: `translateX(${node.x}px)` }}
            >
              {/* Land Patch */}
              <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-xl transition-colors duration-700
                  ${status === 'completed' ? THEME.patchCompleted : THEME.patchLocked}
                `} 
              />

              <div className="relative group z-10 flex flex-col items-center">
                
                {/* Label */}
                <div className={`
                  mb-2 px-3 py-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-emerald-100
                  transition-all duration-300 transform
                  ${status === 'locked' ? 'opacity-50 scale-90' : 'opacity-100 scale-100'}
                `}>
                  <span className="text-xs font-bold text-emerald-800">{node.topic}</span>
                </div>

                {/* Button */}
                <button
                  onClick={() => handleLevelClick(node, index)}
                  className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center border-b-8 transition-all duration-300
                    ${status === 'locked' 
                      ? 'bg-stone-200 border-stone-300 grayscale opacity-80 cursor-not-allowed' 
                      : 'bg-emerald-100 border-emerald-600 shadow-xl hover:scale-110 active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  <img 
                    src={activeImage} 
                    alt={node.topic} 
                    className={`w-16 h-16 object-contain drop-shadow-md transition-all duration-500
                      ${status === 'completed' ? 'scale-110' : 'scale-90'}
                    `}
                  />
                  {status === 'completed' && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-white p-1 rounded-full shadow-md border-2 border-white text-xs">⭐</div>
                  )}
                </button>

                {/* Decorations */}
                {status === 'completed' && (
                   <>
                     <div className="absolute top-20 -left-10 text-xl animate-bounce delay-100">🍄</div>
                     <div className="absolute top-16 -right-12 text-xl animate-bounce delay-700">🦋</div>
                   </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}