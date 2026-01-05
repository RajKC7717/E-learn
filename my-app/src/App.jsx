import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { getUser } from './utils/db'; 

// --- ONBOARDING COMPONENTS ---
import LanguageSelector from './components/onboarding/LanguageSelector';
import GameLoader from './components/onboarding/GameLoader';
import { LanguageProvider } from './context/LanguageContext';

// --- PAGE IMPORTS ---
import MapPage from './components/MapTab'; 
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

function AppContent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // --- APP STATE ---
  const [appState, setAppState] = useState('splash'); // splash | language | loader | login | app
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // --- 1. INITIAL BOOT CHECK ---
  useEffect(() => {
    async function checkStatus() {
      // Check Language
      const storedLang = localStorage.getItem('app_lang');
      
      // Check User
      const savedUser = await getUser();
      if (savedUser) setUser(savedUser);

      // DELAY FOR SPLASH SCREEN (1.5s)
      setTimeout(() => {
        if (!storedLang) {
          // Case A: First Time Ever -> Go to Language Selection
          setAppState('language');
        } else if (savedUser) {
          // Case B: Returning User -> Go to Game Loader
          // Ensure i18n is set to stored language
          if (i18n.language !== storedLang) {
            i18n.changeLanguage(storedLang);
          }
          setAppState('loader');
        } else {
          // Case C: Language set but Logged Out -> Go to Login
          if (i18n.language !== storedLang) {
            i18n.changeLanguage(storedLang);
          }
          setAppState('login');
        }
      }, 1500);
    }

    checkStatus();
  }, [i18n]);

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

  // --- 3. LISTEN FOR MAP CLICKS ---
  useEffect(() => {
    const handleOpenTopic = (event) => {
      console.log("Opening Level:", event.detail.topic); 
      setSelectedTopic(event.detail); 
    };
    window.addEventListener('open-topic', handleOpenTopic);
    return () => window.removeEventListener('open-topic', handleOpenTopic);
  }, []);

  // Handle Navigation State triggers
  useEffect(() => {
      if (location.state && location.state.openTopic) {
        console.log("Popup Triggered for:", location.state.openTopic.title);
        setSelectedTopic(location.state.openTopic);
      }
  }, [location]);


  // --- RENDER LOGIC BASED ON STATE ---

  // 0. SPLASH SCREEN
  if (appState === 'splash') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-bounce mb-4">
          <span className="text-8xl">🎓</span>
        </div>
        <h1 className="text-2xl font-bold text-blue-600 animate-pulse">EVOSOLVE</h1>
      </div>
    );
  }

  // 1. LANGUAGE SELECTOR (New User)
  if (appState === 'language') {
    return (
      <LanguageSelector 
        onComplete={() => setAppState('login')} 
      />
    );
  }

  // 2. GAME LOADER (Returning User)
  if (appState === 'loader') {
    return (
      <GameLoader 
        onFinish={() => setAppState('app')} 
      />
    );
  }

  // 3. LOGIN SCREEN
  if (appState === 'login') {
    return (
      <LoginScreen 
        onLogin={(u) => {
          setUser(u);
          setAppState('loader'); // Transition to loader after login
        }} 
      />
    );
  }

  // 4. TEACHER DASHBOARD
  if (user && user.role === 'teacher') {
    return <TeacherDashboard onLogout={() => { setUser(null); setAppState('login'); }} />;
  }

  // 5. MAIN APP (Student View)
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
          {t('app_title') || "EVOSOLVE"} 🎓
        </h1>
        
        {/* Language Toggle (Small version for persistent access) */}
        <button 
          onClick={() => {
            const newLang = i18n.language.startsWith('en') ? 'hi' : 'en';
            i18n.changeLanguage(newLang);
            localStorage.setItem('app_lang', newLang);
          }}
          className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-200 text-xs flex items-center justify-center"
        >
          {i18n.language.startsWith('en') ? 'HI' : 'EN'}
        </button>
      </header>

      {/* ROUTER CONTENT AREA */}
      <main className="max-w-md mx-auto relative min-h-[80vh]">
        <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/map/math" element={<MathMap />} />
            <Route path="/map/science" element={<ScienceMap />} />
            <Route path="/map/computer" element={<ComputerMap />} />
            <Route path="/home" element={<HomeTab />} />
            <Route path="/profile" element={<ProfileTab />} />
            <Route path="/homework" element={<HomeworkTab onOpenTopic={(topic) => setSelectedTopic(topic)} />} />
        </Routes>
      </main>

      {/* LEARNING MODE POPUP */}
      {selectedTopic && (
        <LearningMode 
           topic={selectedTopic} 
           onClose={() => setSelectedTopic(null)}
        />
      )}

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-50 pb-safe">
        <button onClick={() => navigate('/map')} className={`flex flex-col items-center gap-1 ${location.pathname.startsWith('/map') ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-2xl">🗺️</span>
          <span className="text-xs font-medium">Learn</span>
        </button>
        <button onClick={() => navigate('/home')} className={`flex flex-col items-center gap-1 ${location.pathname === '/home' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-2xl">🔍</span>
          <span className="text-xs font-medium">{t('home') || "Home"}</span>
        </button>
        <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-1 ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-2xl">👤</span>
          <span className="text-xs font-medium">Profile</span>
        </button>
        <button onClick={() => navigate('/homework')} className={`flex flex-col items-center gap-1 ${location.pathname === '/homework' ? 'text-blue-600' : 'text-gray-400'}`}>
          <span className="text-2xl">📝</span>
          <span className="text-xs font-medium">Work</span>
        </button>
      </nav>

      {/* AI ASSISTANT */}
      <AiAssistant />
    </div>
  );
}

// Wrap everything in the Language Provider
export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}