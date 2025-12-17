import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'; 
import { getUser } from './utils/db'; 

// --- PAGE IMPORTS ---
import MapPage from './components/MapTab'; // Ensure this path is correct
import MathMap from './pages/maps/MathMap';
import ScienceMap from './pages/maps/ScienceMap';
import ComputerMap from './pages/maps/ComputerMap';

// --- COMPONENT IMPORTS ---
import AiAssistant from './components/AiAssistant';
import HomeTab from './components/HomeTab';
import ProfileTab from './components/ProfileTab';
import LoginScreen from './components/LoginScreen';
import LearningMode from './components/LearningMode';
import TeacherDashboard from './components/TeacherDashboard'; 
import HomeworkTab from './components/HomeworkTab'; 

function App() {
  const { t, i18n } = useTranslation();
  
  // --- NAVIGATION HOOKS ---
  const navigate = useNavigate();
  const location = useLocation();
  
  // --- STATE ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // --- 1. INIT AUTH ---
  useEffect(() => {
    getUser().then(savedUser => {
      if (savedUser) setUser(savedUser);
      setIsLoading(false);
    });
  }, []);

  // --- 2. OFFLINE DETECTION ---
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

  // --- 3. LISTEN FOR MAP CLICKS (The Critical Part) ---
  useEffect(() => {
    // This listens for the "open-topic" event dispatched by GameMapBuilder
    const handleOpenTopic = (event) => {
      console.log("Opening Level:", event.detail.topic); 
      setSelectedTopic(event.detail); // This triggers the LearningMode popup
    };

    window.addEventListener('open-topic', handleOpenTopic);
    
    // Cleanup to prevent memory leaks
    return () => window.removeEventListener('open-topic', handleOpenTopic);
  }, []);
  useEffect(() => {
      if (location.state && location.state.openTopic) {
        console.log("Popup Triggered for:", location.state.openTopic.title);
        setSelectedTopic(location.state.openTopic);
        
        // Optional: Clear state so it doesn't reopen on refresh
        // navigate(location.pathname, { replace: true, state: {} });
      }
    }, [location]);

  // --- LANGUAGE TOGGLE ---
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('en') ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  // --- LOADING / LOGIN CHECKS ---
  if (isLoading) return <div className="h-screen flex items-center justify-center text-gray-400 font-bold">Loading...</div>;
  
  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;
  
  if (user.role === 'teacher') {
    return <TeacherDashboard onLogout={() => { setUser(null); window.location.reload(); }} />;
  }

  // --- MAIN APP RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs font-bold text-center py-1">
          ⚠️ You are Offline (App is fully functional)
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-40 flex justify-between items-center">
        <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">
          {t('app_title')} 🎓
        </h1>
        
        <button 
          onClick={toggleLanguage}
          className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold border-2 border-blue-200 shadow-sm flex items-center justify-center text-sm hover:bg-blue-200 active:scale-95 transition"
        >
          {i18n.language.startsWith('en') ? 'HI' : 'EN'}
        </button>
      </header>

      {/* ROUTER CONTENT AREA */}
      <main className="max-w-md mx-auto relative min-h-[80vh]">
        <Routes>
            {/* Redirect root "/" to "/map" */}
            <Route path="/" element={<Navigate to="/map" replace />} />

            {/* MAP SYSTEM ROUTES */}
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/math" element={<MathMap />} />
            <Route path="/map/science" element={<ScienceMap />} />
            <Route path="/map/computer" element={<ComputerMap />} />

            {/* OTHER TAB ROUTES */}
            <Route path="/home" element={<HomeTab />} />
            <Route path="/profile" element={<ProfileTab />} />
            
            {/* HOMEWORK TAB (Passes setSelectedTopic just in case it's used there too) */}
            <Route path="/homework" element={<HomeworkTab onOpenTopic={(topic) => setSelectedTopic(topic)} />} />
        </Routes>
      </main>

      {/* LEARNING MODE POPUP (Global Overlay) */}
      {selectedTopic && (
        <LearningMode 
           topic={selectedTopic} 
           onClose={() => setSelectedTopic(null)}
        />
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 pb-safe">
        
        {/* Learn Tab */}
        <button 
          onClick={() => navigate('/map')} 
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname.startsWith('/map') ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🗺️</span>
          <span className="text-xs font-medium">Learn</span>
        </button>
      
        {/* Search Tab */}
        <button 
          onClick={() => navigate('/home')}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/home' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🔍</span>
          <span className="text-xs font-medium">{t('home')}</span>
        </button>
        
        {/* Profile Tab */}
        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs font-medium">Profile</span>
        </button>

        {/* Homework Tab */}
        <button 
          onClick={() => navigate('/homework')}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/homework' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">📝</span>
          <span className="text-xs font-medium">Work</span>
        </button>
      </nav>

      {/* OFFLINE AI ASSISTANT (Only for students) */}
      {user && user.role !== 'teacher' && <AiAssistant />}
    </div>
  );
}

export default App;