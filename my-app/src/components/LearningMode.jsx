import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { updateProgress } from '../utils/db'; // Connect to DB

export default function LearningMode({ topic, onClose }) {
  const { t, i18n } = useTranslation();
  const { speak, stop, isSpeaking } = useTextToSpeech();
  
  // State for current page (starts at 0)
  const [pageIndex, setPageIndex] = useState(0);

  // Normalize data: specific handle for "New" (pages) vs "Old" (detail) structure
  const pages = topic?.pages || [{ title: topic?.topic, content: topic?.detail }];
  const totalPages = pages.length;
  const currentPage = pages[pageIndex];

  // Effect: Save progress whenever page changes
  useEffect(() => {
    if (topic?.id) {
      updateProgress(topic.id, pageIndex, totalPages);
    }
    stop(); // Stop speaking when turning page
  }, [pageIndex, topic]);

  // Navigation Handlers
  const handleNext = () => {
    if (pageIndex < totalPages - 1) {
      setPageIndex(prev => prev + 1);
    } else {
      onClose(); // Close on finish
    }
  };

  const handlePrev = () => {
    if (pageIndex > 0) setPageIndex(prev => prev - 1);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      stop();
    } else {
      // Read Title + Content of current page
      const textToRead = `${currentPage.title}. ${currentPage.content}`;
      speak(textToRead, i18n.language);
    }
  };

  if (!topic) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* 1. HEADER (Progress Bar & Close) */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex flex-col">
          <h2 className="font-bold text-lg text-blue-900 truncate max-w-[200px]">
            {topic.topic}
          </h2>
          <span className="text-xs text-gray-500">
            Page {pageIndex + 1} of {totalPages}
          </span>
        </div>
        <button onClick={() => { stop(); onClose(); }} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
          ✕
        </button>
      </div>

      {/* Progress Bar Visual */}
      <div className="w-full bg-gray-200 h-1.5">
        <div 
          className="bg-green-500 h-1.5 transition-all duration-300" 
          style={{ width: `${((pageIndex + 1) / totalPages) * 100}%` }}
        />
      </div>

      {/* 2. MAIN CONTENT (Scrollable Page) */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <div className="max-w-md w-full space-y-6">
          {currentPage.title && (
            <h3 className="text-2xl font-bold text-blue-800 text-center mb-4">
              {currentPage.title}
            </h3>
          )}
          <div className="text-lg text-gray-700 leading-loose bg-white p-2">
            {currentPage.content}
          </div>
        </div>
      </div>

      {/* 3. FOOTER CONTROLS */}
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-4">
        <button 
          onClick={handlePrev}
          disabled={pageIndex === 0}
          className={`p-3 rounded-xl font-bold flex-1 border-2 
            ${pageIndex === 0 ? 'border-gray-200 text-gray-300' : 'border-blue-100 text-blue-600'}`}
        >
          ⬅️ Prev
        </button>

        <button 
          onClick={handleSpeak}
          className={`p-4 rounded-full shadow-lg transition-all
            ${isSpeaking ? 'bg-red-100 text-red-600 animate-pulse border-2 border-red-500' : 'bg-blue-600 text-white'}`}
        >
          {isSpeaking ? '⏹️' : '🔊'}
        </button>

        <button 
          onClick={handleNext}
          className="p-3 rounded-xl font-bold flex-1 bg-blue-600 text-white shadow-md active:bg-blue-700"
        >
          {pageIndex === totalPages - 1 ? 'Finish ✅' : 'Next ➡️'}
        </button>
      </div>
    </div>
  );
}