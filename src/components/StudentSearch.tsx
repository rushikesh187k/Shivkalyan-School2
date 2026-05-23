import React, { useState, useEffect } from "react";
import { Search, Filter, X, User, BookOpen, TrendingUp, ChevronRight, Award, AlertCircle, Database } from "lucide-react";
import { collection, query, where, getDocs, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { UserProfile } from "../types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import toast from "react-hot-toast";

interface StudentSearchProps {}

export function StudentSearch({}: StudentSearchProps) {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "Student"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setStudents(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesName = student.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "" || student.assignedClass === selectedClass;
    return matchesName && matchesClass;
  });

  const performanceData: {subject: string, marks: number}[] = [];
  const averageMarks = 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-white">Student Core Directory</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Search student by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93]" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-[#121212] border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white appearance-none focus:outline-none focus:border-white/30 transition-colors cursor-pointer"
          >
            <option value="">All Classes</option>
            <option value="Class 10 A">Class 10 A</option>
            <option value="Class 10 B">Class 10 B</option>
            <option value="Class 9 A">Class 9 A</option>
            <option value="Class 8 A">Class 8 A</option>
            <option value="Class 7 A">Class 7 A</option>
            <option value="Class 6 A">Class 6 A</option>
            <option value="Class 5 A">Class 5 A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#8E8E93]">
          Loading students...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-[#121212]">
          <Search className="w-12 h-12 text-[#8E8E93] mb-4" />
          <p className="text-white font-medium">No students found</p>
          <p className="text-sm text-[#8E8E93] mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => setSelectedStudent(student)}
              className="p-5 rounded-2xl border border-white/10 bg-[#121212] hover:bg-[#1A1A1A] transition-all cursor-pointer group flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{student.fullName}</h4>
                <p className="text-sm text-[#8E8E93] mt-1">{student.assignedClass || "Unassigned"}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-md">Roll: {student.id.substring(0, 4).toUpperCase()}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#333] group-hover:text-white transition-colors self-center" />
            </div>
          ))}
        </div>
      )}

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#121212] rounded-3xl border border-white/10 shadow-2xl my-8">
            <button
              onClick={() => { setSelectedStudent(null); setShowPerformance(false); }}
              className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            
            <div className="p-8 border-b border-white/5">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                  <User className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-semibold text-white tracking-tight">{selectedStudent.fullName}</h2>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-[#8E8E93]" /> {selectedStudent.assignedClass || "Unassigned"}</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white flex items-center gap-1.5"><Award className="w-4 h-4 text-[#8E8E93]" /> Roll No: {selectedStudent.id.substring(0, 4).toUpperCase()}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-[#8E8E93] mb-1 uppercase tracking-wider font-medium">Guardian / Parent</p>
                  <p className="text-white">{selectedStudent.fullName}'s Parent</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-[#8E8E93] mb-1 uppercase tracking-wider font-medium">Contact Number</p>
                  <p className="text-white">{selectedStudent.mobileNumber}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-[#8E8E93] mb-1 uppercase tracking-wider font-medium">Academic Year</p>
                  <p className="text-white">2023-2024</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-[#8E8E93] mb-1 uppercase tracking-wider font-medium">Attendance</p>
                  <p className="text-green-400 font-medium tracking-tight">85.4%</p>
                </div>
              </div>

              {!showPerformance ? (
                <button
                  onClick={() => setShowPerformance(true)}
                  className="w-full mt-8 bg-white text-black font-medium py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" /> View Last Exam Performance
                </button>
              ) : (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-white">Performance Analytics</h3>
                    {performanceData.length > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-[#8E8E93] uppercase tracking-wider font-medium mb-1">Average Marks</p>
                        <p className="text-2xl font-semibold text-white">{averageMarks}%</p>
                      </div>
                    )}
                  </div>
                  
                  {performanceData.length > 0 ? (
                    <>
                      <div className="h-64 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis dataKey="subject" stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#8E8E93" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip cursor={{fill: '#222'}} contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', color: '#fff' }} />
                            <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                              {performanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.marks < 50 ? "#ef4444" : "#ffffff"} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium mb-1">Performance Insight</p>
                          <p className="text-xs text-blue-400/80">Subjects in red require attention. Excellent performance in {performanceData.reduce((prev, current) => (prev.marks > current.marks) ? prev : current).subject}.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-[#8E8E93] bg-white/5 rounded-xl border border-white/5">
                      No performance records found for {selectedStudent.fullName}.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
