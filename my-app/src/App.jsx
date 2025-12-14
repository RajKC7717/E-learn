import { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab';
import SettingsTab from './components/SettingsTab';
import ProfileTab from './components/ProfileTab'; // <--- Import ProfileTab
import LoginScreen from './components/LoginScreen';
import { useTranslation } from 'react-i18next';
import { getUser } from './utils/db'; 

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Auth State
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Login Status on Mount
  useEffect(() => {
    getUser().then(savedUser => {
      if (savedUser) setUser(savedUser);
      setIsLoading(false);
    });
  }, []);

  // 2. Network Status Listeners
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

  // 3. Render Logic (Loading -> Login -> App)
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <LoginScreen onLogin={(u) => setUser(u)} />;

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
        
        {/* Profile Avatar (Clickable to go to Profile Tab) */}
        <button 
          onClick={() => setActiveTab('profile')}
          className="w-8 h-8 bg-blue-100 rounded-full text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-200 shadow-sm"
        >
          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-20 pb-safe">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-medium">{t('home')}</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">👤</span>
          <span className="text-xs font-medium">Profile</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-xs font-medium">{t('config')}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;