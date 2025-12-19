import { useState, useEffect ,useRef} from 'react';
import { getUser } from '../utils/db'; 
import { useNavigate, useLocation } from 'react-router-dom';

export default function ComputerTowerBuilder({ subject, title }) {
  const [levels, setLevels] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const entranceRef = useRef(null);

  // --- 1. DATA LOADING (Offline Proof) ---
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
          item.subject.toLowerCase() === "computer"
        );
        setLevels(subjectLevels);
      }

      const user = await getUser();
      if (user && user.progress) {
        setCompletedIds(user.progress);
      }
      setLoading(false);
    }
    init();
  }, []);

  // 2. NEW: Auto-Scroll to Bottom when loaded
  useEffect(() => {
    if (!loading && levels.length > 0) {
      setTimeout(() => {
        // CHANGE HERE: 'center' -> 'end'
        // 'end' means "Align the bottom of this element with the bottom of the screen"
        entranceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [loading, levels]);
  
  // --- 2. PROGRESS LISTENER ---
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      setCompletedIds(event.detail);
    };
    window.addEventListener('progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('progress-updated', handleProgressUpdate);
  }, []);

  // --- 3. HELPER: STATUS ---
  const getLevelStatus = (id, index) => {
    if (completedIds.includes(id)) return 'completed';
    if (index === 0) return 'unlocked';
    const prevLevelId = levels[index - 1]?.id;
    if (completedIds.includes(prevLevelId)) return 'unlocked';
    return 'locked';
  };

  const handleLevelClick = (level, index) => {
    const status = getLevelStatus(level.id, index); 
    if (status === 'locked') {
      alert("🔒 This floor is locked. Take the stairs from the floor below!");
      return;
    }
    navigate(location.pathname, { state: { openTopic: level } });
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold">Constructing Tower...</div>;
  if (levels.length === 0) return <div className="p-10 text-center text-gray-400">No blueprints found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-white relative flex flex-col items-center overflow-x-hidden">
      
      {/* --- BACKGROUND CLOUDS --- */}
      <div className="absolute top-20 left-10 text-6xl opacity-40 animate-pulse">☁️</div>
      <div className="absolute top-40 right-10 text-6xl opacity-30 animate-pulse delay-700">☁️</div>

      {/* --- TOP HEADER --- */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 px-4 py-3 flex items-center shadow-sm border-b border-gray-200">
        <button onClick={() => navigate('/map')} className="p-2 rounded-full hover:bg-gray-100 transition mr-3">
          ⬅️
        </button>
        <div>
           <h1 className="font-bold text-gray-800 text-lg leading-none">{title || "Tech Tower"}</h1>
           <span className="text-[10px] text-gray-500 font-bold uppercase">Commercial District</span>
        </div>
      </div>

      {/* --- THE BUILDING STRUCTURE --- */}
      <div className="relative z-10 w-full max-w-sm px-4 pt-28 pb-32 flex flex-col gap-0 items-center">
        
        {/* 1. ROOFTOP (Antenna & AC Units) */}
        <div className="w-[90%] h-12 flex items-end justify-center gap-4">
           <div className="w-1 h-10 bg-gray-400"></div> {/* Antenna */}
           <div className="w-10 h-6 bg-gray-500 rounded-t-lg"></div> {/* AC Unit */}
           <div className="w-1 h-16 bg-red-400 animate-pulse"></div> {/* Beacon */}
        </div>
        <div className="w-[95%] h-4 bg-stone-600 rounded-t-md shadow-md z-20"></div> {/* Roof Cap */}

        {/* 2. THE FLOORS (Stacked Reverse) */}
        <div className="flex flex-col-reverse w-full shadow-2xl">
          {levels.map((level, index) => {
            const status = getLevelStatus(level.id, index);
            const floorNum = index + 1;
            
            return (
              <div 
                key={level.id} 
                onClick={() => handleLevelClick(level, index)}
                className={`
                  relative h-28 w-full border-x-8 border-b-2 border-stone-300 flex overflow-hidden cursor-pointer bg-stone-100
                  transition-all duration-200
                  ${status === 'locked' ? 'brightness-75' : 'hover:bg-stone-50'}
                `}
              >
                {/* A. STAIRWELL SHAFT (Left) */}
                <div className="w-16 bg-stone-200 border-r-2 border-stone-300 flex flex-col items-center justify-center relative">
                   {/* Stair Icon SVG */}
                   <svg viewBox="0 0 24 24" className={`w-8 h-8 ${status === 'locked' ? 'text-stone-400' : 'text-amber-600'}`}>
                     <path fill="currentColor" d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M6,6h2v2h2v2h2v2h2v2 h2v2H6V6z"/>
                   </svg>
                   {/* Floor Number Badge */}
                   <div className="mt-2 bg-stone-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                     {floorNum}F
                   </div>
                </div>

                {/* B. MAIN ROOM (Center) */}
                <div className="flex-1 flex flex-col relative">
                  
                  {/* Windows Row */}
                  <div className="h-1/2 w-full flex items-center justify-around px-2 pt-2 gap-2 bg-stone-100">
                    {[1, 2, 3].map((win) => (
                      <div key={win} className={`
                        h-full w-full rounded-sm border-2 border-stone-300 shadow-inner
                        ${status === 'locked' ? 'bg-slate-700' : 'bg-yellow-100'}
                        ${status === 'completed' ? 'bg-green-100' : ''}
                      `}>
                         {/* Window Glare */}
                         {status !== 'locked' && <div className="w-full h-1/2 bg-white/40 skew-y-12"></div>}
                      </div>
                    ))}
                  </div>

                  {/* Room Content / Label */}
                  <div className="h-1/2 w-full flex items-center px-3 border-t border-stone-200 bg-white">
                     <div className="flex-1">
                        <h3 className={`font-bold text-sm leading-tight ${status === 'locked' ? 'text-gray-400' : 'text-gray-800'}`}>
                          {level.topic}
                        </h3>
                     </div>
                     <div className="text-xl">
                        {status === 'locked' && '🔒'}
                        {status === 'unlocked' && '🚪'}
                        {status === 'completed' && '🌿'}
                     </div>
                  </div>

                </div>

                {/* C. BALCONY (Right Edge decoration) */}
                <div className="w-2 h-full bg-stone-300 border-l border-stone-400 relative">
                    {/* Railing if needed, simple lines for now */}
                    <div className="absolute bottom-0 w-full h-8 bg-stone-400"></div>
                </div>

                {/* D. "You Are Here" Indicator */}
                {status === 'unlocked' && (
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 text-2xl animate-bounce z-20 drop-shadow-md">
                    🚶
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* 3. FOUNDATION / LOBBY */}
        <div className="w-full h-16 bg-stone-700 border-x-8 border-stone-800 flex items-center justify-center relative rounded-b-lg shadow-xl">
           {/* Entrance Doors */}
           <div className="w-20 h-full bg-blue-900 border-x-4 border-stone-600 flex items-end justify-center">
              <div className="w-[1px] h-full bg-stone-800/50"></div> {/* Door Split */}
           </div>
           {/* Steps */}
           <div className="absolute -bottom-2 w-[110%] h-2 bg-stone-500 rounded"></div>
           <div className="absolute -bottom-4 w-[120%] h-2 bg-stone-400 rounded"></div>
           
           <span className="absolute bottom-8 text-stone-400 text-[10px] tracking-[0.3em] font-bold bg-stone-800 px-2">
             ENTRANCE
           </span>
        </div>

      </div>

    </div>
  );
}