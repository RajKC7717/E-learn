import { useState } from 'react';
import { saveUser } from '../utils/db';

export default function LoginScreen({ onLogin }) {
  const [isTeacher, setIsTeacher] = useState(false);
  
  // Student State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('9');

  // Teacher State
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) return;

    const user = { 
      id: studentId.trim().toUpperCase(), 
      name, 
      grade,
      role: 'student' // <--- Tag as Student
    };
    
    await saveUser(user);
    onLogin(user);
  };

  const handleTeacherLogin = async (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple Password for Demo
      const user = { 
        id: 'TEACHER', 
        name: 'Teacher', 
        role: 'teacher' // <--- Tag as Teacher
      };
      // We don't save teacher to DB usually to avoid persistent login on shared devices, 
      // but for this demo, we can just pass it up.
      onLogin(user);
    } else {
      setError("❌ Wrong Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <span className="text-6xl">{isTeacher ? '👨‍🏫' : '🎓'}</span>
          <h1 className="text-3xl font-extrabold text-blue-900 mt-4">
            {isTeacher ? 'Teacher Panel' : 'Student Login'}
          </h1>
          <p className="text-gray-500 mt-2">
            {isTeacher ? 'Enter admin password to access.' : 'Enter your ID to track progress.'}
          </p>
        </div>

        {/* --- STUDENT FORM --- */}
        {!isTeacher && (
          <form onSubmit={handleStudentLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Student ID</label>
              <input 
                type="text" required
                className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-mono text-lg uppercase"
                placeholder="e.g. STD-101"
                value={studentId} onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input 
                type="text" required
                className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-bold text-lg"
                placeholder="e.g. Durgesh"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
              <select 
                value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-bold text-lg bg-white"
              >
                <option value="7">Class 7</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition">
              Start Learning 🚀
            </button>
          </form>
        )}

        {/* --- TEACHER FORM --- */}
        {isTeacher && (
          <form onSubmit={handleTeacherLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Admin Password</label>
              <input 
                type="password" required
                className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-bold text-lg"
                placeholder="••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm mt-2 font-bold">{error}</p>}
            </div>
            <button type="submit" className="w-full bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-800 active:scale-95 transition">
              Access Dashboard 🔓
            </button>
          </form>
        )}

        {/* TOGGLE BUTTON */}
        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsTeacher(!isTeacher); setError(''); }}
            className="text-gray-400 text-sm hover:text-blue-600 underline transition"
          >
            {isTeacher ? '← Back to Student Login' : 'Teacher Login'}
          </button>
        </div>

      </div>
    </div>
  );
}