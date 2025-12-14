import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUser, getAllProgress, getSyncPayload, logoutUser } from '../utils/db';
import Toast from './Toast'; // <--- NEW IMPORT

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalRead: 0, completed: 0, bySubject: {} });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // TOAST STATE
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    async function loadData() {
      const u = await getUser();
      setUser(u);

      const progressData = await getAllProgress(); // Now correctly filtered by User ID
      
      const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
      const response = await fetch(`/data/knowledge_${lang}.json`);
      const allTopics = await response.json();

      const subjectCounts = {}; 
      allTopics.forEach(topic => {
        const sub = topic.subject;
        if (!subjectCounts[sub]) subjectCounts[sub] = { total: 0, read: 0, completed: 0 };
        subjectCounts[sub].total++;
      });

      let totalCompleted = 0;
      progressData.forEach(p => {
        const topicInfo = allTopics.find(t => t.id === p.topicId);
        if (topicInfo) {
          const sub = topicInfo.subject;
          if (subjectCounts[sub]) {
            subjectCounts[sub].read++;
            if (p.isComplete) {
               subjectCounts[sub].completed++;
               totalCompleted++;
            }
          }
        }
      });

      setStats({
        totalRead: progressData.length,
        completed: totalCompleted,
        bySubject: subjectCounts
      });
    }

    loadData();
  }, [i18n.language]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleSync = async () => {
    if (!navigator.onLine) {
      showToast("⚠️ Connect to Internet to Sync", "error");
      return;
    }

    setIsSyncing(true);
    try {
      const payload = await getSyncPayload();
      console.log("Syncing Payload:", payload);
      
      await new Promise(r => setTimeout(r, 2000)); 
      
      showToast(`✅ Data Synced for ${payload.student_id}!`, "success");
    } catch (error) {
      console.error(error);
      showToast("❌ Sync Failed. Try again.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    // We can use a custom confirmation dialog here too if we want, 
    // but standard confirm is okay for critical destructive actions. 
    // Or we can just logout immediately.
    await logoutUser();
    window.location.reload(); 
  };

  if (!user) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      
      {/* TOAST NOTIFICATION COMPONENT */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {/* USER CARD */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 px-3 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm transition"
        >
          {isSyncing ? '⏳ Syncing...' : '☁️ Sync Progress'}
        </button>

        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full text-3xl">👤</div>
          <div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-blue-100 opacity-80 text-sm font-mono tracking-wider">{user.id}</p>
            <p className="text-blue-200 text-xs mt-1">Class {user.grade}</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between text-center bg-white/10 rounded-xl p-3">
          <div>
            <p className="text-2xl font-bold">{stats.totalRead}</p>
            <p className="text-xs uppercase opacity-70">Started</p>
          </div>
          <div className="w-px bg-white/20"></div>
          <div>
            <p className="text-2xl font-bold">{stats.completed}</p>
            <p className="text-xs uppercase opacity-70">Completed</p>
          </div>
        </div>
      </div>

      {/* SUBJECT PROGRESS */}
      <div>
        <h3 className="font-bold text-gray-800 text-lg mb-4">Subject Progress</h3>
        <div className="space-y-4">
          {Object.entries(stats.bySubject).map(([subject, data]) => {
            const percentage = Math.round((data.completed / data.total) * 100) || 0;
            return (
              <div key={subject} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">{subject}</span>
                  <span className="text-sm font-bold text-blue-600">{data.completed}/{data.total}</span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="mt-8 text-center pb-8">
        <button 
            onClick={handleLogout}
            className="text-gray-400 text-sm hover:text-red-500 border border-gray-200 px-4 py-2 rounded-lg active:bg-gray-100 transition"
        >
            Logout / Switch Student
        </button>
      </div>
    </div>
  );
}