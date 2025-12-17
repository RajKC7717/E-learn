import { useNavigate } from 'react-router-dom';

export default function MapSubjectGrid() {
  const navigate = useNavigate();

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800">Explore Worlds 🌍</h1>
        <p className="text-gray-500 text-sm">Choose a subject to start your journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. MATHS (Large Card) */}
        <div 
          onClick={() => navigate('/map/math')}
          className="group relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 overflow-hidden cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 opacity-20 transform translate-x-4 -translate-y-4">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1">
              <path d="M4 20h16M4 4h16M12 4v16m-8-8l16 16" />
            </svg>
          </div>
          
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">📐</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Mathematics</h2>
              <p className="text-indigo-100 text-xs mt-1">Logic & Numbers Kingdom</p>
            </div>
          </div>
        </div>

        {/* 2. SCIENCE (Square Card) */}
        <div 
          onClick={() => navigate('/map/science')}
          className="group relative h-40 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 overflow-hidden cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <div className="absolute -bottom-4 -right-4 opacity-20">
             <span className="text-8xl">🧬</span>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xl">🧪</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Science</h2>
              <p className="text-emerald-100 text-[10px]">Nature & Physics</p>
            </div>
          </div>
        </div>

        {/* 3. COMPUTER (Square Card) */}
        <div 
          onClick={() => navigate('/map/computer')}
          className="group relative h-40 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 overflow-hidden cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <div className="absolute top-2 right-2 opacity-10">
            <svg width="80" height="80" viewBox="0 0 24 24" stroke="white" fill="none" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
             <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-xl">💻</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Computer</h2>
              <p className="text-orange-100 text-[10px]">Code & Logic</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}