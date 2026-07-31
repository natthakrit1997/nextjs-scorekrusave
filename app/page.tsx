'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  // นำ Web App URL ของคุณมาวางแทนที่ข้อความด้านล่างนี้
  const API_URL = "https://script.google.com/macros/s/AKfycbwigSuwpf6tU5EOQr6o2Nqk4Di9-WfUNtq69Zhsi2LK-8E7C1MNxBTAQJL63bCignv65A/exec"; 

  const [appMode, setAppMode] = useState('student'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('scores');
  
  // State ฐานข้อมูล
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]); // เพิ่ม State เก็บรายวิชา
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<any>(null);
  const [studentScores, setStudentScores] = useState<any[]>([]);

  // State ฟอร์ม
  const [studentForm, setStudentForm] = useState({ studentId: '', name: '', classLevel: '' });
  const [subjectForm, setSubjectForm] = useState({ classLevel: '', subject: '' }); // เพิ่ม Form รายวิชา
  const [assignmentForm, setAssignmentForm] = useState({ classLevel: '', subject: '', workName: '' });
  const [scoreForm, setScoreForm] = useState({ classLevel: '', studentId: '', name: '', subject: '', workName: '', score: '' });

  useEffect(() => {
    fetchAllData();
    const savedName = sessionStorage.getItem('teacherName');
    if (savedName) {
      setIsLoggedIn(true);
      setTeacherName(savedName);
      setAppMode('teacher');
    }
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setScores(data.scores || []);
      setStudents(data.students || []);
      setSubjects(data.subjects || []); // รับข้อมูลวิชา
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const foundStudent = students.find(s => s.StudentID.toString() === searchQuery.trim());
    if (foundStudent) {
      setSearchedStudent(foundStudent);
      const sScores = scores.filter(sc => sc.StudentID.toString() === foundStudent.StudentID.toString());
      setStudentScores(sScores);
    } else {
      setSearchedStudent(null);
      setStudentScores([]);
      alert("ไม่พบข้อมูลนักเรียน กรุณาตรวจสอบรหัสอีกครั้ง");
    }
  };

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
        setAppMode('teacher');
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
    setAppMode('student');
  };

  const submitData = async (action: string, payload: any, resetForm: Function) => {
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      if (resetForm) resetForm();
      fetchAllData(); 
    } catch (error) {
      console.error("Error saving data:", error);
    }
    setLoading(false);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const isConfirm = window.confirm(`คุณต้องการลบข้อมูลของ:\n"${studentName}" (รหัส: ${studentId})\nใช่หรือไม่?`);
    if (isConfirm) {
      setLoading(true);
      try {
        await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({ action: "deleteStudent", studentId: studentId }),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        fetchAllData(); 
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
      setLoading(false);
    }
  };

  // ตัวช่วยกรองข้อมูลสำหรับ Dropdown
  const uniqueClasses = Array.from(new Set(students.map(s => s.ClassLevel)));
  const filteredStudents = students.filter(s => s.ClassLevel === scoreForm.classLevel);
  
  // ดึงรายวิชาตามระดับชั้นที่เลือก
  const subjectsForAssignmentForm = subjects.filter(s => s.ClassLevel === assignmentForm.classLevel);
  const subjectsForScoreForm = subjects.filter(s => s.ClassLevel === scoreForm.classLevel);
  
  // ดึงชิ้นงานตามวิชาและระดับชั้นที่เลือก
  const filteredWorks = assignments.filter(a => a.Subject === scoreForm.subject && a.ClassLevel === scoreForm.classLevel);

  if (appMode === 'student') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Krusave Score Hub</h1>
              <p className="text-gray-500 text-sm mt-1">ระบบตรวจสอบคะแนนออนไลน์</p>
            </div>
            <button onClick={() => setAppMode('login')} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 px-4 rounded-lg font-medium transition">
              สำหรับครูผู้สอน
            </button>
          </header>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">ตรวจสอบคะแนนของฉัน</h2>
            <p className="text-gray-500 text-sm mb-6">กรอกรหัสนักเรียนเพื่อดูสรุปผลคะแนนงานแต่ละรายวิชา</p>
            <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
              <input type="text" placeholder="พิมพ์รหัสนักเรียนที่นี่..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required
                className="flex-1 border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg" />
              <button type="submit" disabled={loading} className="bg-blue-600 text-white font-medium rounded-lg px-6 hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'รอสักครู่...' : 'ค้นหา'}
              </button>
            </form>
          </div>

          {searchedStudent && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{searchedStudent.Name}</h3>
                  <p className="text-gray-600 text-sm">รหัส: {searchedStudent.StudentID} | ระดับชั้น: {searchedStudent.ClassLevel}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
                      <th className="p-3 font-medium w-1/3">รายวิชา</th>
                      <th className="p-3 font-medium w-1/2">ชิ้นงาน</th>
                      <th className="p-3 font-medium text-right">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700">
                    {studentScores.length === 0 ? (
                      <tr><td colSpan={3} className="text-center p-8 text-gray-500">ยังไม่มีข้อมูลคะแนนในระบบ</td></tr>
                    ) : (
                      studentScores.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-medium text-gray-800">{row.Subject}</td>
                          <td className="p-3 text-gray-600">{row.WorkName}</td>
                          <td className="p-3 text-right font-bold text-blue-600 text-base">{row.Score}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appMode === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans relative">
        <button onClick={() => setAppMode('student')} className="absolute top-6 left-6 text-sm text-gray-500 hover:text-gray-800 font-medium">
          ← กลับไปหน้านักเรียน
        </button>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">เข้าสู่ระบบ</h1>
          <p className="text-center text-gray-500 text-sm mb-6">สำหรับครูผู้สอนเพื่อจัดการข้อมูล</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Krusave Score Hub (Admin)</h1>
            <p className="text-gray-500 text-sm mt-1">ยินดีต้อนรับ, {teacherName}</p>
          </div>
          <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg font-medium transition">
            ออกจากระบบ
          </button>
        </header>

        {/* เพิ่มเมนู จัดการรายวิชา */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          {['students', 'subjects', 'assignments', 'scores'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab === 'students' ? '👨‍🎓 นักเรียน' : tab === 'subjects' ? '📖 รายวิชา' : tab === 'assignments' ? '📚 ชิ้นงาน' : '📝 บันทึกคะแนน'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {activeTab === 'students' ? 'เพิ่มนักเรียนใหม่' : activeTab === 'subjects' ? 'เพิ่มรายวิชาใหม่' : activeTab === 'assignments' ? 'เพิ่มชิ้นงานใหม่' : 'ให้คะแนนนักเรียน'}
            </h2>
            
            {activeTab === 'students' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addStudent', studentForm, () => setStudentForm({studentId:'', name:'', classLevel:''})); }} className="space-y-4">
                <select required value={studentForm.classLevel} onChange={e => setStudentForm({...studentForm, classLevel: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกระดับชั้น --</option>
                  <option value="ปวช">ปวช</option>
                  <option value="ปวส">ปวส</option>
                  <option value="ป.ตรี">ป.ตรี</option>
                </select>
                <input type="text" placeholder="รหัสนักเรียน" value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" placeholder="ชื่อ-นามสกุล" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกนักเรียน</button>
              </form>
            )}

            {/* ฟอร์มเพิ่มรายวิชา */}
            {activeTab === 'subjects' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addSubject', subjectForm, () => setSubjectForm({classLevel:'', subject:''})); }} className="space-y-4">
                <select required value={subjectForm.classLevel} onChange={e => setSubjectForm({...subjectForm, classLevel: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกระดับชั้น --</option>
                  <option value="ปวช">ปวช</option>
                  <option value="ปวส">ปวส</option>
                  <option value="ป.ตรี">ป.ตรี</option>
                </select>
                <input type="text" placeholder="ชื่อรายวิชา" value={subjectForm.subject} onChange={e => setSubjectForm({...subjectForm, subject: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกรายวิชา</button>
              </form>
            )}

            {activeTab === 'assignments' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addAssignment', assignmentForm, () => setAssignmentForm({classLevel:'', subject:'', workName:''})); }} className="space-y-4">
                <select required value={assignmentForm.classLevel} onChange={e => setAssignmentForm({...assignmentForm, classLevel: e.target.value, subject: ''})} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกระดับชั้น --</option>
                  <option value="ปวช">ปวช</option>
                  <option value="ปวส">ปวส</option>
                  <option value="ป.ตรี">ป.ตรี</option>
                </select>
                {/* เปลี่ยนช่องพิมพ์รายวิชา เป็น Dropdown ดึงจาก Subjects */}
                <select required value={assignmentForm.subject} disabled={!assignmentForm.classLevel} onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForAssignmentForm.map((s: any, i) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>
                <input type="text" placeholder="ชื่อชิ้นงาน" value={assignmentForm.workName} onChange={e => setAssignmentForm({...assignmentForm, workName: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 hover:bg-blue-700 disabled:opacity-50">บันทึกชิ้นงาน</button>
              </form>
            )}

            {activeTab === 'scores' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addScore', scoreForm, () => setScoreForm({...scoreForm, score:''})); }} className="space-y-4">
                <select required value={scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, classLevel: e.target.value, studentId: '', name: '', subject: '', workName: ''})} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- เลือกระดับชั้น --</option>
                  <option value="ปวช">ปวช</option>
                  <option value="ปวส">ปวส</option>
                  <option value="ป.ตรี">ป.ตรี</option>
                </select>
                <select required value={scoreForm.studentId} disabled={!scoreForm.classLevel} onChange={e => {
                  const student = students.find(s => s.StudentID === e.target.value);
                  setScoreForm({...scoreForm, studentId: student.StudentID, name: student.Name});
                }} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">-- เลือกนักเรียน --</option>
                  {filteredStudents.map((s: any, i) => <option key={i} value={s.StudentID}>{s.StudentID} - {s.Name}</option>)}
                </select>
                <select required value={scoreForm.subject} disabled={!scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, subject: e.target.value, workName: ''})} className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForScoreForm.map((s: any, i) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
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

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {activeTab === 'students' ? 'รายชื่อนักเรียนทั้งหมด' : activeTab === 'subjects' ? 'รายวิชาทั้งหมด' : activeTab === 'assignments' ? 'รายชื่อชิ้นงานทั้งหมด' : 'ตารางคะแนนล่าสุด'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {activeTab === 'students' && (
                  <>
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm border-b">
                        <th className="p-3">ระดับชั้น</th>
                        <th className="p-3">รหัสนักเรียน</th>
                        <th className="p-3">ชื่อ-นามสกุล</th>
                        <th className="p-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700">
                      {students.length === 0 ? <tr><td colSpan={4} className="text-center p-8">ยังไม่มีข้อมูล</td></tr> : 
                        students.map((row, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            <td className="p-3">{row.ClassLevel}</td>
                            <td className="p-3">{row.StudentID}</td>
                            <td className="p-3">{row.Name}</td>
                            <td className="p-3 text-center">
                              <button onClick={() => handleDeleteStudent(row.StudentID, row.Name)} className="text-red-500 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-50 transition">
                                ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </>
                )}
                {/* ตารางแสดงรายวิชา */}
                {activeTab === 'subjects' && (
                  <>
                    <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">ระดับชั้น</th><th className="p-3">รายวิชา</th></tr></thead>
                    <tbody className="text-sm text-gray-700">
                      {subjects.length === 0 ? <tr><td colSpan={2} className="text-center p-8">ยังไม่มีข้อมูล</td></tr> : 
                        subjects.map((row, i) => <tr key={i} className="border-b hover:bg-gray-50"><td className="p-3">{row.ClassLevel}</td><td className="p-3">{row.Subject}</td></tr>)}
                    </tbody>
                  </>
                )}
                {activeTab === 'assignments' && (
                  <>
                    <thead><tr className="bg-gray-100 text-gray-600 text-sm border-b"><th className="p-3">ระดับชั้น</th><th className="p-3">รายวิชา</th><th className="p-3">ชื่อชิ้นงาน</th></tr></thead>
                    <tbody className="text-sm text-gray-700">
                      {assignments.length === 0 ? <tr><td colSpan={3} className="text-center p-8">ยังไม่มีข้อมูล</td></tr> : 
                        assignments.map((row, i) => <tr key={i} className="border-b hover:bg-gray-50"><td className="p-3">{row.ClassLevel}</td><td className="p-3">{row.Subject}</td><td className="p-3">{row.WorkName}</td></tr>)}
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
