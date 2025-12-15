import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export function useVoiceInput() {
  const { i18n } = useTranslation();
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Browser not supported. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false; // We keep this false as per your code
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      // Safely access transcript
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      
      // --- NEW: DETECT OFFLINE ERROR ---
      if (event.error === 'network') {
        // This specific string triggers the Help Modal in AiAssistant.jsx
        setError('offline_missing'); 
      } 
      // --- END NEW ---
      else if (event.error === 'no-speech') {
        setError(i18n.language.startsWith('hi') ? "कुछ नहीं सुनाई दिया" : "Did not hear anything.");
      } else {
        setError(i18n.language.startsWith('hi') ? "त्रुटि। पुनः प्रयास करें।" : "Error. Try again.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [i18n.language]); // Dependency ensures language updates if needed

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        // Dynamic Language Set
        const currentLang = i18n.language.startsWith('hi') ? 'hi-IN' : 'en-US';
        recognitionRef.current.lang = currentLang;
        
        recognitionRef.current.start();
      } catch (e) {
        console.error("Start error:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetText = () => setText('');
  const clearError = () => setError(null); // Helper for the Modal Close button

  return { 
    text, 
    isListening, 
    isLoading: false, 
    error, 
    startListening, 
    stopListening,
    resetText,
    clearError // Exported for the Modal
  };
}