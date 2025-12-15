import { useState } from 'react';
import { updateProgress } from '../utils/db'; // To save completion status
import confetti from 'canvas-confetti'; // Optional: You can install this for effects, or remove it.

export default function QuizMode({ topic, onFinish }) {
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // MCQ State
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Matching State
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]); // Stores IDs of correctly matched items

  const questions = topic.quiz || [];
  const currentQ = questions[qIndex];
  const isLastQuestion = qIndex === questions.length - 1;

  // --- MCQ LOGIC ---
  const handleMCQSubmit = () => {
    if (selectedOption === currentQ.answer) {
      setScore(s => s + 1);
      alert("✅ Correct!"); // Replace with Toast later if you want
    } else {
      alert(`❌ Wrong! Correct answer: ${currentQ.answer}`);
    }
    nextQuestion();
  };

  // --- MATCHING LOGIC ---
  const handleMatchClick = (side, value) => {
    // If clicking the same side again, just switch selection
    if (side === 'left') {
      setSelectedLeft(value);
      return;
    }

    // If clicking right side, we check if we have a left selected
    if (side === 'right' && selectedLeft) {
      // Find the correct pair from the JSON
      const correctPair = currentQ.pairs.find(p => p.left === selectedLeft);
      
      if (correctPair.right === value) {
        // MATCH!
        const newMatches = [...matchedPairs, selectedLeft, value];
        setMatchedPairs(newMatches);
        setSelectedLeft(null);

        // Check if all pairs are found
        if (newMatches.length === currentQ.pairs.length * 2) {
           setScore(s => s + 1);
           setTimeout(() => {
             alert("✅ All Matched!");
             nextQuestion();
           }, 500);
        }
      } else {
        // WRONG
        alert("❌ Not a match. Try again.");
        setSelectedLeft(null);
      }
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setMatchedPairs([]);
    setSelectedLeft(null);

    if (isLastQuestion) {
      finishQuiz();
    } else {
      setQIndex(prev => prev + 1);
    }
  };

  const finishQuiz = async () => {
    setShowResult(true);
    // Calculate Score (Pass if > 50%)
    const finalScore = score + (selectedOption === currentQ?.answer ? 1 : 0); // Add last answer if pending
    const passed = finalScore >= Math.ceil(questions.length / 2);

    if (passed) {
      // 1. Mark this topic as COMPLETE in DB
      await updateProgress(topic.id, 999, 999); // 999 forces "isComplete: true"
      
      // 2. Fire Confetti (Visual Reward)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (showResult) {
    const passed = score >= Math.ceil(questions.length / 2);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in zoom-in">
        <div className="text-6xl mb-4">{passed ? '🏆' : '😢'}</div>
        <h2 className="text-2xl font-bold mb-2">{passed ? 'Quiz Passed!' : 'Try Again'}</h2>
        <p className="text-gray-500 mb-6">You scored {score} out of {questions.length}</p>
        
        <button 
          onClick={onFinish}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg"
        >
          {passed ? 'Continue Map ➡️' : 'Retry Chapter ↺'}
        </button>
      </div>
    );
  }

  if (!currentQ) return <div className="p-10 text-center">No Quiz Available</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* HEADER */}
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <span className="font-bold text-gray-500">Quiz {qIndex + 1}/{questions.length}</span>
        <span className="text-blue-600 font-bold">Score: {score}</span>
      </div>

      {/* QUESTION BODY */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6">{currentQ.question}</h3>

        {/* --- RENDER MCQ --- */}
        {currentQ.type === 'mcq' && (
          <div className="space-y-3">
            {currentQ.options.map((opt) => (
              <button
                key={opt}
                onClick={() => setSelectedOption(opt)}
                className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all
                  ${selectedOption === opt 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white hover:bg-gray-100'}`}
              >
                {opt}
              </button>
            ))}
            <button 
              onClick={handleMCQSubmit}
              disabled={!selectedOption}
              className="w-full mt-6 py-3 bg-green-500 text-white font-bold rounded-xl disabled:opacity-50"
            >
              Check Answer
            </button>
          </div>
        )}

        {/* --- RENDER MATCHING --- */}
        {currentQ.type === 'match' && (
          <div className="flex justify-between gap-4">
            {/* Left Column */}
            <div className="flex flex-col gap-4 w-1/2">
              {currentQ.pairs.map(p => (
                <button
                  key={p.left}
                  disabled={matchedPairs.includes(p.left)}
                  onClick={() => handleMatchClick('left', p.left)}
                  className={`p-3 rounded-lg border-2 font-bold text-sm h-20 flex items-center justify-center
                    ${matchedPairs.includes(p.left) ? 'opacity-0' : ''} 
                    ${selectedLeft === p.left ? 'border-blue-500 bg-blue-100' : 'bg-white border-gray-200'}`}
                >
                  {p.left}
                </button>
              ))}
            </div>

            {/* Right Column (We assume they are randomized in JSON or randomize here) */}
            <div className="flex flex-col gap-4 w-1/2">
               {currentQ.pairs.map(p => (
                <button
                  key={p.right}
                  disabled={matchedPairs.includes(p.right)}
                  onClick={() => handleMatchClick('right', p.right)}
                  className={`p-3 rounded-lg border-2 font-bold text-sm h-20 flex items-center justify-center
                    ${matchedPairs.includes(p.right) ? 'opacity-0' : 'bg-white border-gray-200'}`}
                >
                  {p.right}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}