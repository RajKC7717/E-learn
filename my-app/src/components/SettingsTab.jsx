import { useTranslation } from 'react-i18next';

export default function SettingsTab() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="font-bold text-xl mb-6 text-gray-800">{t('settings')}</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{t('language')}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => changeLanguage('en')}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${
                i18n.language.startsWith('en') 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-100 text-gray-600'
              }`}
            >
              🇺🇸 English
            </button>
            
            <button 
              onClick={() => changeLanguage('hi')}
              className={`p-3 rounded-xl border-2 font-bold transition-all ${
                i18n.language.startsWith('hi') 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-100 text-gray-600'
              }`}
            >
              🇮🇳 हिंदी
            </button>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
          <p>Note: Switching languages also changes the Offline Database.</p>
        </div>
      </div>
    </div>
  );
}