'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  // นำ Web App URL อันใหม่ที่เพิ่ง Deploy มาวางแทนที่ข้อความด้านล่างนี้
  const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"; 

  // --- ระบบจัดการ State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [formData, setFormData] = useState({ studentId: '', name: '', subject: '', work: '', score: '' });
  const [scores, setScores] = useState<any[]>([]);

  // --- ทำงานเมื่อโหลดหน้าเว็บ ---
  useEffect(() => {
    // ตรวจสอบว่าครูคนนี้เคย Login ค้างไว้ใน Browser หรือไม่
    const savedName = sessionStorage.getItem('teacherName');
    if (savedName) {
      setIsLoggedIn(true);
      setTeacherName(savedName);
      fetchScores();
    }
  }, []);

  // --- ฟังก์ชันดึงคะแนน ---
  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setScores(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  // --- ฟังก์ชันจัดการ Login ---
  const handleLoginChange = (e: any) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      // ส่งข้อมูลไปที่ API พร้อมแนบ action: "login"
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "login", ...loginData }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      const result = await res.json();
      
      if (result.status === "success") {
        setIsLoggedIn(true);
        setTeacherName(result.teacherName);
        sessionStorage.setItem('teacherName', result.teacherName); // จำการล็อคอิน
        fetchScores();
      } else {
        setErrorMsg(result.message || "การเข้าสู่ระบบล้มเหลว");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('teacherName');
    setIsLoggedIn(false);
    setTeacherName('');
    setLoginData({ username: '', password: '' });
    setScores([]);
  };

  // --- ฟังก์ชันบันทึกคะแนน ---
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // ส่งข้อมูลไปที่ API พร้อมแนบ action: "addScore"
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "addScore", ...formData }),
        headers: { "Content-Type": "text/plain;charset=utf-8" }
      });
      // เคลียร์ค่าในฟอร์ม
      setFormData({ studentId: '', name: '', subject: '', work: '', score: '' });
      fetchScores(); 
    } catch (error) {
      console.error("Error saving data:", error);
    }
    setLoading(false);
  };

  // ----------------------------------------------------
  // การแสดงผล 1: หน้าจอ Login (สำหรับคนที่ยังไม่ได้ล็อคอิน)
  // ----------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Krusave Score Hub</h1>
            <p className="text-gray-500 text-sm mt-1">กรุณาเข้าสู่ระบบเพื่อจัดการคะแนน</p>
          </div>
          
          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
              <input type="text" name="username" value={loginData.username} onChange={handleLoginChange} required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">รหัสผ่าน (Password)</label>
              <input type="password" name="password" value={loginData.password} onChange={handleLoginChange} required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 mt-4 hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // การแสดงผล 2: หน้าจอ Dashboard หลัก
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ส่วนหัวเว็บ และปุ่มออกจากระบบ */}
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Krusave Score Hub</h1>
            <p className="text-gray-500 text-sm mt-1">ยินดีต้อนรับคุณครู, {teacherName}</p>
          </div>
          <button onClick={handleLogout} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-lg transition font-medium">
            ออกจากระบบ
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ฟอร์มกรอกคะแนน */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">เพิ่มคะแนนใหม่</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">รหัสนักเรียน</label>
                <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">รายวิชา</label>
                <input type="text" name="subject" value={formData.subject} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ชื่อชิ้นงาน (work)</label>
                <input type="text" name="work" value={formData.work} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">คะแนน</label>
                <input type="number" name="score" value={formData.score} onChange={handleChange} required
                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 text-white font-medium rounded-lg p-2.5 mt-2 hover:bg-blue-700 transition disabled:opacity-50">
                {loading ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
              </button>
            </form>
          </div>

          {/* ตารางคะแนน (ปรับเพิ่มเป็น 5 คอลัมน์) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ตารางคะแนนล่าสุด</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200 whitespace-nowrap">
                    <th className="p-3 font-medium">รหัส</th>
                    <th className="p-3 font-medium">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-medium">รายวิชา</th>
                    <th className="p-3 font-medium">ชื่อชิ้นงาน</th>
                    <th className="p-3 font-medium text-right">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {loading && scores.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                  ) : scores.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-8 text-gray-500">ยังไม่มีข้อมูลคะแนนในระบบ</td></tr>
                  ) : (
                    scores.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-3 whitespace-nowrap">{row.StudentID}</td>
                        <td className="p-3 whitespace-nowrap">{row.Name}</td>
                        <td className="p-3 whitespace-nowrap">{row.Subject}</td>
                        <td className="p-3 whitespace-nowrap">{row.work}</td>
                        <td className="p-3 text-right font-semibold text-blue-600">{row.Score}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
