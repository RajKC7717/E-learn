import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { getUser, getAllProgress } from '../utils/db'; // Import Local DB
import { useTranslation } from 'react-i18next';

export default function HomeworkTab({ onOpenTopic }) {
  const { i18n } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    loadData();
  }, [i18n.language]); // Reload if language changes

  async function loadData() {
    setLoading(true);
    
    const user = await getUser();
    if (!user) return;

    // 1. Load Topic Metadata (To open chapters)
    const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
    const jsonRes = await fetch(`/data/knowledge_${lang}.json`);
    const allTopics = await jsonRes.json();
    setTopics(allTopics);

    // 2. Load Local Progress (The "Truth")
    const localProgress = await getAllProgress();
    const completedTopicIds = localProgress
      .filter(p => p.isComplete)
      .map(p => p.topicId);

    // 3. Fetch Cloud Assignments
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        // --- THE ANTI-CHEAT LOGIC ---
        // We map over cloud assignments and check if they are actually done locally
        const syncedAssignments = await Promise.all(data.map(async (assignment) => {
          
          const isLocallyDone = completedTopicIds.includes(assignment.topic_id);
          
          // Case: Student finished task locally, but Cloud says 'pending'
          if (assignment.status === 'pending' && isLocallyDone) {
            console.log(`Auto-completing assignment: ${assignment.topic_title}`);
            
            // 1. Update Cloud silently
            await supabase
              .from('assignments')
              .update({ status: 'completed' })
              .eq('id', assignment.id);
            
            // 2. Update UI instantly
            return { ...assignment, status: 'completed' };
          }
          
          return assignment;
        }));

        setAssignments(syncedAssignments);
      }
      if (error) console.error("Error fetching homework:", error);
    }
    
    setLoading(false);
  }

  const handleStart = (assignment) => {
    const topicData = topics.find(t => t.id === assignment.topic_id);
    if (topicData) {
      onOpenTopic(topicData);
    } else {
      alert("Error: Topic content not found.");
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Homework 📝</h2>
        <button onClick={loadData} className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full active:scale-95 transition">
          🔄 Check Status
        </button>
      </div>

      {!navigator.onLine && (
        <div className="bg-orange-100 text-orange-700 p-4 rounded-xl text-sm font-bold border border-orange-200">
          ⚠️ Offline Mode: Assignments may not sync instantly.
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-10 text-gray-400">Verifying Completion...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-2xl">
          <span className="text-4xl">🎉</span>
          <p className="text-gray-500 font-bold mt-2">No homework assigned!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((item) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-2xl border-2 shadow-sm transition-all
                ${item.status === 'completed' 
                  ? 'bg-green-50 border-green-200 opacity-80' 
                  : 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-md'}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                    ${item.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-orange-100 text-orange-600'}`}>
                    {item.status}
                  </span>
                  <h3 className="font-bold text-lg text-blue-900 mt-1">{item.topic_title}</h3>
                  <p className="text-xs text-gray-400">Assigned: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                
                {/* ACTION BUTTON */}
                {item.status !== 'completed' ? (
                  <button 
                    onClick={() => handleStart(item)}
                    className="ml-4 bg-blue-600 text-white font-bold px-4 py-3 rounded-xl text-sm shadow-lg hover:bg-blue-700 active:scale-95 transition"
                  >
                    Start ▶
                  </button>
                ) : (
                  <div className="ml-4 flex flex-col items-center">
                    <span className="text-3xl">✅</span>
                    <span className="text-[10px] font-bold text-green-700 uppercase mt-1">Done</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}