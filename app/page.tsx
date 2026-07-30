'use client'
import { useState, useEffect } from 'react';

export default function Dashboard() {
  // นำ Web App URL ที่ได้จาก Google Apps Script มาวางแทนที่ข้อความด้านล่างนี้
  const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"; 

  // เพิ่ม <any[]> เพื่อให้ TypeScript รู้ว่าเป็น Array
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ studentId: '', name: '', subject: '', score: '' });

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

  useEffect(() => {
    fetchScores();
  }, []);

  // เพิ่ม : any ให้กับ e
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // เพิ่ม : any ให้กับ e
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "text/plain;charset=utf-8", 
        }
      });
      setFormData({ studentId: '', name: '', subject: '', score: '' });
      fetchScores(); 
    } catch (error) {
      console.error("Error saving data:", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NVC Learning Hub</h1>
            <p className="text-gray-500 text-sm mt-1">ระบบจัดการคะแนนนักเรียน</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
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

          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">ตารางคะแนนล่าสุด</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
                    <th className="p-3 font-medium">รหัสนักเรียน</th>
                    <th className="p-3 font-medium">ชื่อ-นามสกุล</th>
                    <th className="p-3 font-medium">รายวิชา</th>
                    <th className="p-3 font-medium text-right">คะแนน</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {loading && scores.length === 0 ? (
                    <tr><td colSpan={4} className="text-center p-8 text-gray-500">กำลังโหลดข้อมูล...</td></tr>
                  ) : (
                    scores.map((row, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="p-3">{row.StudentID}</td>
                        <td className="p-3">{row.Name}</td>
                        <td className="p-3">{row.Subject}</td>
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
