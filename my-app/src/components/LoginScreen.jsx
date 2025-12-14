import { useState } from 'react';
import { saveUser } from '../utils/db';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(''); // <--- NEW UNIQUE ID
  const [grade, setGrade] = useState('9');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !studentId.trim()) return;

    // We save the ID so we can tag all progress with it
    const user = { 
      id: studentId.trim().toUpperCase(), // Force Uppercase for consistency
      name, 
      grade 
    };
    
    await saveUser(user);
    onLogin(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <span className="text-6xl">🎓</span>
          <h1 className="text-3xl font-extrabold text-blue-900 mt-4">Student Login</h1>
          <p className="text-gray-500 mt-2">Enter your ID to track progress.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. STUDENT ID (NEW) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Student ID / Roll No</label>
            <input 
              type="text" 
              required
              className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-mono text-lg uppercase"
              placeholder="e.g. STD-101"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          {/* 2. NAME */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-bold text-lg"
              placeholder="e.g. Durgesh"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 3. GRADE */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
            <select 
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition font-bold text-lg bg-white"
            >
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition"
          >
            Start Learning 🚀
          </button>
        </form>
      </div>
    </div>
  );
}