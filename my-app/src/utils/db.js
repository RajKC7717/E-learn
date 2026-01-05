import { openDB } from 'idb';
import { supabase } from './supabase';

const DB_NAME = 'tutor-lms-db';
const V = 3; // Version 3

export const initDB = async () => {
  return openDB(DB_NAME, V, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'uniqueId' });
      }
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'uniqueId' });
      }
    },
  });
};

// --- HELPER: Get Current User ID ---
const getCurrentUserId = async () => {
  const db = await initDB();
  const users = await db.getAll('user');
  // Filter out the special teacher data store if it exists
  const activeUser = users.find(u => u.id !== 'teacher_data_store');
  return activeUser ? activeUser.id : null;
};

// --- USER FUNCTIONS ---
export const saveUser = async (user) => {
  const db = await initDB();
  // We don't want to clear 'teacher_data_store', so we just put the user
  // If you want to force single user, ensure you delete old user entries specifically
  // But for now, put is safe.
  return db.put('user', user);
};

export const getUser = async () => {
  const db = await initDB();
  const users = await db.getAll('user');
  // Return the first user that isn't the teacher data blob
  const user = users.find(u => u.id !== 'teacher_data_store');
  return user || null;
};

export const logoutUser = async () => {
  const db = await initDB();
  // Only delete the active user, preserve teacher data if needed
  const user = await getUser();
  if (user) {
    await db.delete('user', user.id);
  }
  return;
};

// --- HISTORY FUNCTIONS (User Specific) ---
export const addToHistory = async (topic) => {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const db = await initDB();
  const uniqueId = `${userId}_${topic.id}`;

  return db.put('history', {
    uniqueId,
    studentId: userId,
    topicId: topic.id,
    topic: topic.topic,
    subject: topic.subject,
    timestamp: new Date(),
    summary: topic.summary
  });
};

export const getHistory = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const db = await initDB();
  const allHistory = await db.getAll('history');
  return allHistory.filter(h => h.studentId === userId);
};

// --- PROGRESS FUNCTIONS (User Specific) ---
export const updateProgress = async (topicId, pageIndex, totalPages) => {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const db = await initDB();
  const uniqueId = `${userId}_${topicId}`;
  const isComplete = pageIndex >= totalPages - 1;
  const percentage = Math.round(((pageIndex + 1) / totalPages) * 100);

  return db.put('progress', {
    uniqueId,
    studentId: userId,
    topicId,
    lastPageIndex: pageIndex,
    percentage,
    isComplete,
    lastUpdated: new Date()
  });
};

export const getTopicProgress = async (topicId) => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const db = await initDB();
  return db.get('progress', `${userId}_${topicId}`);
};

export const getAllProgress = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const db = await initDB();
  const allProgress = await db.getAll('progress');
  return allProgress.filter(p => p.studentId === userId);
};

export const getSyncPayload = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const db = await initDB();
  const user = await getUser();
  
  const allProgress = await db.getAll('progress');
  const userProgress = allProgress.filter(p => p.studentId === userId);

  const allHistory = await db.getAll('history');
  const userHistory = allHistory.filter(h => h.studentId === userId);

  return {
    student_id: user.id,
    student_name: user.name,
    grade: user.grade,
    last_sync: new Date().toISOString(),
    completed_topics: userProgress.filter(p => p.isComplete).map(p => p.topicId),
    learning_history: userHistory.map(h => ({ topic: h.topic, time: h.timestamp })),
    raw_progress: userProgress
  };
};

// --- TEACHER DASHBOARD FUNCTIONS ---
export const saveTeacherData = async (studentsList) => {
  const db = await initDB();
  return db.put('user', { id: 'teacher_data_store', data: studentsList });
};

export const getTeacherData = async () => {
  const db = await initDB();
  const record = await db.get('user', 'teacher_data_store');
  return record ? record.data : [];
};

// --- 🔥 FIXED: MARK TOPIC AS COMPLETED (Uses IDB now) ---
export const markTopicAsCompleted = async (topicId) => {
  // 1. Get User from IDB
  const user = await getUser();
  if (!user) return;

  const currentProgress = user.progress || [];

  // 2. Update if not already completed
  if (!currentProgress.includes(topicId)) {
    const newProgressList = [...currentProgress, topicId];
    
    const updatedUser = {
      ...user,
      progress: newProgressList
    };
    
    // 3. Save back to IDB (IMPORTANT: This fixes the sync issue)
    await saveUser(updatedUser);
    
    // 4. Dispatch Event for UI
    const event = new CustomEvent('progress-updated', { detail: newProgressList });
    window.dispatchEvent(event);
    
    console.log(`✅ Level ${topicId} saved to IDB. Progress:`, newProgressList);
    return updatedUser;
  }
};
export const syncProgressToCloud = async () => {
  if (!navigator.onLine) {
    console.log("📴 Offline. Skipping sync.");
    return { success: false, message: "Offline" };
  }

  const user = await getUser();
  if (!user || !user.id || user.id === 'TEACHER') return; // Don't sync teachers or guests

  try {
    console.log("☁️ Syncing to Supabase...");

    // 1. Prepare Data
    const payload = {
      id: user.id,                // Matches your schema (text)
      name: user.name,            // Matches your schema (text)
      grade: user.grade,          // Matches your schema (text)
      completed_count: (user.progress || []).length, // Matches (int4)
      last_sync: new Date().toISOString(), // Matches (timestamptz)
      raw_data: user // Matches (jsonb) - We save EVERYTHING here as backup
    };

    // 2. Send to Supabase (Upsert = Insert or Update)
    const { error } = await supabase
      .from('student_progress')
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    console.log("✅ Sync Successful!");
    return { success: true, time: new Date() };

  } catch (err) {
    console.error("❌ Sync Failed:", err.message);
    return { success: false, message: err.message };
  }
};