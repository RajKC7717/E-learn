import { useTranslation } from 'react-i18next'; // <--- Import i18n
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export default function DetailModal({ topic, onClose }) {
  const { t, i18n } = useTranslation(); // <--- Get current language
  const { speak, stop, isSpeaking } = useTextToSpeech();

  if (!topic) return null;

  const handleClose = () => {
    stop();
    onClose();
  };

  // Helper to trigger speech with the correct language
  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      // Pass the current language (e.g., 'hi' or 'en') to the hook
      speak(topic.detail, i18n.language);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
        
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-blue-900">{topic.topic}</h2>
          <button onClick={handleClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">✕</button>
        </div>
        
        <div className="overflow-y-auto flex-1">
          <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
            <p className="text-blue-800 font-medium italic">"{topic.summary}"</p>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">{topic.detail}</p>
        </div>

        <button 
          className={`mt-6 w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all
            ${isSpeaking 
              ? 'bg-red-100 text-red-600 border-2 border-red-500' 
              : 'bg-blue-600 text-white active:bg-blue-700'
            }`}
          onClick={handleSpeak}
        >
          {isSpeaking ? (
            <>
              <span>⏹️</span> {t('stop_reading')}
            </>
          ) : (
            <>
              <span>🔊</span> {t('read_aloud')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}