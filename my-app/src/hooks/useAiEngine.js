import { useState, useRef, useCallback } from 'react';
import { CreateMLCEngine } from "@mlc-ai/web-llm";

// We use Qwen2-0.5B because it's the smartest "Tiny" model currently available (~360MB).
const MODEL_ID = "Qwen2-0.5B-Instruct-q4f16_1-MLC"; 

export function useAiEngine() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'downloading' | 'ready' | 'error'
  const [downloadProgress, setDownloadProgress] = useState(0); // 0 to 100
  const [loadingText, setLoadingText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const engineRef = useRef(null);

  // 1. Initialize & Download Model
  const initEngine = useCallback(async () => {
    if (engineRef.current) {
        setStatus('ready');
        return;
    }

    try {
      setStatus('downloading');
      
      // Request persistent storage so browser doesn't delete the 360MB cache
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }

      const engine = await CreateMLCEngine(
        MODEL_ID,
        {
          initProgressCallback: (info) => {
            setLoadingText(info.text);
            // Parse percentage from the text log (e.g., "Fetching param... 20%")
            // This is a simple heuristic; info.progress is better if available
            if (info.progress) {
                setDownloadProgress(Math.round(info.progress * 100));
            }
          }
        }
      );

      engineRef.current = engine;
      setStatus('ready');
    } catch (err) {
      console.error("AI Engine Load Failed:", err);
      setStatus('error');
    }
  }, []);

  // 2. Send Message
  const sendMessage = async (text) => {if (!engineRef.current) return;

    setIsGenerating(true);

    // Add User Message to State
    const newUserMsg = { role: 'user', content: text };
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);

    try {
      // Run Inference
      const response = await engineRef.current.chat.completions.create({
        messages: [
            // --- UPDATED SYSTEM PROMPT ---
            { 
              role: "system", 
              content: "You are a concise tutor. Answer in strictly 3-4 lines maximum. Use simple language." 
            }, 
            ...newHistory
        ],
        temperature: 0.7,
        max_tokens: 150, // <--- FORCE STOP after ~100 words
      });

      const reply = response.choices[0].message.content;
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (err) {
      console.error("Generation Failed:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "⚠️ Error. Try again." }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return { 
    status, 
    downloadProgress, 
    loadingText, 
    messages, 
    isGenerating, 
    initEngine, 
    sendMessage 
  };
}