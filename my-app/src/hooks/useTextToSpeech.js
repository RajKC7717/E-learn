import { useState, useEffect, useRef } from 'react';

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef(window.speechSynthesis);
  const [voices, setVoices] = useState([]);

  // 1. Load available voices from the device
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.current.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    
    // Chrome/Android load voices asynchronously, so we must listen for the event
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const speak = (text, languageCode = 'en-US') => {
    // Cancel current speech
    if (synth.current.speaking) {
      synth.current.cancel();
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. INTELLIGENT VOICE SELECTION
    // Map 'hi' to 'hi-IN' for browser compatibility
    const targetLang = languageCode.startsWith('hi') ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;

    // Find a matching voice
    const matchingVoices = voices.filter(v => v.lang === targetLang);
    
    let selectedVoice = null;
    if (matchingVoices.length > 0) {
      // Try to find a female voice first (often labeled "Google Hindi" or "Lekha")
      const femaleVoice = matchingVoices.find(v => 
        v.name.includes('Female') || 
        v.name.includes('Google') || 
        v.name.includes('Lekha')
      );
      selectedVoice = femaleVoice || matchingVoices[0];
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log("Using voice:", selectedVoice.name);
    }

    // 3. Tweak speed/pitch slightly for Hindi to sound clearer
    if (targetLang === 'hi-IN') {
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
    } else {
        utterance.rate = 1.0;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
    };

    synth.current.speak(utterance);
  };

  const stop = () => {
    if (synth.current.speaking) {
      synth.current.cancel();
    }
    setIsSpeaking(false);
  };

  return { speak, stop, isSpeaking };
}