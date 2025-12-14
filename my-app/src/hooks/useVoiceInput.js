import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next'; // <--- IMPORT ADDED

export function useVoiceInput() {
  const { i18n } = useTranslation(); // <--- GET CURRENT LANGUAGE
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
    recognition.interimResults = false;
    // Default to English initially, but we will override this on start
    recognition.lang = 'en-US'; 

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      // specific error for language mismatch or no speech
      if (event.error === 'no-speech') {
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
  }, []); // Run once on mount

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        // <--- CRITICAL UPDATE: Set language dynamically before starting --->
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

  return { 
    text, 
    isListening, 
    isLoading: false, 
    error, 
    startListening, 
    stopListening,
    resetText
  };
}