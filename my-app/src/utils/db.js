import { openDB } from 'idb';

const DB_NAME = 'tutor-db';
const STORE_NAME = 'history';

// 1. Initialize the Database
export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Create a store called 'history' with 'id' as the key
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// 2. Add a Topic to History
export const addToHistory = async (topic) => {
  const db = await initDB();
  // Don't save duplicates (optional logic)
  return db.add(STORE_NAME, {
    topic: topic.topic,
    timestamp: new Date(),
    summary: topic.summary
  });
};

// 3. Get All History
export const getHistory = async () => {
  const db = await initDB();
  return db.getAll(STORE_NAME);
};