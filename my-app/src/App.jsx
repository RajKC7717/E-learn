import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUser } from './utils/db'; 

// Component Imports
import AiAssistant from './components/AiAssistant'; // <--- NEW IMPORT
import HomeTab from './components/HomeTab';
import ProfileTab from './components/ProfileTab';
import LoginScreen from './components/LoginScreen';
import MapTab from './components/MapTab';
import LearningMode from './components/LearningMode';
import TeacherDashboard from './components/TeacherDashboard'; 
import HomeworkTab from './components/HomeworkTab'; // <--- NEW IMPORT (Replaces Settings)

function App() {
  const { t, i18n } = useTranslation();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('map'); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // --- INIT LOGIC ---
  useEffect(() => {
    getUser().then(savedUser => {
      if (savedUser) setUser(savedUser);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- LANGUAGE TOGGLE HANDLER ---
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  // --- RENDER ---
  if (isLoading) return <div className="h-screen flex items-center justify-center text-gray-500 font-bold">Loading...</div>;
  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;
  
  if (user.role === 'teacher') {
    return (
      <TeacherDashboard 
        onLogout={() => { setUser(null); window.location.reload(); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs font-bold text-center py-1">
          ⚠️ You are Offline (App is fully functional)
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">
          {t('app_title')} 🎓
        </h1>
        
        {/* NEW LANGUAGE TOGGLE BUTTON */}
        <button 
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold border-2 border-blue-200 shadow-sm flex items-center justify-center text-sm hover:bg-blue-200 active:scale-95 transition"
        >
          {i18n.language.startsWith('en') ? 'HI' : 'EN'}
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-md mx-auto relative min-h-[80vh]">
        {activeTab === 'map' && <MapTab onOpenTopic={(topic) => setSelectedTopic(topic)} />}
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'homework' && (
  <HomeworkTab onOpenTopic={(topic) => setSelectedTopic(topic)} />
)}
      </main>

      {/* LEARNING MODE OVERLAY */}
      {selectedTopic && (
        <LearningMode 
           topic={selectedTopic} 
           onClose={() => setSelectedTopic(null)}
        />
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-20 pb-safe">
        
        {/* Learn */}
        <button 
          onClick={() => setActiveTab('map')} 
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🗺️</span>
          <span className="text-xs font-medium">Learn</span>
        </button>
      
        {/* Search */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🔍</span>
          <span className="text-xs font-medium">{t('home')}</span>
        </button>
        
        {/* Profile */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs font-medium">Profile</span>
        </button>

        {/* NEW: Homework Button */}
        <button 
          onClick={() => setActiveTab('homework')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'homework' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📝</span>
          <span className="text-xs font-medium">Work</span>
        </button>
      </nav>
      {user && user.role !== 'teacher' && <AiAssistant />}
    </div>
  );
}

export default App;