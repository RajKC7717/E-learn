import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export default function GameLoader({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    // Fake loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 500); // Wait a bit at 100% before finishing
          return 100;
        }
        // Random increment between 5 and 15
        return prev + Math.floor(Math.random() * 10) + 5; 
      });
    }, 150);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#1a1c29] flex flex-col items-center justify-center">
      
      {/* Background Pattern (Optional) */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

      {/* Main Logo Area */}
      <div className="relative z-10 flex flex-col items-center animate-pulse-slow">
        <div className="w-32 h-32 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.6)] mb-6 transform rotate-3">
          <span className="text-6xl">🎓</span>
        </div>
        <h1 className="text-white font-black text-3xl tracking-widest drop-shadow-md">
          EVO<span className="text-blue-400">SOLVE</span>
        </h1>
      </div>

      {/* Loading Bar at Bottom */}
      <div className="absolute bottom-20 w-3/4 max-w-sm">
        <div className="flex justify-between text-xs text-blue-200 font-bold mb-2 uppercase tracking-wider">
          <span>{t.loading}</span>
          <span>{Math.min(100, progress)}%</span>
        </div>
        
        {/* The Bar Container */}
        <div className="h-4 w-full bg-slate-800 rounded-full border-2 border-slate-600 overflow-hidden relative shadow-inner">
          {/* The Filling Bar */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          >
            {/* Shiny Glare Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/30"></div>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Tip: Completing streaks earns bonus points!
        </p>
      </div>

    </div>
  );
}