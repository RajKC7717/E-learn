import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector({ onComplete }) {
  const { switchLanguage, t, lang } = useLanguage();

  const handleSelect = (code) => {
    switchLanguage(code);
    // Add a small delay for visual feedback before closing
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6 text-center">
      
      {/* 3D Friendly Avatar */}
      <div className="w-40 h-40 mb-6 animate-bounce-slow">
        <img 
          src="https://cdn3d.iconscout.com/3d/premium/thumb/teacher-5692617-4743386.png" 
          alt="Teacher" 
          className="w-full h-full object-contain drop-shadow-xl"
        />
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-8 animate-fade-in">
        {lang === 'hi' ? 'आप किस भाषा को पसंद करते हैं?' : 'Which language do you prefer?'}
      </h1>

      <div className="space-y-4 w-full max-w-xs animate-slide-up">
        {/* English Option */}
        <button 
          onClick={() => handleSelect('en')}
          className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 shadow-sm
            ${lang === 'en' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 bg-white hover:border-blue-300'}
          `}
        >
          <span className="text-3xl">🇬🇧</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">English</h3>
            <p className="text-xs text-gray-500">Default</p>
          </div>
          {lang === 'en' && <span className="ml-auto text-blue-600 text-xl">✔</span>}
        </button>

        {/* Hindi Option */}
        <button 
          onClick={() => handleSelect('hi')}
          className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 shadow-sm
            ${lang === 'hi' ? 'border-orange-600 bg-orange-50 ring-2 ring-orange-200' : 'border-gray-200 bg-white hover:border-orange-300'}
          `}
        >
          <span className="text-3xl">🇮🇳</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-800">हिंदी</h3>
            <p className="text-xs text-gray-500">Hindi</p>
          </div>
          {lang === 'hi' && <span className="ml-auto text-orange-600 text-xl">✔</span>}
        </button>
      </div>

    </div>
  );
}