import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { Loader2, Search, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export function TeacherManageGrades() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [attendance, setAttendance] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "Student"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
        setStudents(fetched);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsUpdating(true);
    try {
      const numAttendance = attendance ? parseFloat(attendance) : undefined;
      const dataToUpdate: any = {};
      if (numAttendance !== undefined && !isNaN(numAttendance)) {
        dataToUpdate.attendancePercentage = numAttendance;
      }
      dataToUpdate.overallGrade = grade;

      const stRef = doc(db, "users", selectedStudent.id);
      await updateDoc(stRef, dataToUpdate);

      setStudents(prev => 
        prev.map(st => st.id === selectedStudent.id ? { ...st, ...dataToUpdate } : st)
      );

      toast.success("Student records updated successfully!");
      setSelectedStudent(null);
      setAttendance("");
      setGrade("");
    } catch (error: any) {
      console.error("Update failed", error);
      toast.error(error.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStudents = students.filter(st => 
    st.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Side: Select Student */}
        <div className="flex-1 bg-[#121212] rounded-3xl border border-white/10 overflow-hidden shadow-xl max-h-[800px] flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-medium text-white mb-4">Select Student</h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2 relative">
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-[#8E8E93]" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-10 text-[#8E8E93]">No students found.</div>
            ) : (
              filteredStudents.map(st => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedStudent(st);
                    setAttendance(st.attendancePercentage ? String(st.attendancePercentage) : "");
                    setGrade(st.overallGrade || "");
                  }}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    selectedStudent?.id === st.id ? "bg-white/10 border-white/30" : "bg-[#1A1A1A] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div>
                    <h3 className="text-white font-medium">{st.fullName}</h3>
                    <p className="text-xs text-[#8E8E93] mt-1">{st.assignedClass || "No Class Assigned"}</p>
                  </div>
                  {(st.attendancePercentage !== undefined || st.overallGrade) && (
                    <div className="text-xs space-y-1 text-right text-gray-400">
                      {st.attendancePercentage !== undefined && <p>Att: {st.attendancePercentage}%</p>}
                      {st.overallGrade && <p>Grade: {st.overallGrade}</p>}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Update Form */}
        <div className="flex-1">
          {selectedStudent ? (
            <div className="bg-[#121212] rounded-3xl border border-white/10 shadow-xl p-8 sticky top-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center shrink-0">
                   <h2 className="text-2xl text-white font-bold">{selectedStudent.fullName.charAt(0)}</h2>
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-white">{selectedStudent.fullName}</h2>
                  <p className="text-[#8E8E93] mt-1">Manage Academic Records</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attendance Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={attendance}
                    onChange={(e) => setAttendance(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="e.g. 92.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Overall Grade
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="e.g. A, B+, 95%, Pass"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-75"
                  >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Save Records</>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-3xl border border-white/5 shadow-xl h-full min-h-[400px] flex items-center justify-center p-8 text-center text-[#8E8E93]">
                Please select a student from the list to manage their grades and attendance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
