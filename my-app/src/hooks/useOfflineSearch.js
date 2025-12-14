import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useTranslation } from 'react-i18next'; // Import hook

export function useOfflineSearch() {
  const { i18n } = useTranslation(); // Get current language
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [database, setDatabase] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // 1. Load the correct JSON when language changes
  useEffect(() => {
    setIsReady(false);
    
    // Determine file based on language (default to 'en')
    const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
    const fileName = `/data/knowledge_${lang}.json`;

    fetch(fileName)
      .then(res => res.json())
      .then(data => {
        setDatabase(data);
        setIsReady(true);
      })
      .catch(err => console.error(`Failed to load ${fileName}:`, err));
  }, [i18n.language]); // Re-run when language changes

  // 2. Setup Fuse (same as before)
  const fuseOptions = {
    keys: ['topic', 'keywords'],
    threshold: 0.4,
  };

  useEffect(() => {
    if (!query || !isReady) {
      setResults([]);
      return;
    }
    const fuse = new Fuse(database, fuseOptions);
    const searchResults = fuse.search(query);
    setResults(searchResults.map(result => result.item));
  }, [query, database, isReady]);

  return { query, setQuery, results, isReady };
}