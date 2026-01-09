import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getUser, getAllProgress, getSyncPayload, logoutUser } from '../utils/db';
import { supabase } from '../utils/supabase'; 
import { useFileShare } from '../hooks/useFileShare';
import Toast from './Toast';

export default function ProfileTab() {
  const { t, i18n } = useTranslation();
  
  // State
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalRead: 0, completed: 0, bySubject: {} });
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const { shareApk, isSharing } = useFileShare();

  // --- 1. DATA LOADING FUNCTION (Reusable) ---
  const fetchProfileData = useCallback(async () => {
    const u = await getUser();
    setUser(u);

    if (!u) return;

    const progressData = await getAllProgress(); 
    
    // Load Topic Metadata
    const lang = i18n.language.startsWith('hi') ? 'hi' : 'en';
    let allTopics = [];
    try {
      const response = await fetch(`/data/knowledge_${lang}.json`);
      allTopics = await response.json();
    } catch (e) {
      console.error("Error loading topics", e);
    }

    // Calculate Stats
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
  }, [i18n.language]);

  // --- 2. INITIAL LOAD & LISTENERS ---
  useEffect(() => {
    // A. Load immediately
    fetchProfileData();

    // B. Listen for "progress-updated" event (Triggered when finishing a level)
    const handleUpdate = () => {
      console.log("♻️ Profile detected progress change. Updating...");
      fetchProfileData();
    };

    window.addEventListener('progress-updated', handleUpdate);
    
    // C. Update when user clicks back to this tab (Focus)
    window.addEventListener('focus', handleUpdate);

    return () => {
      window.removeEventListener('progress-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [fetchProfileData]);

  // --- 3. SYNC LOGIC ---
  const handleSync = async () => {
    if (!navigator.onLine) {
      setToast({ show: true, message: "⚠️ Connect to Internet to Sync", type: "error" });
      return;
    }

    setIsSyncing(true);
    try {
      const payload = await getSyncPayload();
      
      if (!payload) throw new Error("No data to sync");

      const { error } = await supabase
        .from('student_progress')
        .upsert({ 
          id: payload.student_id,
          name: payload.student_name,
          grade: payload.grade,
          completed_count: payload.completed_topics.length,
          last_sync: new Date(),
          raw_data: payload
        });

      if (error) throw error;

      setToast({ show: true, message: `✅ Synced to Cloud for ${payload.student_id}!`, type: "success" });
    } catch (error) {
      console.error(error);
      setToast({ show: true, message: "❌ Cloud Sync Failed.", type: "error" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logoutUser();
      window.location.reload(); 
    }
  };

  if (!user) return <div className="p-10 text-center">Loading Profile...</div>;

  return (
    <div className="p-4 space-y-6 animate-in slide-in-from-right duration-300">
      
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}

      {/* User Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
        {/* Sync Button */}
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 px-3 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm transition active:scale-95"
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

      {/* Subject Progress Bars */}
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
      {/* 3. ADD THIS SHARE BUTTON SECTION */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100">
        <h3 className="font-bold text-gray-800 mb-2">Share Offline App</h3>
        <p className="text-xs text-gray-500 mb-4">
          Send the app file to friends via Bluetooth so they can learn without internet.
        </p>
        
        <button 
          onClick={shareApk}
          disabled={isSharing}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition
            ${isSharing ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white shadow-lg active:scale-95'}
          `}
        >
          {isSharing ? (
            <span>📦 Preparing File...</span>
          ) : (
            <>
              <span className="text-xl">📡</span> Share via Bluetooth
            </>
          )}
        </button>
      </div>

      {/* Logout */}
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