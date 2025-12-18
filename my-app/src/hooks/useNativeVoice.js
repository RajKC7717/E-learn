import { useState, useEffect, useRef } from 'react';

export function useNativeVoice() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // 1. Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn("Browser does not support Speech API");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening even after pausing
    recognition.interimResults = true; // Show text while speaking
    recognition.lang = 'en-IN'; // Default to English (India)

    // 2. Handle Results
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          // You can also capture interim results if needed
          // finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setText(finalTranscript);
        console.log("🎤 Heard:", finalTranscript);
      }
    };

    // 3. Handle Errors/End
    recognition.onerror = (event) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // If we want it to be "Always On", restart it here.
      // For now, we just stop the UI state.
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = (lang = 'en-IN') => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = lang; // Switch to 'hi-IN' if needed
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Already started or error:", e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetText = () => setText('');

  return { text, isListening, startListening, stopListening, resetText };
}