'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const API_URL = "https://script.google.com/macros/s/AKfycbwigSuwpf6tU5EOQr6o2Nqk4Di9-WfUNtq69Zhsi2LK-8E7C1MNxBTAQJL63bCignv65A/exec"; 

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [appMode, setAppMode] = useState('student'); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
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
  
  const [scoreForm, setScoreForm] = useState({ classLevel: '', studentId: '', name: '', subject: '' });
  const [multiScores, setMultiScores] = useState<Record<string, string>>({}); 
  const [reportForm, setReportForm] = useState({ classLevel: '', subject: '' });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [netSpeed, setNetSpeed] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      setNetSpeed(connection.downlink);
      const updateSpeed = () => setNetSpeed(connection.downlink);
      connection.addEventListener('change', updateSpeed);
      return () => {
        connection.removeEventListener('change', updateSpeed);
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      }
    }
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    }
  }, []);

  useEffect(() => {
    if (scoreForm.studentId && scoreForm.subject) {
      const works = assignments.filter(a => a.Subject === scoreForm.subject && a.ClassLevel === scoreForm.classLevel && a.TeacherName === teacherName);
      const initialScores: Record<string, string> = {};
      works.forEach(w => {
        const existing = scores.find(sc => 
          String(sc.StudentID) === String(scoreForm.studentId) && 
          sc.Subject === scoreForm.subject && 
          sc.WorkName === w.WorkName &&
          sc.TeacherName === teacherName
        );
        initialScores[w.WorkName] = existing ? String(existing.Score) : '';
      });
      setMultiScores(initialScores);
    } else {
      setMultiScores({});
    }
  }, [scoreForm.studentId, scoreForm.subject, scoreForm.classLevel, scores, teacherName, assignments]);

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

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setTimeout(() => {
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
      setLoading(false);
    }, 500); 
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
    } finally {
      setLoading(false);
    }
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
      await fetchAllData(); 
      showToast('บันทึกข้อมูลเรียบร้อยแล้ว!', 'success');
    } catch (error) {
      console.error("Error saving data:", error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
      setLoading(false); 
    }
  };

  const submitMultipleScores = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    const scoresArray = Object.keys(multiScores).map(workName => ({
      workName,
      score: multiScores[workName]
    })).filter(item => item.score !== "");

    if(scoresArray.length === 0) {
      showToast('กรุณากรอกคะแนนอย่างน้อย 1 ชิ้นงาน', 'error');
      setLoading(false);
      return;
    }

    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ 
          action: "addMultipleScores", 
          classLevel: scoreForm.classLevel,
          studentId: scoreForm.studentId,
          name: scoreForm.name,
          subject: scoreForm.subject,
          scores: scoresArray,
          teacherName 
        }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      
      await fetchAllData(); 
      showToast('กรอกคะแนนเสร็จสิ้น! ✨', 'success');
      setScoreForm(prev => ({...prev, studentId: '', name: ''}));
    } catch (error) {
      console.error("Error saving scores:", error);
      showToast('เกิดข้อผิดพลาดในการบันทึกคะแนน', 'error');
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`คุณต้องการลบข้อมูลนักเรียน:\n"${studentName}" (รหัส: ${studentId})\nใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteStudent", studentId: studentId }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        await fetchAllData(); 
        showToast('ลบข้อมูลเรียบร้อย', 'success');
      } catch (error) { showToast('เกิดข้อผิดพลาด', 'error'); setLoading(false); }
    }
  };

  const handleDeleteSubject = async (classLevel: string, subject: string) => {
    if (window.confirm(`⚠️ คำเตือน: คุณต้องการลบรายวิชา "${subject}" ใช่หรือไม่?\n\nการลบจะทำให้ "ชิ้นงาน" และ "คะแนน" ในวิชานี้ของคุณหายไปทั้งหมด`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteSubject", classLevel, subject, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        await fetchAllData(); 
        showToast('ลบข้อมูลเรียบร้อย', 'success');
      } catch (error) { showToast('เกิดข้อผิดพลาด', 'error'); setLoading(false); }
    }
  };

  const handleDeleteAssignment = async (classLevel: string, subject: string, workName: string) => {
    if (window.confirm(`⚠️ คำเตือน: คุณต้องการลบชิ้นงาน "${workName}" วิชา "${subject}" ใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteAssignment", classLevel, subject, workName, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        await fetchAllData(); 
        showToast('ลบข้อมูลเรียบร้อย', 'success');
      } catch (error) { showToast('เกิดข้อผิดพลาด', 'error'); setLoading(false); }
    }
  };

  const handleDeleteScore = async (studentId: string, studentName: string, subject: string, workName: string) => {
    if (window.confirm(`คุณต้องการยกเลิกคะแนนของ:\n${studentName}\nชิ้นงาน "${workName}" วิชา "${subject}"\nใช่หรือไม่?`)) {
      setLoading(true);
      try {
        await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "deleteScore", studentId, subject, workName, teacherName }), headers: { "Content-Type": "text/plain;charset=utf-8" } });
        await fetchAllData(); 
        showToast('ลบข้อมูลเรียบร้อย', 'success');
      } catch (error) { showToast('เกิดข้อผิดพลาด', 'error'); setLoading(false); }
    }
  };

  const handlePrintReport = (e: any) => {
    e.preventDefault();
    const subjectWorks = myAssignments.filter(a => a.ClassLevel === reportForm.classLevel && a.Subject === reportForm.subject);
    
    // [อัปเดต] หารหัสนักเรียนทั้งหมดที่มีคะแนนในวิชานี้ เพื่อกรองเฉพาะคนที่ "เรียน" วิชานี้จริงๆ
    const enrolledStudentIds = new Set(
      myScores
        .filter(sc => sc.Subject === reportForm.subject && sc.ClassLevel === reportForm.classLevel)
        .map(sc => String(sc.StudentID))
    );

    // กรองนักเรียนให้เหลือเฉพาะคนที่รหัสตรงกับในวิชานี้
    let subjectStudents = students.filter(s => 
      s.ClassLevel === reportForm.classLevel && enrolledStudentIds.has(String(s.StudentID))
    );
    
    subjectStudents.sort((a, b) => String(a.StudentID).localeCompare(String(b.StudentID)));

    if (subjectStudents.length === 0) {
      alert("ไม่พบรายชื่อนักเรียนในวิชานี้ (กรุณากรอกคะแนนอย่างน้อย 1 ชิ้นงานเพื่อดึงรายชื่อ)");
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
          .logo { height: 60px; margin-bottom: 10px; object-fit: contain; }
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
          <img src="/logo.png" alt="Logo" class="logo" onerror="this.style.display='none'" />
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
              ${subjectWorks.map((w: any) => `<th>${w.WorkName}</th>`).join('')}
              <th class="total-col">รวม</th>
            </tr>
          </thead>
          <tbody>
            ${subjectStudents.map((student: any, idx: number) => {
              let totalScore = 0;
              let scoresHtml = subjectWorks.map((w: any) => {
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

  const mySubjects = subjects.filter(s => s.TeacherName === teacherName);
  const myAssignments = assignments.filter(a => a.TeacherName === teacherName);
  const myScores = scores.filter(sc => sc.TeacherName === teacherName);

  const tableStudents = [...students].reverse();
  const tableMySubjects = [...mySubjects].reverse();
  const tableMyAssignments = [...myAssignments].reverse();
  const tableMyScores = [...myScores].reverse();

  const uniqueClasses = Array.from(new Set(students.map(s => s.ClassLevel)));
  const filteredStudents = students.filter(s => s.ClassLevel === scoreForm.classLevel);
  const subjectsForAssignmentForm = mySubjects.filter(s => s.ClassLevel === assignmentForm.classLevel);
  const subjectsForScoreForm = mySubjects.filter(s => s.ClassLevel === scoreForm.classLevel);
  const filteredWorks = myAssignments.filter(a => a.Subject === scoreForm.subject && a.ClassLevel === scoreForm.classLevel);
  const subjectsForReportForm = mySubjects.filter(s => s.ClassLevel === reportForm.classLevel);

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

  const getGroupedScores = () => {
    return studentScores.reduce((acc, curr) => {
      if (!acc[curr.Subject]) { acc[curr.Subject] = { teacher: curr.TeacherName, scores: [], total: 0 }; }
      acc[curr.Subject].scores.push(curr);
      acc[curr.Subject].total += Number(curr.Score) || 0;
      return acc;
    }, {} as Record<string, { teacher: string, scores: any[], total: number }>);
  };

  const NetworkStatus = () => {
    if (!isOnline) return <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-red-100 text-red-600 rounded-full border border-red-200"><span className="animate-pulse">🔴</span> ออฟไลน์</div>;
    if (netSpeed === null) return <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 bg-green-100 text-green-600 rounded-full border border-green-200">🟢 ออนไลน์</div>;
    
    let colorStyle = isDarkMode ? "bg-green-900/30 text-green-400 border-gray-700" : "bg-green-50 text-green-600 border-green-200";
    let icon = "🟢";
    if (netSpeed < 1) { colorStyle = isDarkMode ? "bg-red-900/30 text-red-400 border-gray-700" : "bg-red-50 text-red-600 border-red-200"; icon = "🔴"; }
    else if (netSpeed < 5) { colorStyle = isDarkMode ? "bg-yellow-900/30 text-yellow-500 border-gray-700" : "bg-yellow-50 text-yellow-600 border-yellow-200"; icon = "🟡"; }

    return (
      <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${colorStyle}`}>
        <span>{icon}</span> {netSpeed} Mbps
      </div>
    );
  };

  const ToastNotification = () => {
    if (!toast.show) return null;
    return (
      <div className="fixed top-6 right-6 z-[60] animate-bounce">
        <div className={`px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'}`}>
          <span className="text-xl">{toast.type === 'success' ? '✅' : '❌'}</span>
          <p className="font-medium text-lg">{toast.message}</p>
        </div>
      </div>
    );
  };

  const FullPageLoader = () => {
    if (!loading) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
        <div className={`p-8 rounded-3xl shadow-2xl flex flex-col items-center border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-white'}`}>
          <div className="w-14 h-14 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className={`font-bold text-lg animate-pulse ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>กำลังประมวลผลข้อมูล...</p>
        </div>
      </div>
    );
  };

  if (appMode === 'student') {
    const groupedScores = getGroupedScores();
    const hasScores = Object.keys(groupedScores).length > 0;

    return (
      <div className={`min-h-screen p-6 lg:p-10 font-sans transition-colors duration-300 relative ${theme.bg}`}>
        <FullPageLoader />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl border gap-4 transition-colors duration-300 ${theme.card}`}>
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
              <div>
                <h1 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Krusave Score Hub</h1>
                <p className={`text-sm mt-1 ${theme.textMuted}`}>ระบบตรวจสอบคะแนนออนไลน์</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NetworkStatus />
              <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                {isDarkMode ? '🌙' : '☀️'}
              </button>
              <button onClick={() => setAppMode('login')} className={`text-sm py-2 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                สำหรับครูผู้สอน
              </button>
            </div>
          </header>

          <div className={`p-8 rounded-3xl border text-center transition-colors duration-300 ${theme.card}`}>
            <h2 className="text-xl font-semibold mb-2">ตรวจสอบคะแนนของฉัน</h2>
            <p className={`text-sm mb-6 ${theme.textMuted}`}>กรอกรหัสนักเรียนเพื่อดูสรุปผลคะแนนแยกตามรายวิชา</p>
            <form onSubmit={handleSearch} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <input type="text" placeholder="รหัสนักเรียน..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required
                className={`flex-1 border rounded-full px-5 py-3 outline-none text-center sm:text-left text-lg transition-colors ${theme.input}`} />
              <button type="submit" disabled={loading} className="bg-blue-600 text-white font-medium rounded-full px-8 py-3 hover:bg-blue-700 transition disabled:opacity-50 shadow-md">
                ค้นหา
              </button>
            </form>
          </div>

          {searchedStudent && (
            <div className={`p-6 rounded-3xl border transition-colors duration-300 ${theme.card}`}>
              <div className={`mb-8 p-5 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center ${isDarkMode ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
                <div>
                  <h3 className="text-xl font-bold">{searchedStudent.Name}</h3>
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-300' : 'text-gray-600'}`}>รหัส: {searchedStudent.StudentID} | ระดับชั้น: {searchedStudent.ClassLevel}</p>
                </div>
              </div>

              {!hasScores ? (
                <div className={`text-center p-10 rounded-2xl border ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  ยังไม่มีข้อมูลคะแนนในระบบสำหรับรหัสนักเรียนนี้
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedScores).map((subject: string) => (
                    <div key={subject} className={`overflow-hidden rounded-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className={`p-4 sm:p-5 flex justify-between items-center border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div>
                          <h4 className="font-bold text-lg text-blue-500">{subject}</h4>
                          <p className={`text-xs mt-1 ${theme.textMuted}`}>ครูผู้สอน: {groupedScores[subject].teacher}</p>
                        </div>
                        <div className="text-right bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800">
                          <span className={`text-xs block ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>คะแนนรวม</span>
                          <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{groupedScores[subject].total}</span>
                        </div>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <tbody className="text-sm">
                          {groupedScores[subject].scores.map((row: any, idx: number) => (
                            <tr key={idx} className={`border-b last:border-0 transition-colors ${theme.tableRow}`}>
                              <td className={`p-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row.WorkName}</td>
                              <td className="p-4 text-right font-bold w-24">{row.Score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (appMode === 'login') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative transition-colors duration-300 ${theme.bg}`}>
        <FullPageLoader />
        
        <button onClick={() => setAppMode('student')} className={`absolute top-6 left-6 text-sm font-medium transition-colors ${theme.textMuted} hover:text-blue-500`}>
          ← กลับไปหน้านักเรียน
        </button>
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <NetworkStatus />
          <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
        
        <div className={`p-10 rounded-3xl border w-full max-w-md transition-colors duration-300 relative z-10 ${theme.card}`}>
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto mb-4 drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
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
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 lg:p-10 font-sans transition-colors duration-300 relative ${theme.bg}`}>
      
      <ToastNotification />
      <FullPageLoader />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-3xl border gap-4 transition-colors duration-300 ${theme.card}`}>
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Krusave Score Hub <span className="text-blue-500">(Admin)</span></h1>
              <p className={`text-sm mt-1 ${theme.textMuted}`}>ยินดีต้อนรับ, {teacherName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NetworkStatus />
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-full border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-yellow-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className={`text-sm py-2 px-4 rounded-full font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
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
                  {subjectsForAssignmentForm.map((s: any, i: number) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>
                <input type="text" placeholder="ชื่อชิ้นงาน" value={assignmentForm.workName} onChange={e => setAssignmentForm({...assignmentForm, workName: e.target.value})} required className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`} />
                <button type="submit" disabled={loading} className={theme.primaryButton}>บันทึกชิ้นงาน</button>
              </form>
            )}

            {activeTab === 'scores' && (
              <form onSubmit={submitMultipleScores} className="space-y-4">
                <select required value={scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, classLevel: e.target.value, studentId: '', name: '', subject: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                
                <select required value={scoreForm.subject} disabled={!scoreForm.classLevel} onChange={e => setScoreForm({...scoreForm, subject: e.target.value, studentId: '', name: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForScoreForm.map((s: any, i: number) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
                </select>

                <select required value={scoreForm.studentId} disabled={!scoreForm.subject} onChange={e => {
                  const selectedId = e.target.value;
                  if (!selectedId) { setScoreForm({...scoreForm, studentId: '', name: ''}); } 
                  else { const student = students.find(s => String(s.StudentID) === String(selectedId)); if (student) setScoreForm({...scoreForm, studentId: student.StudentID, name: student.Name}); }
                }} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกนักเรียน --</option>
                  {filteredStudents.map((s: any, i: number) => <option key={i} value={s.StudentID}>{s.StudentID} - {s.Name}</option>)}
                </select>

                {scoreForm.studentId && scoreForm.subject ? (
                  filteredWorks.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {filteredWorks.map((w: any, i: number) => (
                        <div key={i} className={`flex flex-col gap-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                          
                          <div className="flex justify-between items-center">
                            <label className={`text-sm font-bold truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{w.WorkName}</label>
                            <input type="number" placeholder="กรอกเอง" value={multiScores[w.WorkName] || ''} onChange={e => setMultiScores({...multiScores, [w.WorkName]: e.target.value})} 
                              className={`w-20 border rounded-xl px-2 py-1 outline-none text-center font-bold text-blue-500 ${theme.input}`} />
                          </div>
                          
                          <div className="flex overflow-x-auto gap-2 pb-2 pt-1 px-1 snap-x [&::-webkit-scrollbar]:hidden">
                            {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setMultiScores({...multiScores, [w.WorkName]: String(val)})}
                                className={`flex-shrink-0 snap-center w-12 h-12 rounded-full font-bold text-lg transition-all duration-200 ${
                                  multiScores[w.WorkName] === String(val) 
                                    ? 'bg-blue-600 text-white shadow-md scale-110' 
                                    : isDarkMode ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`mt-4 p-4 text-center rounded-2xl border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      ยังไม่มีชิ้นงานในรายวิชานี้ กรุณาเพิ่มชิ้นงานก่อน
                    </div>
                  )
                ) : null}

                <div className="pt-4">
                  <button type="submit" disabled={loading || filteredWorks.length === 0} className={theme.primaryButton}>บันทึก / อัปเดตคะแนนทั้งหมด</button>
                </div>
              </form>
            )}

            {activeTab === 'reports' && (
              <form onSubmit={handlePrintReport} className="space-y-4">
                <select required value={reportForm.classLevel} onChange={e => setReportForm({classLevel: e.target.value, subject: ''})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกระดับชั้น --</option><option value="ปวช">ปวช</option><option value="ปวส">ปวส</option><option value="ป.ตรี">ป.ตรี</option>
                </select>
                <select required value={reportForm.subject} disabled={!reportForm.classLevel} onChange={e => setReportForm({...reportForm, subject: e.target.value})} className={`w-full border rounded-2xl px-4 py-3 outline-none ${theme.input}`}>
                  <option value="">-- เลือกรายวิชา --</option>
                  {subjectsForReportForm.map((s: any, i: number) => <option key={i} value={s.Subject}>{s.Subject}</option>)}
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
                      {tableStudents.length === 0 ? <tr><td colSpan={4} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        tableStudents.map((row: any, i: number) => (
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
                      {tableMySubjects.length === 0 ? <tr><td colSpan={3} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        tableMySubjects.map((row: any, i: number) => (
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
                      {tableMyAssignments.length === 0 ? <tr><td colSpan={4} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูล</td></tr> : 
                        tableMyAssignments.map((row: any, i: number) => (
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
                      {tableMyScores.length === 0 ? <tr><td colSpan={5} className={`text-center p-8 ${theme.textMuted}`}>ยังไม่มีข้อมูลคะแนน</td></tr> : 
                        tableMyScores.map((row: any, i: number) => (
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
