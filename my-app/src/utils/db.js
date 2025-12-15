import { openDB } from 'idb';

const DB_NAME = 'tutor-lms-db';
const V = 3; // Version bumped to 3 for schema changes

export const initDB = async () => {
  return openDB(DB_NAME, V, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('history')) {
        db.createObjectStore('history', { keyPath: 'uniqueId' }); // Changed key
      }
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'uniqueId' }); // Changed key
      }
    },
  });
};

// --- HELPER: Get Current User ID ---
const getCurrentUserId = async () => {
  const db = await initDB();
  const users = await db.getAll('user');
  return users.length > 0 ? users[0].id : null;
};

// --- USER FUNCTIONS ---
export const saveUser = async (user) => {
  const db = await initDB();
  await db.clear('user'); // Ensure only 1 active user at a time
  return db.put('user', user);
};

export const getUser = async () => {
  const db = await initDB();
  const users = await db.getAll('user');
  return users.length > 0 ? users[0] : null;
};

export const logoutUser = async () => {
  const db = await initDB();
  return db.clear('user'); 
  // NOTE: We do NOT clear progress/history here. 
  // It stays saved safely for when they login again.
};

// --- HISTORY FUNCTIONS (User Specific) ---
export const addToHistory = async (topic) => {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const db = await initDB();
  // Create a composite ID: "STD-101_sci_7_1"
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
  // FILTER: Only return history for THIS user
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
  // FILTER: Only return progress for THIS user
  return allProgress.filter(p => p.studentId === userId);
};

export const getSyncPayload = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const db = await initDB();
  const user = await getUser();
  
  // Get RAW data and filter manually
  const allProgress = await db.getAll('progress');
  const userProgress = allProgress.filter(p => p.studentId === userId);

  const allHistory = await db.getAll('history');
  const userHistory = allHistory.filter(h => h.studentId === userId);

  return {
    student_id: user.id,
    student_name: user.name,
    grade: user.grade,
    last_sync: new Date().toISOString(),
    // Simplify for the teacher dashboard
    completed_topics: userProgress.filter(p => p.isComplete).map(p => p.topicId),
    learning_history: userHistory.map(h => ({ topic: h.topic, time: h.timestamp })),
    raw_progress: userProgress
  };
};

// --- TEACHER DASHBOARD FUNCTIONS ---
export const saveTeacherData = async (studentsList) => {
  const db = await initDB();
  // We use a simple key-value pair in the 'user' store for now, 
  // or ideally create a new store. But let's reuse 'user' store with a special ID to keep it simple.
  return db.put('user', { id: 'teacher_data_store', data: studentsList });
};

export const getTeacherData = async () => {
  const db = await initDB();
  const record = await db.get('user', 'teacher_data_store');
  return record ? record.data : [];
};