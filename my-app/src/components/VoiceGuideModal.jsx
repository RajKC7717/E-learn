export default function VoiceGuideModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

        {/* Icon */}
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-2xl">
          ⚠️
        </div>

        <h3 className="text-lg font-bold text-gray-800">Voice Not Working Offline?</h3>
        
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          Your phone needs a small file to understand you without internet.
        </p>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-xl p-4 mt-4 border border-gray-100 text-sm space-y-2">
          <p className="font-bold text-gray-700">How to enable it:</p>
          <ol className="list-decimal pl-4 space-y-1 text-gray-600">
            <li>Open your phone <b>Settings</b>.</li>
            <li>Search for <b>"Google Voice Typing"</b>.</li>
            <li>Tap <b>Offline Speech Recognition</b>.</li>
            <li>Download <b>English (India)</b> or <b>Hindi</b>.</li>
          </ol>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition"
        >
          Okay, I'll do it!
        </button>
      </div>
    </div>
  );
}