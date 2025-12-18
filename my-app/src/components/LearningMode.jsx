import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNativeVoice } from '../hooks/useNativeVoice';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { markTopicAsCompleted } from '../utils/db'; // <--- Import this

export default function LearningMode({ topic, onClose }) {
  const { t } = useTranslation();
  
  // --- STATES ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuizIntro, setShowQuizIntro] = useState(false); // The "Quiz Time!" screen
  const [quizStarted, setQuizStarted] = useState(false);     // The actual questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null); // For MCQs
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct' | 'wrong' | null

  // Voice & TTS
// Voice Hook (Same names, new logic)
  const { text, isListening, startListening, stopListening } = useNativeVoice();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();

  // Reset when topic changes
  useEffect(() => {
    setCurrentSlide(0);
    setShowQuizIntro(false);
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setAnswerStatus(null);
    stopSpeaking();
  }, [topic]);

  if (!topic) return null;

  // Data helpers
  const slides = topic.pages || [];
  const activeSlide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const questions = topic.quiz || [];
  const activeQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // --- HANDLERS ---

  const handleNext = () => {
    stopSpeaking();

    // 1. Learning Phase: Next Slide
    if (!showQuizIntro && !quizStarted) {
      if (isLastSlide) {
        setShowQuizIntro(true); // Go to Quiz Intro
      } else {
        setCurrentSlide(curr => curr + 1);
      }
      return;
    }

    // 2. Quiz Intro Phase: Start Quiz
    if (showQuizIntro && !quizStarted) {
      setShowQuizIntro(false);
      setQuizStarted(true);
      return;
    }

    // 3. Quiz Active Phase: Next Question
    if (quizStarted) {
      // Logic: Must select an answer before moving on (optional, strict mode)
      if (selectedOption === null && activeQuestion.type === 'mcq') {
        alert("Please select an answer!");
        return;
      }

      // Calculate Score
      if (activeQuestion.type === 'mcq' && selectedOption === activeQuestion.answer) {
        setScore(s => s + 1);
      }
      // (For 'match' type, we skip auto-scoring for now as it needs complex UI)

      // Move to next or Finish
      if (isLastQuestion) {
        setQuizStarted(false);
        setShowResult(true);
      } else {
        setCurrentQuestionIndex(curr => curr + 1);
        setSelectedOption(null); // Reset selection
        setAnswerStatus(null);
      }
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    if (quizStarted) return; // Disable prev during quiz for simplicity
    if (showQuizIntro) {
      setShowQuizIntro(false);
    } else if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  const checkAnswer = (option) => {
    if (answerStatus) return; // Prevent changing after answer
    setSelectedOption(option);
    
    if (option === activeQuestion.answer) {
      setAnswerStatus('correct');
      // Optional: Play 'ding' sound
    } else {
      setAnswerStatus('wrong');
    }
  };

  // --- RENDER HELPERS ---
  const renderQuizContent = () => {
    // A. The "Match" Type (Simplified View)
    if (activeQuestion.type === 'match') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 mb-4">{activeQuestion.question}</h3>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            {activeQuestion.pairs.map((pair, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
                <span className="font-medium text-gray-700">{pair.left}</span>
                <span className="text-xl">👉</span>
                <span className="font-bold text-blue-700">{pair.right}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">Memorize these pairs!</p>
        </div>
      );
    }

    // B. The "MCQ" Type
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800">{activeQuestion.question}</h3>
        <div className="grid gap-3">
          {activeQuestion.options.map((option, idx) => {
            let btnClass = "w-full text-left p-4 rounded-xl border-2 font-medium transition-all ";
            
            // Logic for coloring buttons
            if (selectedOption === option) {
              if (option === activeQuestion.answer) btnClass += "bg-green-100 border-green-500 text-green-800";
              else btnClass += "bg-red-100 border-red-500 text-red-800";
            } else if (answerStatus === 'wrong' && option === activeQuestion.answer) {
               btnClass += "bg-green-50 border-green-300 text-green-700 opacity-70"; // Show correct answer if wrong
            } else {
               btnClass += "bg-white border-gray-100 hover:border-blue-300 hover:bg-blue-50";
            }

            return (
              <button 
                key={idx} 
                onClick={() => checkAnswer(option)}
                className={btnClass}
              >
                {option} {selectedOption === option ? (option === activeQuestion.answer ? "✅" : "❌") : ""}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    // Z-INDEX FIX: z-[100]
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom-5 duration-300">
      
      {/* --- HEADER --- */}
      <div className="bg-white p-4 flex items-center justify-between shadow-md shrink-0">
        <div>
          <h2 className="font-bold text-lg text-gray-800 line-clamp-1">{topic.topic}</h2>
          <p className="text-xs text-blue-600 font-medium">
             {showResult ? "Completed" : 
              quizStarted ? `Question ${currentQuestionIndex + 1}/${questions.length}` : 
              showQuizIntro ? "Quiz Mode" : 
              `Page ${currentSlide + 1} of ${slides.length}`}
          </p>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 text-gray-500 transition">✕</button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-5 pb-40 space-y-6">
        
        {/* 1. LEARNING SLIDES */}
        {!showQuizIntro && !quizStarted && !showResult && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[50vh]">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black text-gray-800">{activeSlide?.title}</h3>
              <button 
                onClick={() => isSpeaking ? stopSpeaking() : speak(activeSlide?.content)}
                className={`p-3 rounded-full transition-all ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}
              >
                {isSpeaking ? '🔊' : '🔈'}
              </button>
            </div>
            <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6 flex items-center justify-center opacity-80">
               <span className="text-6xl">📖</span>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">{activeSlide?.content}</p>
          </div>
        )}

        {/* 2. QUIZ INTRO */}
        {showQuizIntro && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm min-h-[50vh] flex flex-col justify-center items-center animate-in zoom-in-95">
            <span className="text-6xl mb-4">🎯</span>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Time!</h3>
            <p className="text-gray-500">Test your knowledge on {topic.topic}.</p>
            <div className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-bold">
              {questions.length} Questions
            </div>
          </div>
        )}

        {/* 3. ACTIVE QUIZ */}
        {quizStarted && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[50vh] animate-in slide-in-from-right-10">
            {renderQuizContent()}
          </div>
        )}

        {/* 4. RESULTS */}
        {/* 4. RESULTS */}
        {showResult && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm min-h-[50vh] flex flex-col justify-center items-center animate-in zoom-in-95">
             <span className="text-6xl mb-4">🏆</span>
             <h3 className="text-2xl font-bold text-gray-800">Quiz Completed!</h3>
             <p className="text-gray-500 mt-2">You scored</p>
             <div className="text-5xl font-black text-blue-600 my-4">{score} / {questions.length}</div>
             
             <button 
               onClick={() => {
                 // 1. Save to Database
                 markTopicAsCompleted(topic.id);
                 // 2. Close Popup
                 onClose();
               }} 
               className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition"
             >
               Finish Lesson 💾
             </button>
          </div>
        )}
      </div>

      {/* --- BOTTOM BAR --- */}
      {!showResult && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 flex items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          
          <button 
            onClick={handlePrev} 
            disabled={currentSlide === 0 && !showQuizIntro}
            className={`flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 transition
              ${(quizStarted || showResult) ? 'opacity-0 pointer-events-none' : ''} 
            `}
          >
            ⬅️ Prev
          </button>

          {/* Microphone (Hidden during quiz for focus) */}
          {!quizStarted && (
            <button 
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all active:scale-90
                ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'}
              `}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? '⏹️' : '🎙️'}
            </button>
          )}

          {/* MAIN ACTION BUTTON */}
          <button 
            onClick={handleNext}
            className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95
              ${showQuizIntro || quizStarted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
            `}
          >
            {quizStarted 
              ? (isLastQuestion ? "Finish 🏁" : "Next Question ➡️")
              : (showQuizIntro ? "Start Quiz 🚀" : (isLastSlide ? "Take Quiz 📝" : "Next ➡️"))
            }
          </button>
        </div>
      )}

    </div>
  );
}