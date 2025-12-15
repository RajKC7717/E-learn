import { useState, useEffect, useRef } from 'react';
import { useAiEngine } from '../hooks/useAiEngine';
import { useVoiceInput } from '../hooks/useVoiceInput';
import VoiceGuideModal from './VoiceGuideModal'; // <--- Import Modal

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { status, downloadProgress, loadingText, messages, isGenerating, initEngine, sendMessage } = useAiEngine();
  
  // Voice Hook
  const { isListening, text: voiceText, startListening, stopListening, error, clearError } = useVoiceInput();

  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [placeholder, setPlaceholder] = useState("Ask a doubt...");

  // Sync Voice Text
  useEffect(() => {
    if (isListening && voiceText) {
      setInput(voiceText);
    }
  }, [voiceText, isListening]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Placeholder Animation
  useEffect(() => {
    if (!isOpen) return;
    const phrases = ["Ask about Science...", "What is Gravity?", "Math doubt?"];
    let i = 0;
    const interval = setInterval(() => {
      setPlaceholder(phrases[i]);
      i = (i + 1) % phrases.length;
    }, 3000); 
    return () => clearInterval(interval);
  }, [isOpen]);

  const toggleChat = () => {
    if (!isOpen && status === 'idle') initEngine();
    setIsOpen(!isOpen);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    sendMessage(input);
    setInput("");
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      setInput(""); 
    }
  };

  return (
    <>
      {/* ERROR MODAL (Shows if Offline Voice Fails) */}
      {error === 'offline_missing' && (
        <VoiceGuideModal onClose={clearError} />
      )}

      {/* FLOATING ROBOT BUTTON */}
      <button 
        onClick={toggleChat}
        className={`fixed bottom-20 right-4 z-50 p-0 rounded-full shadow-2xl transition-all duration-300 active:scale-90
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}
      >
        <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-full flex items-center justify-center border-4 border-white">
          <span className="text-3xl">🤖</span>
        </div>
        {status === 'ready' && (
           <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 origin-bottom-right"
             style={{ height: '500px', maxHeight: '70vh' }}>
          
          {/* Header */}
          <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="font-bold leading-tight">AI Tutor</h3>
                <p className="text-[10px] text-blue-200">
                  {status === 'ready' ? '● Online (Offline Capable)' : '○ Initializing...'}
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="bg-blue-700 hover:bg-blue-800 p-2 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 bg-gray-50 overflow-y-auto p-4 space-y-4">
            
            {status === 'downloading' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <h3 className="font-bold text-gray-800 mb-2">Setting up Brain...</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                   <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                   <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">{downloadProgress}%</span>
                </div>
              </div>
            )}

            {status === 'ready' && (
              <>
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 mt-10">
                    <span className="text-4xl block mb-2">👋</span>
                    <p className="text-sm">Hi! I am your offline tutor.</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex justify-start">
                     <div className="bg-white border border-gray-200 p-3 rounded-2xl flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <div className="flex-1 relative">
              <input 
                disabled={status !== 'ready' || isGenerating}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : placeholder}
                className={`w-full bg-gray-100 rounded-full pl-4 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all
                  ${isListening ? 'ring-2 ring-red-400 bg-red-50' : ''}
                `}
              />
              <button 
                type="button"
                onClick={handleMicClick}
                disabled={status !== 'ready'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all cursor-pointer
                  ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-600'}
                `}
              >
                {isListening ? '⏹️' : '🎙️'}
              </button>
            </div>
            <button disabled={status !== 'ready' || isGenerating} type="submit" className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95 transition shadow-md">➤</button>
          </form>
        </div>
      )}
    </>
  );
}