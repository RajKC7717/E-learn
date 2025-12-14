import { useState, useEffect } from 'react';
import HomeTab from './components/HomeTab';
import SettingsTab from './components/SettingsTab';
import { useTranslation } from 'react-i18next'; // Import for translation

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-xs font-bold text-center py-1">
          ⚠️ You are Offline (App is fully functional)
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-extrabold text-blue-600 tracking-tight">
            {t('app_title')} 🎓
          </h1>
          <button className="p-2 bg-gray-100 rounded-full text-gray-500">
            🔔
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'home' ? <HomeTab /> : <SettingsTab />}
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