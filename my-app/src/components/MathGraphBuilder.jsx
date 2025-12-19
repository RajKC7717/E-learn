import { useState, useEffect, useRef } from 'react';
import { getUser } from '../utils/db'; 
import { useNavigate, useLocation } from 'react-router-dom';

export default function MathGraphBuilder({ subject, title }) {
  // 📐 MATH GRAPH THEME (Retro Green)
  const THEME = {
    bg: "bg-[#022c22]", // Deep Engineering Green (Emerald-950)
    
    // Grid colors for the CSS background
    gridMajor: "rgba(52, 211, 153, 0.3)", // Stronger Green lines
    gridMinor: "rgba(52, 211, 153, 0.1)", // Faint Green lines
    
    beamColor: "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]",
    
    // Locked: Ghostly Green Wireframe
    blockLocked: "bg-[#064e3b]/30 border-2 border-dashed border-emerald-800 opacity-60",
    textLocked: "text-emerald-700 font-mono",
    
    // Unlocked: Active Terminal Block
    blockUnlocked: "bg-[#064e3b] border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]",
    textUnlocked: "text-emerald-300 font-mono font-bold tracking-widest",
    
    // Completed: Solid Green Block
    blockCompleted: "bg-gradient-to-r from-emerald-600 to-green-600 border-2 border-white/30 shadow-lg",
    textCompleted: "text-white font-bold tracking-wider"
  };

  const [levels, setLevels] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const originRef = useRef(null); 

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
          (item.subject || "").toLowerCase().includes("math")
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

  // --- 2. PROGRESS LISTENER ---
  useEffect(() => {
    const handleProgressUpdate = (event) => {
      setCompletedIds(event.detail);
    };
    window.addEventListener('progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('progress-updated', handleProgressUpdate);
  }, []);

  // --- 3. AUTO-SCROLL ---
  useEffect(() => {
    if (!loading && levels.length > 0) {
      setTimeout(() => {
        originRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [loading, levels]);

  // --- 4. STATUS LOGIC ---
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
      alert("🔒 Solve the previous equation first!");
      return;
    }
    navigate(location.pathname, { state: { openTopic: level } });
  };

  if (loading) return <div className="min-h-screen bg-[#022c22] flex items-center justify-center text-emerald-500 font-mono">PLOTTING GRAPH...</div>;
  
  if (levels.length === 0) return (
    <div className="min-h-screen bg-[#022c22] flex flex-col items-center justify-center text-emerald-800 font-mono p-4 text-center">
      <h2 className="text-xl">NULL SET (No Data)</h2>
    </div>
  );

  return (
    <div className={`min-h-screen ${THEME.bg} relative flex flex-col items-center overflow-x-hidden`}>
      
      {/* --- BACKGROUND: REAL GRAPH PAPER CSS --- */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(${THEME.gridMajor} 1px, transparent 1px),
            linear-gradient(90deg, ${THEME.gridMajor} 1px, transparent 1px),
            linear-gradient(${THEME.gridMinor} 1px, transparent 1px),
            linear-gradient(90deg, ${THEME.gridMinor} 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
          backgroundPosition: 'center bottom'
        }}
      ></div>

      {/* --- FLOATING MATH SYMBOLS (Green Theme) --- */}
      <div className="absolute top-20 left-10 text-emerald-800 text-6xl opacity-30 animate-spin-slow font-serif">∑</div>
      <div className="absolute top-60 right-10 text-emerald-800 text-6xl opacity-30 animate-bounce font-serif">π</div>
      <div className="absolute bottom-40 left-5 text-emerald-800 text-8xl opacity-20 font-serif">∫</div>

      {/* --- TOP HEADER (Retro Terminal Style) --- */}
      <div className="fixed top-0 left-0 right-0 bg-[#022c22]/90 backdrop-blur-md z-50 px-4 py-3 flex items-center border-b border-emerald-800 shadow-lg">
        <button onClick={() => navigate('/map')} className="p-2 rounded-lg border border-emerald-700 hover:bg-emerald-900 text-emerald-400 transition mr-3">
          ◀ BACK
        </button>
        <div>
           <h1 className="font-mono font-bold text-emerald-400 text-lg leading-none tracking-widest">{title || "GRAPH_MODE"}</h1>
           <span className="text-[10px] text-emerald-600 font-mono">y = mx + b</span>
        </div>
      </div>

      {/* --- THE STACK CONTAINER --- */}
      <div className="relative z-10 w-full max-w-sm px-6 pt-32 pb-32 flex flex-col-reverse gap-8 items-center">
        
        {/* THE BEAM (Y-AXIS) */}
        <div className={`absolute top-0 bottom-10 left-1/2 -translate-x-1/2 w-[2px] ${THEME.beamColor} z-0`}></div>

        {levels.map((level, index) => {
          const status = getLevelStatus(level.id, index);
          
          return (
            <div 
              key={level.id} 
              onClick={() => handleLevelClick(level, index)}
              className="relative w-full z-10 flex flex-col items-center cursor-pointer group"
            >
              
              {/* --- THE BLOCK --- */}
              <div className={`
                relative w-full h-24 rounded-sm flex items-center justify-between px-4 transition-all duration-300 transform
                ${status === 'locked' ? THEME.blockLocked : status === 'completed' ? THEME.blockCompleted : THEME.blockUnlocked}
                ${status === 'locked' ? 'hover:bg-emerald-900/40' : 'hover:scale-105 hover:-translate-y-1'}
              `}>
                
                {/* Left: Coordinate Label */}
                <div className="font-mono text-[10px] text-emerald-600/70 absolute top-1 left-1">
                   ({index + 1}, {index * 10})
                </div>

                {/* Center: Content */}
                <div className="flex items-center gap-4 w-full">
                  {/* Icon Box */}
                  <div className={`
                    w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-sm border
                    ${status === 'locked' ? 'border-emerald-800 text-emerald-800' : 'border-emerald-400/50 bg-[#000000]/20 text-emerald-200'}
                  `}>
                     <span className="font-mono text-lg">{index + 1}</span>
                  </div>

                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-[9px] uppercase tracking-[0.2em] font-mono ${status === 'locked' ? 'text-emerald-800' : 'text-emerald-500'}`}>
                      Coordinate {index + 1}
                    </span>
                    <h3 className={`text-base leading-tight truncate ${status === 'locked' ? THEME.textLocked : status === 'completed' ? THEME.textCompleted : THEME.textUnlocked}`}>
                      {level.topic}
                    </h3>
                  </div>
                </div>

                {/* Right: Status */}
                <div className="text-xl ml-2">
                    {status === 'locked' && <span className="opacity-30 grayscale">🔒</span>}
                    {status === 'unlocked' && <span className="animate-pulse text-emerald-400">⚡</span>}
                    {status === 'completed' && <span>✅</span>}
                </div>

                {/* Corner Glitch Decorations */}
                {status !== 'locked' && (
                  <>
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-emerald-400"></div>
                  </>
                )}

              </div>

              {/* Connecting Node on the Beam */}
              <div className={`
                absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 border-2 z-[-1] transition-colors duration-500
                ${status === 'completed' ? 'bg-emerald-400 border-white' : 'bg-[#022c22] border-emerald-700'}
              `}></div>

            </div>
          );
        })}

        {/* --- THE ORIGIN (0,0) --- */}
        <div 
          ref={originRef} // <--- Auto-scroll target
          className="relative w-32 h-32 flex flex-col items-center justify-center mt-4"
        >
           {/* Axis Lines at Origin */}
           <div className="absolute bottom-4 left-0 right-0 h-[2px] bg-emerald-700 w-full"></div> {/* X Axis */}
           <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-emerald-700 h-full"></div> {/* Y Axis */}
           
           <div className="z-10 bg-[#022c22] p-2 rounded-full border border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
             <span className="text-3xl animate-bounce block">📐</span>
           </div>
           <div className="mt-2 font-mono text-emerald-500 text-xs bg-[#022c22] px-2 z-10">ORIGIN (0,0)</div>
        </div>

      </div>

    </div>
  );
}