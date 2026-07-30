'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  // นำ Web App URL อันใหม่ที่เพิ่ง Deploy มาวางแทนที่ข้อความด้านล่างนี้
  const API_URL = "https://script.google.com/macros/s/AKfycbwigSuwpf6tU5EOQr6o2Nqk4Di9-WfUNtq69Zhsi2LK-8E7C1MNxBTAQJL63bCignv65A/exec"; 

  // State สำหรับผู้ใช้งาน
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  
  // State สำหรับจัดการเมนู Tab (1: นักเรียน, 2: ชิ้นงาน, 3: กรอกคะแนน)
  const [activeTab, setActiveTab] = useState('scores');

  // State สำหรับเก็บข้อมูลจากฐานข้อมูล
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  // State สำหรับฟอร์มต่างๆ
  const [studentForm, setStudentForm] = useState({ studentId: '', name: '', classLevel: '' });
  const [assignmentForm, setAssignmentForm] = useState({ subject: '', workName: '' });
  
  // State ฟอร์มคะแนน (มีตัวช่วยกรองข้อมูล)
  const [scoreForm, setScoreForm] = useState({ 
    classLevel: '', studentId: '', name: '', subject: '', workName: '', score: '' 
  });

  // เมื่อเข้าเว็บ ให้เช็คว่าเคย Login ไหม และดึงข้อมูลทั้งหมด
  useEffect(() => {
    const savedName = sessionStorage.getItem('teacherName');
    if (savedName) {
      setIsLoggedIn(true);
      setTeacherName(savedName);
      fetchAllData();
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setScores(data.scores || []);
      setStudents(data.students || []);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // --- จัดการการ Login ---
  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", ...loginData }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      const result = await res.json();
      if (result.status === "success") {
        setIsLoggedIn(true);
        setTeacherName(result.teacherName);
        sessionStorage.setItem('teacherName', result.teacherName);
        fetchAllData();
      } else {
        setErrorMsg(result.message);
      }
    } catch (error) {
      setErrorMsg("ไม่สามารถเชื่อมต่อฐานข้อมูลได้");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('teacherName');
    setIsLoggedIn(false);
    setTeacherName('');
    setLoginData({ username: '', password: '' });
  };

  // --- จัดการ Submit ฟอร์มต่างๆ ---
  const submitData = async (action: string, payload: any, resetForm: Function) => {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      resetForm();
      fetchAllData(); // โหลดข้อมูลใหม่เพื่อให้ตารางอัปเดตทันที
    } catch (error) {
      console.error("Error saving data:", error);
    }
    setLoading(false);
  };

  // ดึงระดับชั้นและรายวิชาที่ไม่ซ้ำกันมาทำ Dropdown
  const uniqueClasses = Array.from(new Set(students.map(s => s.ClassLevel)));
  const uniqueSubjects = Array.from(new Set(assignments.map(a => a.Subject)));
  
  // กรองรายชื่อนักเรียนตามชั้น และชิ้นงานตามวิชาที่เลือก
  const filteredStudents = students.filter(s => s.ClassLevel === scoreForm.classLevel);
  const filteredWorks = assignments.filter(a => a.Subject === scoreForm.subject);

  // --- หน้าจอ Login ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Krusave Score Hub</h1>
          {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{errorMsg}</div>}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input type="text" placeholder="Username" required onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            <input type="password" placeholder="Password" required onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- หน้าจอ Dashboard ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Krusave Score Hub</h1>
            <p className="text-gray-500 text-sm mt-1">ยินดีต้อนรับ, {teacherName}</p>
          </div>
          <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition">
            ออกจากระบบ
          </button>
        </header>

        {/* Tab Menu */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {['students', 'assignments', 'scores'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab === 'students' ? '👨‍🎓 จัดการรายชื่อนักเรียน' : tab === 'assignments' ? '📚 จัดการชิ้นงาน' : '📝 บันทึกคะแนน'}
            </button>
          ))}
        </div>

        {/* เนื้อหาในแต่ละ Tab */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ส่วนฟอร์มกรอกข้อมูล */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {activeTab === 'students' ? 'เพิ่มนักเรียนใหม่' : activeTab === 'assignments' ? 'เพิ่มชิ้นงานใหม่' : 'ให้คะแนนนักเรียน'}
            </h2>
            
            {/* ฟอร์ม 1: นักเรียน */}
            {activeTab === 'students' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addStudent', studentForm, () => setStudentForm({studentId:'', name:'', classLevel:''})); }} className="space-y-4">
                <input type="text" placeholder="ระดับชั้น (เช่น ปวช.1/1)" value={studentForm.classLevel} onChange={e => setStudentForm({...studentForm, classLevel: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="รหัสนักเรียน" value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="ชื่อ-นามสกุล" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกนักเรียน</button>
              </form>
            )}

            {/* ฟอร์ม 2: ชิ้นงาน */}
            {activeTab === 'assignments' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addAssignment', assignmentForm, () => setAssignmentForm({subject:'', workName:''})); }} className="space-y-4">
                <input type="text" placeholder="รายวิชา" value={assignmentForm.subject} onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="ชื่อชิ้นงาน" value={assignmentForm.workName} onChange={e => setAssignmentForm({...assignmentForm, workName: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกชิ้นงาน</button>
              </form>
            )}

            {/* ฟอร์ม 3: กรอกคะแนน (แบบ Dropdown) */}
            {activeTab === 'scores' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addScore', scoreForm, () => setScoreForm({...scoreForm, score:''})); }} className="space-y-4">
                
                <select required value={scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, classLevel: e.target.value, studentId: '', name: ''})} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกระดับชั้น --</option>
                  {uniqueClasses.map((c: any, i) => <option key={i} value={c}>{c}</option>)}
                </select>

                <select required value={scoreForm.studentId} disabled={!scoreForm.classLevel} onChange={e => {
                  const student = students.find(s => s.StudentID === e.target.value);
                  setScoreForm({...scoreForm, studentId: student.StudentID, name: student.Name});
                }} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">-- เลือกนักเรียน --</option>
                  {filteredStudents.map((s: any, i) => <option key={i} value={s.StudentID}>{s.StudentID} - {s.Name}</option>)}
                </select>

                <select required value={scoreForm.subject} onChange={e => setScoreForm({...scoreForm, subject: e.target.value, workName: ''})} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกรายวิชา --</option>
                  {uniqueSubjects.map((s: any, i) => <option key={i} value={s}>{s}</option>)}
                </select>

                <select required value={scoreForm.workName} disabled={!scoreForm.subject} onChange={e => setScoreForm({...scoreForm, workName: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">-- เลือกชิ้นงาน --</option>
                  {filteredWorks.map((w: any, i) => <option key={i} value={w.WorkName}>{w.WorkName}</option>)}
                </select>

                <input type="number" placeholder="กรอกคะแนนที่ได้" value={scoreForm.score} onChange={e => setScoreForm({...scoreForm, score: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกคะแนน</button>
              </form>
            )}
          </div>

          {/* ส่วนแสดงตารางข้อมูลตาม Tab ที่เลือก */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {activeTab === 'students' ? 'รายชื่อนักเรียนทั้งหมด' : activeTab === 'assignments' ? 'รายชื่อชิ้นงานทั้งหมด' : 'ตารางคะแนนล่าสุด'}
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                
                {activeTab === 'students' && (
                  <>
                    <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">ระดับชั้น</th><th className="p-3">รหัสนักเรียน</th><th className="p-3">ชื่อ-นามสกุล</th></tr></thead>
                    <tbody className="text-sm text-gray-700">
                      {students.length === 0 ? <tr><td colSpan={3} className="text-center p-8">ยังไม่มีข้อมูลนักเรียน</td></tr> : 
                        students.map((row, i) => <tr key={i} className="border-b hover:bg-gray-50"><td className="p-3">{row.ClassLevel}</td><td className="p-3">{row.StudentID}</td><td className="p-3">{row.Name}</td></tr>)}
                    </tbody>
                  </>
                )}

                {activeTab === 'assignments' && (
                  <>
                    <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">รายวิชา</th><th className="p-3">ชื่อชิ้นงาน</th></tr></thead>
                    <tbody className="text-sm text-gray-700">
                      {assignments.length === 0 ? <tr><td colSpan={2} className="text-center p-8">ยังไม่มีข้อมูลชิ้นงาน</td></tr> : 
                        assignments.map((row, i) => <tr key={i} className="border-b hover:bg-gray-50"><td className="p-3">{row.Subject}</td><td className="p-3">{row.WorkName}</td></tr>)}
                    </tbody>
                  </>
                )}

                {activeTab === 'scores' && (
                  <>
                    <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b whitespace-nowrap"><th className="p-3">ชั้น</th><th className="p-3">ชื่อ</th><th className="p-3">วิชา/ชิ้นงาน</th><th className="p-3 text-right">คะแนน</th></tr></thead>
                    <tbody className="text-sm text-gray-700">
                      {scores.length === 0 ? <tr><td colSpan={4} className="text-center p-8">ยังไม่มีข้อมูลคะแนน</td></tr> : 
                        scores.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-3 whitespace-nowrap">{row.ClassLevel}</td>
                            <td className="p-3 whitespace-nowrap">{row.Name}</td>
                            <td className="p-3 whitespace-nowrap text-gray-500 text-xs"><b>{row.Subject}</b><br/>{row.WorkName}</td>
                            <td className="p-3 text-right font-semibold text-blue-600 text-base">{row.Score}</td>
                          </tr>
                        ))}
                    </tbody>
                  </>
                )}

              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
