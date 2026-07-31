'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const API_URL = "https://script.google.com/macros/s/AKfycbwigSuwpf6tU5EOQr6o2Nqk4Di9-WfUNtq69Zhsi2LK-8E7C1MNxBTAQJL63bCignv65A/exec"; 

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appMode, setAppMode] = useState('student'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('scores');
  
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<any>(null);
  const [studentScores, setStudentScores] = useState<any[]>([]);

  const [studentForm, setStudentForm] = useState({ studentId: '', name: '', classLevel: '' });
  const [subjectForm, setSubjectForm] = useState({ classLevel: '', subject: '' });
  const [assignmentForm, setAssignmentForm] = useState({ classLevel: '', subject: '', workName: '' });
  const [scoreForm, setScoreForm] = useState({ classLevel: '', studentId: '', name: '', subject: '', workName: '', score: '' });
  const [reportForm, setReportForm] = useState({ classLevel: '', subject: '' });

  // ฟังก์ชันดึงคะแนนเก่าขึ้นมาโชว์อัตโนมัติ (UX Improvement)
  useEffect(() => {
    if (scoreForm.studentId && scoreForm.subject && scoreForm.workName) {
      const existing = scores.find(sc => 
        String(sc.StudentID) === String(scoreForm.studentId) && 
        sc.Subject === scoreForm.subject && 
        sc.WorkName === scoreForm.workName &&
        sc.TeacherName === teacherName
      );
      if (existing) {
        setScoreForm(prev => prev.score !== existing.Score ? { ...prev, score: existing.Score } : prev);
      } else {
        setScoreForm(prev => ({ ...prev, score: '' }));
      }
    }
  }, [scoreForm.studentId, scoreForm.subject, scoreForm.workName, scores, teacherName]);

  useEffect(() => {
    fetchAllData();
    const savedName = sessionStorage.getItem('teacherName');
    if (savedName) {
      setIsLoggedIn(true);
      setTeacherName(savedName);
      setAppMode('teacher');
    }
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setScores(data.scores || []);
      setStudents(data.students || []);
      setSubjects(data.subjects || []);
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const foundStudent = students.find(s => String(s.StudentID) === String(searchQuery.trim()));
    if (foundStudent) {
      setSearchedStudent(foundStudent);
      const sScores = scores.filter(sc => String(sc.StudentID) === String(foundStudent.StudentID));
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
        body: JSON.stringify({ action, ...payload, teacherName }),
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
    if (window.confirm(`คุณต้องการลบข้อมูลนักเรียน:\n"${studentName}" (รหัส: ${studentId})\nใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteStudent", studentId: studentId }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        fetchAllData(); 
      } catch (error) { alert("เกิดข้อผิดพลาดในการลบข้อมูล"); }
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (classLevel: string, subject: string) => {
    if (window.confirm(`⚠️ คำเตือน: คุณต้องการลบรายวิชา "${subject}" ใช่หรือไม่?\n\nการลบจะทำให้ "ชิ้นงาน" และ "คะแนน" ในวิชานี้ของคุณหายไปทั้งหมด`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteSubject", classLevel, subject, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        fetchAllData(); 
      } catch (error) { alert("เกิดข้อผิดพลาดในการลบข้อมูล"); }
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (classLevel: string, subject: string, workName: string) => {
    if (window.confirm(`⚠️ คำเตือน: คุณต้องการลบชิ้นงาน "${workName}" วิชา "${subject}" ใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteAssignment", classLevel, subject, workName, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        fetchAllData(); 
      } catch (error) { alert("เกิดข้อผิดพลาดในการลบข้อมูล"); }
      setLoading(false);
    }
  };

  const handleDeleteScore = async (studentId: string, studentName: string, subject: string, workName: string) => {
    if (window.confirm(`คุณต้องการยกเลิกคะแนนของ:\n${studentName}\nชิ้นงาน "${workName}" วิชา "${subject}"\nใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteScore", studentId, subject, workName, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        fetchAllData(); 
      } catch (error) { alert("เกิดข้อผิดพลาดในการลบข้อมูล"); }
      setLoading(false);
    }
  };

  const mySubjects = subjects.filter(s => s.TeacherName === teacherName);
  const myAssignments = assignments.filter(a => a.TeacherName === teacherName);
  const myScores = scores.filter(sc => sc.TeacherName === teacherName);

  const uniqueClasses = Array.from(new Set(students.map(s => s.ClassLevel)));
  const filteredStudents = students.filter(s => s.ClassLevel === scoreForm.classLevel);
  const subjectsForAssignmentForm = mySubjects.filter(s => s.ClassLevel === assignmentForm.classLevel);
  const subjectsForScoreForm = mySubjects.filter(s => s.ClassLevel === scoreForm.classLevel);
  const filteredWorks = myAssignments.filter(a => a.Subject === scoreForm.subject && a.ClassLevel === scoreForm.classLevel);
  const subjectsForReportForm = mySubjects.filter(s => s.ClassLevel === reportForm.classLevel);

  const handlePrintReport = (e: any) => {
    e.preventDefault();
    const subjectWorks = myAssignments.filter(a => a.ClassLevel === reportForm.classLevel && a.Subject === reportForm.subject);
    let subjectStudents = students.filter(s => s.ClassLevel === reportForm.classLevel);
    subjectStudents.sort((a, b) => String(a.StudentID).localeCompare(String(b.StudentID)));

    if (subjectStudents.length === 0) {
      alert("ไม่พบข้อมูลนักเรียนในระดับชั้นนี้");
      return;
    }

    let printWindow = window.open('', '_blank');
    if (!printWindow) { alert("กรุณาอนุญาต Pop-up เพื่อดูรายงาน"); return; }

    let html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>รายงานคะแนน - ${reportForm.subject}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600&display=swap');
          body { font-family: 'Sarabun', sans-serif; padding: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h2 { margin: 0; font-size: 24px; }
          .header p { margin: 5px 0; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
          th, td { border: 1px solid #000; padding: 6px 10px; text-align: center; }
          th { background-color: #f5f5f5; font-weight: 600; }
          .text-left { text-align: left; }
          .total-col { font-weight: 600; }
          @media print { @page { margin: 1cm; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>รายงานสรุปผลคะแนนนักเรียน</h2>
          <p>ระดับชั้น: <b>${reportForm.classLevel}</b> | รายวิชา: <b>${reportForm.subject}</b></p>
          <p>ผู้สอน: ${teacherName}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>รหัสนักเรียน</th>
              <th class="text-left">ชื่อ-นามสกุล</th>
              ${subjectWorks.map(w => `<th>${w.WorkName}</th>`).join('')}
              <th class="total-col">รวม</th>
            </tr>
          </thead>
          <tbody>
            ${subjectStudents.map((student, idx) => {
              let totalScore = 0;
              let scoresHtml = subjectWorks.map(w => {
                const s = myScores.find(sc => String(sc.StudentID) === String(student.StudentID) && sc.Subject === reportForm.subject && sc.WorkName === w.WorkName);
                const scoreVal = s ? Number(s.Score) : 0;
                totalScore += scoreVal;
                return `<td>${s ? s.Score : '-'}</td>`;
              }).join('');
              
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${student.StudentID}</td>
                  <td class="text-left">${student.Name}</td>
                  ${scoresHtml}
                  <td class="total-col">${totalScore}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const theme = {
    bg: isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800",
    card: isDarkMode ? "bg-gray-800 border-gray-700 shadow-lg" : "bg-white border-gray-100 shadow-sm",
    input: isDarkMode ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-400 disabled:bg-gray-900 disabled:text-gray-500" : "bg-white border-gray-200 text-gray-800 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400",
    textMuted: isDarkMode ? "text-gray-400" : "text-gray-500",
    tableHead: isDarkMode ? "bg-gray-900 text-gray-300 border-gray-700" : "bg-gray-50 text-gray-600 border-gray-200",
    tableRow: isDarkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-100 hover:bg-gray-50",
    buttonTabActive: isDarkMode ? "bg-blue-600/20 text-blue-400" : "bg-blue-50 text-blue-700",
    buttonTabInactive: isDarkMode ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
    primaryButton: "w-full bg-blue-600 text-white font-medium rounded-full p-3 hover:bg-blue-700 transition disabled:opacity-50 shadow-md hover:shadow-lg",
  };

  if (appMode === 'student') {
    return (
      <div className={`min-h-screen p-6 lg:p-10 font-sans transition-colors duration-300 ${theme.bg}`}>
        <div className="max-w-4xl mx-auto space-y-8">
          <header className={`flex justify-between items-center p-6 rounded-3xl border transition-colors duration-300 ${theme.card}`}>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Krusave Score Hub</h1>
              <p className={`text-sm mt-1 ${theme.textMuted}`}>ระบบตรวจสอบคะแนนออนไลน์</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
              <button onClick={() => setAppMode('login')} className={`text-sm py-2.5 px-5 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                สำหรับครูผู้สอน
              </button>
            </div>
          </header>

          <div className={`p-8 rounded-3xl border text-center transition-colors duration-300 ${theme.card}`}>
            <h2 className="text-xl font-semibold mb-2">ตรวจสอบคะแนนของฉัน</h2>
            <p className={`text-sm mb-6 ${theme.textMuted}`}>กรอกรหัสนักเรียนเพื่อดูสรุปผลคะแนนงานแต่ละรายวิชา</p>
            <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="รหัสนักเรียน..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required
                className={`flex-1 border rounded-full px-5 py-3 outline-none text-center sm:text-left text-lg transition-colors ${theme.input}`} />
              <button type="submit" disabled={loading} className="bg-blue-600 text-white font-medium rounded-full px-8 py-3 hover:bg-blue-700 transition disabled:opacity-50 shadow-md">
                {loading ? 'รอสักครู่...' : 'ค้นหา'}
              </button>
            </form>
          </div>

          {searchedStudent && (
            <div className={`p-6 rounded-3xl border transition-colors duration-300 ${theme.card}`}>
              <div className={`mb-6 p-5 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center ${isDarkMode ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
                <div>
                  <h3 className="text-lg font-bold">{searchedStudent.Name}</h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300' : 'text-gray-600'}`}>รหัส: {searchedStudent.StudentID} | ระดับชั้น: {searchedStudent.ClassLevel}</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-sm border-b ${theme.tableHead}`}>
                      <th className="p-4 font-medium w-1/3">รายวิชา</th>
                      <th className="p-4 font-medium w-1/2">ชิ้นงาน</th>
                      <th className="p-4 font-medium text-right">คะแนน</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {studentScores.length === 0 ? (
                      <tr><td colSpan={3} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูลคะแนนในระบบ</td></tr>
                    ) : (
                      studentScores.map((row, i) => (
                        <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                          <td className="p-4 font-medium">{row.Subject} <span className="text-xs text-blue-500"><br/>(ครู: {row.TeacherName})</span></td>
                          <td className={`p-4 ${theme.textMuted}`}>{row.WorkName}</td>
                          <td className="p-4 text-right font-bold text-blue-500 text-base">{row.Score}</td>
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
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative transition-colors duration-300 ${theme.bg}`}>
        <button onClick={() => setAppMode('student')} className={`absolute top-6 left-6 text-sm font-medium transition-colors ${theme.textMuted} hover:text-blue-500`}>
          ← กลับไปหน้านักเรียน
        </button>
        <div className="absolute top-6 right-6">
          <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
        <div className={`p-10 rounded-3xl border w-full max-w-md transition-colors duration-300 ${theme.card}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">เข้าสู่ระบบ</h1>
            <p className={`text-sm ${theme.textMuted}`}>สำหรับครูผู้สอนเพื่อจัดการข้อมูล</p>
          </div>
          {errorMsg && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 text-center border border-red-100">{errorMsg}</div>}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <input type="text" placeholder="Username" required onChange={(e) => setLoginData({...loginData, username: e.target.value})}
              className={`w-full border rounded-2xl px-5 py-3.5 outline-none transition-colors ${theme.input}`} />
            <input type="password" placeholder="Password" required onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              className={`w-full border rounded-2xl px-5 py-3.5 outline-none transition-colors ${theme.input}`} />
            <button type="submit" disabled={loading} className={theme.primaryButton}>
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 lg:p-10 font-sans transition-colors duration-300 ${theme.bg}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl border gap-4 transition-colors duration-300 ${theme.card}`}>
          <div>
            <h1 className="text-2xl font-bold">Krusave Score Hub <span className="text-blue-500">(Admin)</span></h1>
            <p className={`text-sm mt-1 ${theme.textMuted}`}>ยินดีต้อนรับ, {teacherName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className={`text-sm py-2.5 px-5 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              ออกจากระบบ
            </button>
          </div>
        </header>

        <div className={`flex space-x-1 p-1.5 rounded-full border overflow-x-auto transition-colors duration-300 ${theme.card}`}>
          {['students', 'subjects', 'assignments', 'scores', 'reports'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-full text-sm font-medium transition whitespace-nowrap ${activeTab === tab ? theme.buttonTabActive : theme.buttonTabInactive}`}>
              {tab === 'students' ? '👨‍🎓 นักเรียน' : tab === 'subjects' ? '📖 วิชา' : tab === 'assignments' ? '📚 งาน' : tab === 'scores' ? '📝 คะแนน' : '🖨️ ออกรายงาน'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-3xl border h-fit transition-colors duration-300 ${theme.card}`}>
            <h2 className="text-lg font-semibold mb-5">
              {activeTab === 'students' ? 'เพิ่มนักเรียนใหม่' : activeTab === 'subjects' ? 'เพิ่มรายวิชาใหม่' : activeTab === 'assignments' ? 'เพิ่มชิ้นงานใหม่' : activeTab === 'reports' ? 'พิมพ์รายงาน' : 'ให้คะแนนนักเรียน'}
            </h2>
            
            {activeTab === 'students' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addStudent', studentForm, () => setStudentForm({studentId:'', name:'', classLevel:''})); }} className="space-y-4">
                <select required value={studentForm.classLevel} onChange={e => setStudentForm({...studentForm, classLevel: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <input type="text" placeholder="รหัสนักเรียน" value={studentForm.studentId} onChange={e => setStudentForm({...studentForm, studentId: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <input type="text" placeholder="ชื่อ-นามสกุล" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <button type="submit" disabled={loading} className={theme.primaryButton}>บันทึกนักเรียน</button>
              </form>
            )}

            {activeTab === 'subjects' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addSubject', subjectForm, () => setSubjectForm({classLevel:'', subject:''})); }} className="space-y-4">
                <select required value={subjectForm.classLevel} onChange={e => setSubjectForm({...subjectForm, classLevel: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <input type="text" placeholder="ชื่อรายวิชา" value={subjectForm.subject} onChange={e => setSubjectForm({...subjectForm, subject: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <button type="submit" disabled={loading} className={theme.primaryButton}>บันทึกรายวิชา</button>
              </form>
            )}

            {activeTab === 'assignments' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addAssignment', assignmentForm, () => setAssignmentForm({classLevel:'', subject:'', workName:''})); }} className="space-y-4">
                <select required value={assignmentForm.classLevel} onChange={e => setAssignmentForm({...assignmentForm, classLevel: e.target.value, subject: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <select required value={assignmentForm.subject} disabled={!assignmentForm.classLevel} onChange={e => setAssignmentForm({...assignmentForm, subject: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForAssignmentForm.map((s: any, i) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>
                <input type="text" placeholder="ชื่อชิ้นงาน" value={assignmentForm.workName} onChange={e => setAssignmentForm({...assignmentForm, workName: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <button type="submit" disabled={loading} className={theme.primaryButton}>บันทึกชิ้นงาน</button>
              </form>
            )}

            {activeTab === 'scores' && (
              <form onSubmit={(e) => { e.preventDefault(); submitData('addScore', scoreForm, () => setScoreForm({...scoreForm, score:''})); }} className="space-y-4">
                <select required value={scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, classLevel: e.target.value, studentId: '', name: '', subject: '', workName: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <select required value={scoreForm.studentId} disabled={!scoreForm.classLevel} onChange={e => {
                  const selectedId = e.target.value;
                  if (!selectedId) { setScoreForm({...scoreForm, studentId: '', name: ''}); } 
                  else { const student = students.find(s => String(s.StudentID) === String(selectedId)); if (student) setScoreForm({...scoreForm, studentId: student.StudentID, name: student.Name}); }
                }} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกนักเรียน --</option>
                  {filteredStudents.map((s: any, i) => <option key={i} value={s.StudentID}>{s.StudentID} - {s.Name}</option>)}
                </select>
                <select required value={scoreForm.subject} disabled={!scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, subject: e.target.value, workName: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForScoreForm.map((s: any, i) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>
                <select required value={scoreForm.workName} disabled={!scoreForm.subject} onChange={e => setScoreForm({...scoreForm, workName: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกชิ้นงาน --</option>
                  {filteredWorks.map((w: any, i) => <option key={i} value={w.WorkName}>{w.WorkName}</option>)}
                </select>
                <input type="number" placeholder="กรอกคะแนนที่ได้" value={scoreForm.score} onChange={e => setScoreForm({...scoreForm, score: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <button type="submit" disabled={loading} className={theme.primaryButton}>บันทึก / อัปเดตคะแนน</button>
              </form>
            )}

            {activeTab === 'reports' && (
              <form onSubmit={handlePrintReport} className="space-y-4">
                <select required value={reportForm.classLevel} onChange={e => setReportForm({classLevel: e.target.value, subject: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <select required value={reportForm.subject} disabled={!reportForm.classLevel} onChange={e => setReportForm({...reportForm, subject: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForReportForm.map((s: any, i) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>
                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-medium rounded-full p-3 hover:bg-green-700 shadow-md hover:shadow-lg transition">
                  ดาวน์โหลด PDF / พิมพ์รายงาน
                </button>
              </form>
            )}
          </div>

          <div className={`lg:col-span-2 p-6 rounded-3xl border transition-colors duration-300 ${theme.card}`}>
            <h2 className="text-lg font-semibold mb-5">
              {activeTab === 'students' ? 'รายชื่อนักเรียนทั้งหมด (ส่วนกลาง)' : activeTab === 'subjects' ? 'วิชาของฉัน' : activeTab === 'assignments' ? 'ชิ้นงานของฉัน' : activeTab === 'reports' ? 'ตัวอย่างข้อมูลคะแนน' : 'คะแนนล่าสุดของฉัน'}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left border-collapse">
                {activeTab === 'students' && (
                  <>
                    <thead><tr className={`text-sm border-b ${theme.tableHead}`}><th className="p-4 font-medium">ระดับชั้น</th><th className="p-4 font-medium">รหัสนักเรียน</th><th className="p-4 font-medium">ชื่อ-นามสกุล</th><th className="p-4 font-medium text-center">จัดการ</th></tr></thead>
                    <tbody className="text-sm">
                      {students.length === 0 ? <tr><td colSpan={4} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        students.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                            <td className="p-4">{row.ClassLevel}</td><td className="p-4">{row.StudentID}</td><td className="p-4">{row.Name}</td>
                            <td className="p-4 text-center"><button onClick={() => handleDeleteStudent(row.StudentID, row.Name)} className="text-red-500 hover:text-white font-medium py-1.5 px-3 rounded-full hover:bg-red-500 transition">ลบ</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </>
                )}
                {activeTab === 'subjects' && (
                  <>
                    <thead><tr className={`text-sm border-b ${theme.tableHead}`}><th className="p-4 font-medium">ระดับชั้น</th><th className="p-4 font-medium">รายวิชา</th><th className="p-4 font-medium text-center">จัดการ</th></tr></thead>
                    <tbody className="text-sm">
                      {mySubjects.length === 0 ? <tr><td colSpan={3} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        mySubjects.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                            <td className="p-4">{row.ClassLevel}</td><td className="p-4">{row.Subject}</td>
                            <td className="p-4 text-center"><button onClick={() => handleDeleteSubject(row.ClassLevel, row.Subject)} className="text-red-500 hover:text-white font-medium py-1.5 px-3 rounded-full hover:bg-red-500 transition">ลบ</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </>
                )}
                {activeTab === 'assignments' && (
                  <>
                    <thead><tr className={`text-sm border-b ${theme.tableHead}`}><th className="p-4 font-medium">ระดับชั้น</th><th className="p-4 font-medium">รายวิชา</th><th className="p-4 font-medium">ชื่อชิ้นงาน</th><th className="p-4 font-medium text-center">จัดการ</th></tr></thead>
                    <tbody className="text-sm">
                      {myAssignments.length === 0 ? <tr><td colSpan={4} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        myAssignments.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                            <td className="p-4">{row.ClassLevel}</td><td className="p-4">{row.Subject}</td><td className="p-4">{row.WorkName}</td>
                            <td className="p-4 text-center"><button onClick={() => handleDeleteAssignment(row.ClassLevel, row.Subject, row.WorkName)} className="text-red-500 hover:text-white font-medium py-1.5 px-3 rounded-full hover:bg-red-500 transition">ลบ</button></td>
                          </tr>
                        ))}
                    </tbody>
                  </>
                )}
                {(activeTab === 'scores' || activeTab === 'reports') && (
                  <>
                    <thead><tr className={`text-sm border-b whitespace-nowrap ${theme.tableHead}`}><th className="p-4 font-medium">ชั้น</th><th className="p-4 font-medium">ชื่อ</th><th className="p-4 font-medium">วิชา/ชิ้นงาน</th><th className="p-4 font-medium text-right">คะแนน</th>{activeTab === 'scores' && <th className="p-4 font-medium text-center">จัดการ</th>}</tr></thead>
                    <tbody className="text-sm">
                      {myScores.length === 0 ? <tr><td colSpan={5} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูลคะแนน</td></tr> : 
                        myScores.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                            <td className="p-4 whitespace-nowrap">{row.ClassLevel}</td>
                            <td className="p-4 whitespace-nowrap">{row.Name}</td>
                            <td className={`p-4 whitespace-nowrap text-xs ${theme.textMuted}`}><b>{row.Subject}</b><br/>{row.WorkName}</td>
                            <td className="p-4 text-right font-bold text-blue-500 text-base">{row.Score}</td>
                            {activeTab === 'scores' && <td className="p-4 text-center"><button onClick={() => handleDeleteScore(row.StudentID, row.Name, row.Subject, row.WorkName)} className="text-red-500 hover:text-white font-medium py-1.5 px-3 rounded-full hover:bg-red-500 transition">ยกเลิก</button></td>}
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
