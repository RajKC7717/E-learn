import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAllProgress } from '../utils/db';

export default function MapTab({ onOpenTopic }) {
  const { i18n } = useTranslation();
  const [topics, setTopics] = useState([]);
  const [progressMap, setProgressMap] = useState({}); // { 'sci_7_1': true, ... }

  useEffect(() => {
    async function load() {
      // 1. Load Topics
      const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
      const response = await fetch(`/data/knowledge_${lang}.json`);
      const data = await response.json();
      setTopics(data);

      // 2. Load Progress
      const savedProgress = await getAllProgress();
      const pMap = {};
      savedProgress.forEach(p => {
        if (p.isComplete) pMap[p.topicId] = true;
      });
      setProgressMap(pMap);
    }
    load();
  }, [i18n.language]);

  return (
    <div className="pb-24 pt-4 px-4 bg-green-50 min-h-screen">
      <div className="flex flex-col items-center space-y-8 relative">
        
        {/* Draw the connecting line (Simple CSS Hack) */}
        <div className="absolute top-0 bottom-0 w-2 bg-gray-200 z-0 rounded-full" />

        {topics.map((topic, index) => {
          // Logic: It is UNLOCKED if it is the first one OR the previous one is complete
          const isFirst = index === 0;
          const prevTopic = topics[index - 1];
          const isUnlocked = isFirst || (prevTopic && progressMap[prevTopic.id]);
          const isCompleted = progressMap[topic.id];

          return (
            <div key={topic.id} className="relative z-10 w-full flex justify-center">
              <button
                disabled={!isUnlocked}
                onClick={() => onOpenTopic(topic)}
                className={`
                  relative w-24 h-24 rounded-full border-b-8 transition-all active:border-b-0 active:translate-y-2
                  flex items-center justify-center shadow-xl
                  ${isCompleted 
                    ? 'bg-yellow-400 border-yellow-600 text-white' // Gold (Done)
                    : isUnlocked 
                      ? 'bg-green-500 border-green-700 text-white animate-bounce-slow' // Green (Current)
                      : 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed' // Grey (Locked)
                  }
                `}
              >
                {/* Icon inside the circle */}
                <span className="text-3xl font-bold">
                  {isCompleted ? '👑' : isUnlocked ? '★' : '🔒'}
                </span>

                {/* Level Number Badge */}
                <div className="absolute -top-2 -right-2 bg-white text-gray-800 text-xs font-bold w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center shadow-sm">
                  {index + 1}
                </div>
              </button>
              
              {/* Topic Label floating to the side */}
              <div className={`absolute top-6 ${index % 2 === 0 ? 'left-4 text-right pr-28' : 'right-4 text-left pl-28'} w-full pointer-events-none`}>
                <span className={`text-sm font-bold px-2 py-1 rounded bg-white/80 ${!isUnlocked && 'opacity-50'}`}>
                  {topic.topic}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}