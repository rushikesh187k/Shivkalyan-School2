import React, { useState } from "react";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export function TeacherAttendanceControl() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentClass, setStudentClass] = useState("");
  const [studentMedium, setStudentMedium] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, "Present" | "Absent">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    if (!studentClass || !studentMedium) {
      toast.error("Please select Class and Medium");
      return;
    }
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", "Student"),
        where("studentClass", "==", studentClass),
        where("studentMedium", "==", studentMedium)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setStudents(fetched);
      
      const initialAttendance: Record<string, "Present" | "Absent"> = {};
      fetched.forEach(st => {
        initialAttendance[st.id!] = "Present";
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Present" ? "Absent" : "Present"
    }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      students.forEach(st => {
        if (!st.id) return;
        const status = attendanceData[st.id] || "Present";
        const recordId = `${st.id}_${date}`;
        const ref = doc(db, "daily_attendance", recordId);
        batch.set(ref, {
          date,
          studentId: st.id,
          status,
          studentName: st.fullName,
          studentClass,
          studentMedium
        });
      });
      await batch.commit();
      toast.success("Bulk attendance saved successfully!");
    } catch (error) {
      console.error("Attendance submit error:", error);
      toast.error("Failed to save attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-medium text-white mb-4">Bulk Attendance Control</h2>
        <div className="flex flex-wrap gap-4 items-end bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
          <div className="w-full md:w-auto">
            <label className="block text-sm text-[#8E8E93] mb-2">Class</label>
            <select
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/30 min-w-[150px]"
            >
              <option value="" disabled>Select Class</option>
              <option value="5th">5th</option>
              <option value="6th">6th</option>
              <option value="7th">7th</option>
              <option value="8th">8th</option>
              <option value="9th">9th</option>
              <option value="10th">10th</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm text-[#8E8E93] mb-2">Medium</label>
            <select
              value={studentMedium}
              onChange={(e) => setStudentMedium(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/30 min-w-[150px]"
            >
              <option value="" disabled>Select Medium</option>
              <option value="Medium 1">Medium 1</option>
              <option value="Medium 2">Medium 2</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm text-[#8E8E93] mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#121212] border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <button 
            onClick={fetchStudents}
            disabled={loading}
            className="px-6 py-2 bg-white text-black font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Fetch Students"}
          </button>
        </div>
      </div>

      {students.length > 0 && (
        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Students ({students.length})</h3>
            <button 
              onClick={submitAttendance}
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Attendance"}
            </button>
          </div>
          
          <div className="grid gap-3">
            {students.map(st => {
              const isPresent = attendanceData[st.id!] === "Present";
              return (
                <div key={st.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-[#121212]">
                  <div>
                    <h4 className="text-white font-medium">{st.fullName}</h4>
                    <p className="text-xs text-[#8E8E93]">{st.mobileNumber}</p>
                  </div>
                  <button 
                    onClick={() => toggleAttendance(st.id!)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isPresent ? 'bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'}`}
                  >
                    {isPresent ? (
                      <><CheckCircle className="w-4 h-4" /> Present</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Absent</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
