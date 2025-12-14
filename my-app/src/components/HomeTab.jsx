import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOfflineSearch } from '../hooks/useOfflineSearch';
import { useVoiceInput } from '../hooks/useVoiceInput';
import LearningMode from './LearningMode'; // <--- CHANGED THIS IMPORT
import { addToHistory, getHistory } from '../utils/db';

export default function HomeTab() {
  const { t } = useTranslation();
  const { query, setQuery, results, isReady } = useOfflineSearch();
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [history, setHistory] = useState([]);

  const { 
    text: voiceText, 
    isListening, 
    error: voiceError,
    startListening, 
    stopListening,
    resetText
  } = useVoiceInput();

  useEffect(() => {
    if (voiceText) {
      setQuery(voiceText);
      stopListening();
    }
  }, [voiceText]);

  useEffect(() => {
    getHistory().then(data => {
      // Sort by timestamp desc to show newest first
      const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setHistory(sorted.slice(0, 3));
    });
  }, [selectedTopic]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      resetText();
      startListening();
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. SEARCH BAR AREA */}
      <div className="relative z-0">
        <div className="flex justify-between items-center mb-2 px-1">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
             {t('app_title')}
           </span>
           
           {isReady ? (
             <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">
               {t('status_ready')}
             </span>
           ) : (
             <span className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full border border-yellow-200">
               {t('status_loading')}
             </span>
           )}
        </div>

        <div className="relative flex items-center">
          <input 
            type="text"
            className={`w-full p-4 pl-12 pr-12 rounded-2xl border-2 shadow-sm focus:outline-none transition text-lg 
              ${isListening ? 'border-red-400 bg-red-50' : 'border-blue-100 focus:border-blue-500'}`}
            placeholder={isListening ? t('mic_listening') : t('search_placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="absolute left-4 text-xl">🔍</span>
          
          <button 
            onClick={handleMicClick}
            className={`absolute right-3 p-2 rounded-full transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse shadow-red-300 shadow-lg' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">🎙️</span>
          </button>
        </div>

        {voiceError && (
          <p className="text-xs text-red-500 text-center mt-1 bg-red-50 p-1 rounded">
            ⚠️ {t('mic_error')}
          </p>
        )}
      </div>

      {/* 2. RESULTS LIST */}
      <div className="space-y-3 pb-20">
        {query === '' ? (
           <div className="text-center text-gray-500 mt-10">
             <p className="mb-4">{t('empty_search')}</p>
             <div className="flex flex-wrap justify-center gap-2">
               <button onClick={() => setQuery('Photosynthesis')} className="bg-white px-3 py-1 rounded-full shadow-sm text-sm border text-blue-600 hover:bg-blue-50">🌱 Photosynthesis</button>
               <button onClick={() => setQuery('Space')} className="bg-white px-3 py-1 rounded-full shadow-sm text-sm border text-blue-600 hover:bg-blue-50">🪐 Space</button>
             </div>
           </div>
        ) : results.length === 0 ? (
           <div className="text-center text-gray-500 mt-10">
             <p>{t('no_results')} "{query}"</p>
           </div>
        ) : (
           results.map((item) => (
             <div 
               key={item.id} 
               onClick={() => {
                 setSelectedTopic(item);
                 addToHistory(item);
               }}
               className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition cursor-pointer hover:shadow-md"
             >
               <h3 className="font-bold text-lg text-blue-800">{item.topic}</h3>
               <p className="text-gray-600 text-sm mt-1 line-clamp-2">{item.summary}</p>
             </div>
           ))
        )}
      </div>
      
      {/* 3. RECENTLY LEARNED SECTION */}
      {history.length > 0 && query === '' && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
             Recently Learned
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {history.map((h, idx) => (
              <div key={idx} className="min-w-[120px] bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="font-bold text-blue-800 text-sm truncate">{h.topic}</p>
                <p className="text-xs text-blue-600">{new Date(h.timestamp).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. NEW LEARNING MODE COMPONENT */}
      {selectedTopic && (
        <LearningMode 
          topic={selectedTopic} 
          onClose={() => setSelectedTopic(null)} 
        />
      )}
    </div>
  );
}