import { useState, useEffect } from 'react';

export function useOfflineSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allData, setAllData] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // 1. Load Data (Online First -> Fallback to Offline Cache)
  useEffect(() => {
    async function loadData() {
      try {
        // A. Try fetching fresh data
        const response = await fetch('/data/knowledge_en.json');
        if (!response.ok) throw new Error("Network error");
        
        const data = await response.json();
        
        // 🔥 SAVE to LocalStorage (Cache it!)
        localStorage.setItem('offline_content', JSON.stringify(data));
        
        setAllData(data);
        setIsReady(true);
        console.log("✅ Search Index Loaded (Online)");

      } catch (err) {
        // B. If Offline, Load from Backup
        console.warn("⚠️ Search going Offline. Loading cache...");
        const cached = localStorage.getItem('offline_content');
        
        if (cached) {
          setAllData(JSON.parse(cached));
          setIsReady(true);
          console.log("📂 Search Index Loaded (Offline Cache)");
        } else {
          console.error("❌ No offline data available for search.");
        }
      }
    }

    loadData();
  }, []);

  // 2. Perform Search whenever Query changes
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    if (!allData.length) return;

    const lowerQuery = query.toLowerCase();

    // Search Logic: Check Topic, Keywords, or Summary
    const filtered = allData.filter(item => {
      // Safety checks in case fields are missing
      const topic = (item.topic || '').toLowerCase();
      const summary = (item.summary || '').toLowerCase();
      const keywords = (item.keywords || []).map(k => k.toLowerCase());

      return (
        topic.includes(lowerQuery) || 
        summary.includes(lowerQuery) || 
        keywords.some(k => k.includes(lowerQuery))
      );
    });

    setResults(filtered);

  }, [query, allData]);

  return { query, setQuery, results, isReady };
}