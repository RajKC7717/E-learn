import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BattleMode() {
  const navigate = useNavigate();
  
  // Game State
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
  
  // Feedback State
  const [roundResult, setRoundResult] = useState(null); 
  // Structure: { correctIndex: number, clickedIndex: number, clicker: 1|2, isCorrect: boolean }

  // 1. Load, Filter & Normalize Questions
  useEffect(() => {
    async function initGame() {
      let allData = [];
      const cached = localStorage.getItem('offline_content');
      
      // Load Data
      if (cached) {
        allData = JSON.parse(cached);
      } else {
        try {
          const res = await fetch('/data/knowledge_en.json');
          allData = await res.json();
        } catch (e) {
          console.error("No data found");
        }
      }

      let pool = [];

      // Process Data
      allData.forEach(topic => {
        if (topic.quiz) {
          // A. Filter ONLY 'mcq' types
          const mcqs = topic.quiz.filter(q => q.type === 'mcq');
          
          // B. Normalize Data (Find the index of the correct answer string)
          const processed = mcqs.map(q => {
            // Your JSON has "answer": "Some text". We need to find which Option index that is.
            const correctIdx = q.options.findIndex(opt => opt === q.answer);
            return {
                ...q,
                correctIndex: correctIdx // Store the number index for game logic
            };
          });

          pool = [...pool, ...processed];
        }
      });

      // C. Shuffle and pick 10 valid questions
      // Filter out any broken questions where index wasn't found (-1)
      const validPool = pool.filter(q => q.correctIndex !== -1);
      const selected = validPool.sort(() => 0.5 - Math.random()).slice(0, 10);
      
      setQuestions(selected);
      setGameState('ready');
    }
    initGame();
  }, []);

  // 2. Handle Answer Click
  const handleAnswer = (player, selectedIndex) => {
    if (roundResult) return; // Prevent double clicks

    const q = questions[currentQ];
    const isCorrect = selectedIndex === q.correctIndex;

    // Update Scores
    if (isCorrect) {
       if (player === 1) setP1Score(s => s + 1);
       else setP2Score(s => s + 1);
    }

    // Set Result Logic
    setRoundResult({
        clicker: player,       // Who clicked?
        isCorrect: isCorrect,  // Did they get it right?
        clickedIndex: selectedIndex,
        correctIndex: q.correctIndex
    });

    // Delay for Next Question
    setTimeout(() => {
      if (currentQ < 9) {
        setCurrentQ(c => c + 1);
        setRoundResult(null); 
      } else {
        setGameState('finished');
      }
    }, 2000);
  };

  // --- HELPER: Get Button Color ---
  const getButtonClass = (index) => {
     if (!roundResult) return "bg-white border-2 border-gray-200 text-gray-800"; // Default

     // Always Green for Correct Answer (calculated from JSON string)
     if (index === roundResult.correctIndex) {
         return "bg-green-500 border-green-600 text-white font-black scale-105 shadow-xl ring-4 ring-green-200";
     }

     // Red for Wrong Click
     if (index === roundResult.clickedIndex && !roundResult.isCorrect) {
         return "bg-red-500 border-red-600 text-white opacity-80";
     }

     return "bg-gray-100 text-gray-400 opacity-40";
  };

  // --- HELPER: Get Pop-Up Message ---
  const getPopupMessage = (thisPlayer) => {
      if (!roundResult) return null;

      const { clicker, isCorrect } = roundResult;
      
      // Case 1: I clicked
      if (clicker === thisPlayer) {
          if (isCorrect) return <div className="text-green-500 text-6xl font-black drop-shadow-lg animate-bounce">CORRECT! <span className="text-4xl block mt-2 text-white">+1 Point</span></div>;
          return <div className="text-red-500 text-6xl font-black drop-shadow-lg animate-shake">WRONG! ❌</div>;
      } 
      
      // Case 2: Opponent clicked
      else {
          if (isCorrect) return <div className="text-red-400 text-4xl font-bold drop-shadow-md">OPPONENT WON! 🚀</div>;
          return <div className="text-green-400 text-4xl font-bold drop-shadow-md">OPPONENT MISSED! 🍀</div>;
      }
  };


  // --- RENDERERS ---

  if (gameState === 'loading') return <div className="h-screen flex items-center justify-center font-bold">Preparing Arena...</div>;

  if (gameState === 'ready') return (
    <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
      <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 animate-pulse">VS DUEL</h1>
      <p className="text-gray-400">Place phone between players.</p>
      <div className="w-full h-32 flex gap-4">
         <div className="flex-1 bg-red-900/30 border-2 border-red-500 rounded-xl flex items-center justify-center font-bold text-red-500 rotate-180">P1</div>
         <div className="flex-1 bg-blue-900/30 border-2 border-blue-500 rounded-xl flex items-center justify-center font-bold text-blue-500">P2</div>
      </div>
      <button onClick={() => setGameState('playing')} className="px-8 py-4 bg-yellow-500 text-black font-black text-xl rounded-full shadow-lg hover:scale-105 transition">START ⚔️</button>
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500">Back</button>
    </div>
  );

  if (gameState === 'finished') {
    const winner = p1Score > p2Score ? 'RED' : p2Score > p1Score ? 'BLUE' : 'DRAW';
    return (
      <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
        <h1 className="text-6xl mb-4">🏆</h1>
        <h2 className="text-4xl font-black mb-4">
            {winner === 'RED' && <span className="text-red-500">RED WINS!</span>}
            {winner === 'BLUE' && <span className="text-blue-500">BLUE WINS!</span>}
            {winner === 'DRAW' && <span className="text-gray-300">IT'S A DRAW!</span>}
        </h2>
        <div className="text-2xl font-mono mb-8 bg-slate-800 p-6 rounded-xl flex gap-8">
            <div className="text-red-500">RED: {p1Score}</div>
            <div className="text-blue-500">BLUE: {p2Score}</div>
        </div>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-bold rounded-full">Rematch</button>
        <button onClick={() => navigate('/map')} className="mt-4 text-gray-500">Exit</button>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return <div>Loading...</div>;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-gray-900 relative">
      
      {/* --- PLAYER 1 (TOP - ROTATED) --- */}
      <div className="flex-1 bg-red-50 relative flex flex-col justify-center p-4 rotate-180 border-b-4 border-black">
        <div className="absolute top-4 left-4 text-5xl font-black text-red-200 opacity-50">{p1Score}</div>
        
        {/* BIG POP-UP OVERLAY P1 */}
        {roundResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                {getPopupMessage(1)}
            </div>
        )}

        <h3 className="text-center font-bold text-gray-800 mb-4 text-lg leading-snug">{q.question}</h3>
        <div className="grid grid-cols-2 gap-3">
          {q.options?.map((opt, i) => (
            <button 
              key={i}
              onClick={() => handleAnswer(1, i)}
              className={`p-4 rounded-xl font-bold transition shadow-sm text-sm ${getButtonClass(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* --- CENTER BAR --- */}
      <div className="h-4 bg-black flex items-center justify-center z-20">
         <div className="bg-gray-800 text-white px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest border border-gray-600">
            ROUND {currentQ + 1}/10
         </div>
      </div>

      {/* --- PLAYER 2 (BOTTOM - NORMAL) --- */}
      <div className="flex-1 bg-blue-50 relative flex flex-col justify-center p-4">
        <div className="absolute top-4 right-4 text-5xl font-black text-blue-200 opacity-50">{p2Score}</div>

        {/* BIG POP-UP OVERLAY P2 */}
        {roundResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                {getPopupMessage(2)}
            </div>
        )}

        <h3 className="text-center font-bold text-gray-800 mb-4 text-lg leading-snug">{q.question}</h3>
        <div className="grid grid-cols-2 gap-3">
          {q.options?.map((opt, i) => (
            <button 
              key={i}
              onClick={() => handleAnswer(2, i)}
              className={`p-4 rounded-xl font-bold transition shadow-sm text-sm ${getButtonClass(i)}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}