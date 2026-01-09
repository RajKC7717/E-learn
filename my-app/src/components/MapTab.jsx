import { useNavigate } from 'react-router-dom';
import MapSubjectGrid from '../components/MapSubjectGrid';

export default function MapTab() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24 px-4">
      
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Choose Your Path</h2>
      
      {/* Original Grid */}
      <MapSubjectGrid />

      {/* --- NEW: BATTLE ARENA SECTION --- */}
      <div className="mt-8 border-t pt-8">
        <h3 className="text-lg font-bold text-gray-600 mb-4 px-2 uppercase tracking-wider">Multiplayer</h3>
        
        <div 
          onClick={() => navigate('/battle')}
          className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl cursor-pointer transform transition active:scale-95 relative overflow-hidden group"
        >
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 opacity-10 text-9xl font-black -mr-4 -mt-4">VS</div>
          
          <div className="flex items-center gap-4 relative z-10">
             <div className="text-4xl bg-white/10 p-3 rounded-full">⚔️</div>
             <div>
               <h3 className="text-xl font-bold text-yellow-400">1v1 Quiz Battle</h3>
               <p className="text-sm text-gray-300">Challenge a friend on this device!</p>
             </div>
          </div>

          <div className="mt-4 flex gap-2">
             <span className="text-[10px] bg-red-500 px-2 py-1 rounded font-bold">OFFLINE</span>
             <span className="text-[10px] bg-blue-500 px-2 py-1 rounded font-bold">2 PLAYERS</span>
          </div>
        </div>
      </div>

    </div>
  );
}