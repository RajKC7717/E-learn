import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase'; 
import Toast from './Toast';

export default function TeacherDashboard({ onLogout }) {
  const [students, setStudents] = useState([]);
  const [topics, setTopics] = useState([]); // <--- List of chapters
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // 1. Fetch Data on Load
  useEffect(() => {
    fetchData();
    fetchTopics();

    // Real-time listener
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_progress' }, () => {
        fetchData();
        setToast({ show: true, msg: "🔔 New Student Data Received!", type: 'info' });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .order('last_sync', { ascending: false });

    if (data) {
      const formatted = data.map(row => ({
        id: row.id,
        name: row.name,
        grade: row.grade,
        completed: row.completed_count,
        lastSync: new Date(row.last_sync).toLocaleString(),
      }));
      setStudents(formatted);
    }
    setIsLoading(false);
  }

  // Load chapters so teacher can choose one
  async function fetchTopics() {
    const response = await fetch('/data/knowledge_en.json');
    const data = await response.json();
    setTopics(data);
  }

  // 2. Handle Assignment Logic
  const handleAssign = async () => {
    if (!selectedStudent || !selectedTopic) {
      setToast({ show: true, msg: "Please select a student and a topic", type: "error" });
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudent);
    const topicObj = topics.find(t => t.id === selectedTopic);

    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          student_id: studentObj.id,
          student_name: studentObj.name,
          topic_id: topicObj.id,
          topic_title: topicObj.topic,
          status: 'pending'
        });

      if (error) throw error;

      setToast({ show: true, msg: `✅ Assigned "${topicObj.topic}" to ${studentObj.name}`, type: "success" });
      setShowAssignModal(false);
      setSelectedStudent('');
      setSelectedTopic('');
    } catch (err) {
      console.error(err);
      setToast({ show: true, msg: "Failed to assign homework", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20 font-sans">
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}

      {/* HEADER */}
      <div className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard 👨‍🏫</h1>
            <p className="text-blue-200 text-sm">Real-time Cloud Sync Active 🟢</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="bg-blue-800 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm border border-blue-600">Refresh</button>
            <button onClick={onLogout} className="bg-red-800 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-bold border border-red-600">Logout</button>
          </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="max-w-4xl mx-auto p-6 -mt-10">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-8 border-orange-500 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Class Actions</h2>
            <p className="text-sm text-gray-500">Manage student tasks</p>
          </div>
          <button 
            onClick={() => setShowAssignModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition"
          >
            + Assign Homework
          </button>
        </div>
      </div>

      {/* STUDENT LIST */}
      <div className="max-w-4xl mx-auto px-6 mt-6">
        <h3 className="font-bold text-gray-700 mb-4 text-lg">Classroom Overview</h3>
        {isLoading ? (
           <p className="text-center text-gray-500">Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="p-4 border-b">ID</th>
                  <th className="p-4 border-b">Name</th>
                  <th className="p-4 border-b">Completed</th>
                  <th className="p-4 border-b">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50 transition">
                    <td className="p-4 font-mono text-xs font-bold text-gray-600">{s.id}</td>
                    <td className="p-4 font-bold text-blue-900">{s.name}</td>
                    <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{s.completed} Chaps</span></td>
                    <td className="p-4 text-xs text-gray-400">{s.lastSync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGNMENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in zoom-in">
            <h3 className="text-xl font-bold mb-4">Assign Homework 📝</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Student</label>
                <select 
                  className="w-full p-3 rounded-xl border-2 border-gray-200"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Chapter</label>
                <select 
                  className="w-full p-3 rounded-xl border-2 border-gray-200"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  <option value="">-- Choose Topic --</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.topic}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Cancel</button>
              <button onClick={handleAssign} className="flex-1 py-3 bg-orange-600 font-bold rounded-xl text-white shadow-lg">Assign Task 🚀</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}