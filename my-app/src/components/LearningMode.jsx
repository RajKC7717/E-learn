import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export default function LearningMode({ topic, onClose }) {
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Voice & TTS Hooks
  const { text: voiceText, isListening, startListening, stopListening, resetText } = useVoiceInput();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  // Reset when topic changes
  useEffect(() => {
    setCurrentSlide(0);
    setShowQuiz(false);
    stopSpeaking();
  }, [topic]);

  if (!topic) return null;

  const slides = topic.pages || [];
  const activeSlide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      setShowQuiz(true);
    } else {
      setCurrentSlide(curr => curr + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
  };

  return (
    // 1. Z-INDEX FIX: z-[100] ensures it sits ON TOP of the Bottom Nav (z-50)
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-5 duration-300">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div>
          <h2 className="font-bold text-lg text-gray-800 line-clamp-1">{topic.topic}</h2>
          <p className="text-xs text-blue-600 font-medium">
             {showQuiz ? "Quiz Mode" : `Page ${currentSlide + 1} of ${slides.length}`}
          </p>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 text-gray-500 hover:text-red-600 transition"
        >
          ✕
        </button>
      </div>

      {/* --- SCROLLABLE CONTENT AREA --- */}
      {/* 2. PADDING FIX: pb-32 ensures content isn't hidden behind the buttons */}
      <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-6">
        
        {!showQuiz ? (
          // LEARNING SLIDES
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[50vh]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black text-gray-800">{activeSlide?.title}</h3>
              <button 
                onClick={() => isSpeaking ? stopSpeaking() : speak(activeSlide?.content)}
                className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}
              >
                {isSpeaking ? '🔊 Stop' : '🔈 Read'}
              </button>
            </div>
            
            {/* Image (Placeholder if needed) */}
            <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6 flex items-center justify-center opacity-80">
               <span className="text-6xl">📖</span>
            </div>

            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              {activeSlide?.content}
            </p>
          </div>
        ) : (
          // QUIZ MODE PLACEHOLDER
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm min-h-[50vh] flex flex-col justify-center items-center">
            <span className="text-6xl mb-4">🎯</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Time!</h3>
            <p className="text-gray-500">Test your knowledge on {topic.topic}.</p>
          </div>
        )}

      </div>

      {/* --- FOOTER (ACTION BUTTONS) --- */}
      {/* 3. VISIBILITY FIX: White background + Safe Area Padding */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 flex items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        
        {/* PREV BUTTON */}
        <button 
          onClick={handlePrev} 
          disabled={currentSlide === 0 || showQuiz}
          className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-200 transition"
        >
          ⬅️ Prev
        </button>

        {/* MIC BUTTON (Center) */}
        

        {/* NEXT / QUIZ BUTTON */}
        <button 
          onClick={handleNext}
          className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95
            ${showQuiz ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {showQuiz ? "Start Quiz 🚀" : (isLastSlide ? "Take Quiz 📝" : "Next ➡️")}
        </button>
      </div>

    </div>
  );
}