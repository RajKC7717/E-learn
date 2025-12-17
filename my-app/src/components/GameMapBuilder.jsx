import { useState, useEffect, useMemo } from 'react';
import { getUser } from '../utils/db'; 
import { useNavigate, useLocation } from 'react-router-dom'; // <--- Added useLocation

// --- IMAGE MAPPING ---
const levelImages = {
  // "sci_6_4": "/assets/electricity.png",
};

export default function GameMapBuilder({ subject, themeColor, title }) {
  const [levels, setLevels] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation(); // <--- This was needed

  // --- CONFIGURATION ---
  const LEVEL_HEIGHT = 140; 
  const X_AMPLITUDE = 70;   

  // 1. Fetch Data
  useEffect(() => {
    async function init() {
      try {
        const response = await fetch('/data/knowledge_en.json');
        const allData = await response.json();
        
        const subjectLevels = allData.filter(item => 
          item.subject.toLowerCase() === subject.toLowerCase()
        );
        setLevels(subjectLevels);

        const user = await getUser();
        if (user && user.progress) {
          setCompletedIds(user.progress);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load map:", err);
        setLoading(false);
      }
    }
    init();
  }, [subject]);

  const getLevelStatus = (id, index) => {
    if (completedIds.includes(id)) return 'completed';
    // Logic: If index is 0, it's always unlocked.
    // If previous level is completed, this one is unlocked.
    const prevLevelId = index > 0 ? levels[index - 1].id : null;
    if (index === 0 || completedIds.includes(prevLevelId)) return 'unlocked';
    return 'locked';
  };

  // --- FIX IS HERE: Accepted 'index' as 2nd Argument ---
  const handleLevelClick = (level, index) => {
    const status = getLevelStatus(level.id, index); 
    
    console.log(`Clicked Level ${index + 1}: ${level.topic}`);
    console.log("Status:", status);

    if (status === 'locked') {
       // Optional: Add a toast or alert here
       console.log("Locked level clicked");
       return;
    }

    // Send data to App.jsx via Router State
    navigate(location.pathname, { state: { openTopic: level } });
  };

  // --- 2. CALCULATE POSITIONS ---
  const nodes = useMemo(() => {
    return levels.map((level, index) => {
      const xOffset = Math.sin(index * 2.5) * X_AMPLITUDE; 
      return {
        ...level,
        x: xOffset, 
        y: index * LEVEL_HEIGHT
      };
    });
  }, [levels]);

  // --- 3. GENERATE SVG PATH ---
  const pathData = useMemo(() => {
    if (nodes.length < 2) return "";
    let d = `M ${nodes[0].x + 150} ${nodes[0].y + 50}`; 
    for (let i = 1; i < nodes.length; i++) {
      const startX = nodes[i - 1].x + 150; 
      const startY = nodes[i - 1].y + 50;  
      const endX = nodes[i].x + 150;
      const endY = nodes[i].y + 50;
      const cp1X = startX;
      const cp1Y = startY + LEVEL_HEIGHT / 2;
      const cp2X = endX;
      const cp2Y = endY - LEVEL_HEIGHT / 2;
      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
    }
    return d;
  }, [nodes]);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading Map...</div>;
  if (levels.length === 0) return <div className="p-10 text-center text-gray-400">No levels found.</div>;

  const totalHeight = levels.length * LEVEL_HEIGHT + 100;

  return (
    <div className={`min-h-screen bg-${themeColor}-50 relative overflow-x-hidden`}>
      
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 px-4 py-3 flex items-center shadow-sm border-b border-gray-100">
        <button onClick={() => navigate('/map')} className="p-2 rounded-full hover:bg-gray-100 transition mr-2">
          ⬅️
        </button>
        <div>
           <h1 className={`font-bold text-${themeColor}-900 text-lg leading-none`}>{title}</h1>
           <span className="text-[10px] text-gray-400 font-medium">UNIT 1</span>
        </div>
      </div>

      <div className="relative w-full max-w-[300px] mx-auto pt-32 pb-32">
        
        {/* SVG Line */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
          style={{ height: totalHeight }}
          viewBox={`0 0 300 ${totalHeight}`}
        >
          <path d={pathData} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="12" strokeLinecap="round" />
          <path 
            d={pathData} 
            fill="none" 
            stroke={`var(--color-${themeColor}-300, #cbd5e1)`}
            strokeWidth="8" 
            strokeDasharray="15, 15" 
            strokeLinecap="round"
            className={`text-${themeColor}-300`} 
          />
        </svg>

        {/* Nodes */}
        {nodes.map((node, index) => {
          const status = getLevelStatus(node.id, index);
          const hasImage = levelImages[node.id]; 

          return (
            <div 
              key={node.id}
              className="absolute w-full flex justify-center"
              style={{ 
                top: node.y, 
                transform: `translateX(${node.x}px)` 
              }}
            >
              <div className="relative group">
                {/* Tooltip */}
                <div className={`
                  absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-100
                  transition-all duration-300
                  ${status === 'locked' ? 'opacity-0' : 'opacity-100'}
                  ${status === 'unlocked' ? 'animate-bounce' : ''}
                `}>
                  <span className={`text-xs font-bold text-${themeColor}-600`}>{node.topic}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-100"></div>
                </div>

                {/* Button */}
                <button
                  onClick={() => handleLevelClick(node, index)} // <--- Correctly passing index
                  className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center border-b-8 transition-all duration-200 active:border-b-0 active:translate-y-2
                    ${status === 'locked' 
                      ? 'bg-gray-200 border-gray-300 cursor-not-allowed grayscale opacity-80' 
                      : `bg-${themeColor}-500 border-${themeColor}-700 shadow-xl cursor-pointer hover:bg-${themeColor}-400`
                    }
                  `}
                >
                  <div className={`absolute inset-2 rounded-full border-2 border-white/20`}></div>
                  {hasImage ? (
                    <img src={hasImage} alt={node.topic} className="w-16 h-16 object-contain drop-shadow-md" />
                  ) : (
                    <span className="text-4xl filter drop-shadow-md">
                      {status === 'completed' ? '🏆' : status === 'locked' ? '🔒' : '★'}
                    </span>
                  )}
                  {status !== 'locked' && (
                     <div className="absolute top-2 right-4 w-4 h-2 bg-white/40 rounded-full rotate-[-45deg]"></div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}