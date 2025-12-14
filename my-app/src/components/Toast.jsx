import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-500',
    info: 'bg-blue-600'
  };

  return (
    <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom fade-in duration-300 w-11/12 max-w-sm">
      <div className={`${bgColors[type]} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between`}>
        <span className="font-bold text-sm">{message}</span>
        <button onClick={onClose} className="ml-4 font-bold text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}