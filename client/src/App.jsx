import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, AlertTriangle, Upload, FileText } from 'lucide-react';

// IMPORTANT: This points to your running backend
const API_URL = "http://localhost:5000/api";

export default function App() {
  const [view, setView] = useState('student'); // 'student' or 'instructor'
  const [submissions, setSubmissions] = useState([]);

  // Student State
  const [studentName, setStudentName] = useState('');
  const [assignmentText, setAssignmentText] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch submissions for Instructor view
  useEffect(() => {
    if (view === 'instructor') {
      fetchSubmissions();
    }
  }, [view]);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get(`${API_URL}/submissions`);
      setSubmissions(res.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    
    try {
      const res = await axios.post(`${API_URL}/submit`, {
        studentName: studentName || "Anonymous Student",
        assignmentTitle: "Project Submission",
        content: assignmentText
      });
      setSubmitStatus(res.data);
      setAssignmentText(''); 
    } catch (error) {
      alert("Submission Failed! Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> 
            AI Assignment Evaluator
          </h1>
          <div className="flex gap-2 bg-indigo-700 p-1 rounded-lg">
            <button 
              onClick={() => setView('student')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'student' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200 hover:text-white'}`}
            >
              Student View
            </button>
            <button 
              onClick={() => setView('instructor')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${view === 'instructor' ? 'bg-white text-indigo-700 shadow' : 'text-indigo-200 hover:text-white'}`}
            >
              Instructor View
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-6 mt-6">
        {view === 'student' ? (
          /* --- STUDENT DASHBOARD --- */
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-600" />
              Submit Assignment
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter your name"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Content</label>
                <textarea 
                  className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
                  placeholder="Paste your assignment text here..."
                  value={assignmentText}
                  onChange={e => setAssignmentText(e.target.value)}
                />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading || !assignmentText}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2"
              >
                {loading ? "Analyzing..." : "Submit for Evaluation"}
              </button>
            </div>

            {submitStatus && (
              <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 text-green-800 font-bold mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Submission Received
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <span className="block text-slate-500 text-xs uppercase tracking-wider">Score</span>
                    <span className="text-2xl font-bold text-indigo-600">{submitStatus.score}/100</span>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <span className="block text-slate-500 text-xs uppercase tracking-wider">Plagiarism Risk</span>
                    <span className={`text-2xl font-bold ${submitStatus.plagiarismRisk > 15 ? 'text-red-500' : 'text-green-600'}`}>
                      {submitStatus.plagiarismRisk}%
                    </span>
                  </div>
                </div>
                <div className="mt-3 bg-white p-3 rounded border border-green-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">AI Feedback</p>
                  <p className="text-slate-700">{submitStatus.aiFeedback}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* --- INSTRUCTOR DASHBOARD --- */
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Submission Reviews
            </h2>
            
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed">
                No submissions yet.
              </div>
            ) : (
              submissions.map((sub) => (
                <div key={sub._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{sub.assignmentTitle}</h3>
                      <p className="text-sm text-slate-500">Student: {sub.studentName} • {new Date(sub.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                       <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${sub.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                         Score: {sub.score}
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                        <AlertTriangle className={`w-4 h-4 ${sub.plagiarismRisk > 20 ? 'text-red-500' : 'text-slate-400'}`} />
                        Plagiarism Risk
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                        <div 
                          className={`h-2.5 rounded-full ${sub.plagiarismRisk > 20 ? 'bg-red-500' : 'bg-green-500'}`} 
                          style={{ width: `${sub.plagiarismRisk}%` }}
                        ></div>
                      </div>
                      <p className="text-right text-xs text-slate-500 mt-1">{sub.plagiarismRisk}% detected</p>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                       <p className="text-xs font-bold text-indigo-800 uppercase mb-1">AI Feedback Summary</p>
                       <p className="text-sm text-slate-700 italic">"{sub.aiFeedback}"</p>
                    </div>
                  </div>

                  <details className="text-sm text-slate-500 cursor-pointer">
                    <summary className="hover:text-indigo-600 transition">View Full Submission Content</summary>
                    <div className="mt-2 p-3 bg-slate-50 rounded border font-mono text-xs text-slate-600 whitespace-pre-wrap">
                      {sub.content}
                    </div>
                  </details>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}