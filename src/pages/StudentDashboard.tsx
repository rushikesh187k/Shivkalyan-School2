import React, { useState, useEffect } from "react";
import { LayoutDashboard, CalendarCheck, BookOpen, Wallet, User, QrCode, Download, ChevronRight, CheckCircle2, Clock, Eye, X, FileText, Loader2, Upload } from "lucide-react";
import { DashboardLayout, TabItem } from "../components/DashboardLayout";
import { SyllabusTracker } from "../components/SyllabusTracker";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { Material } from "../types";
import toast from "react-hot-toast";

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "syllabus", label: "Syllabus Tracker", icon: BookOpen },
  { id: "timetable", label: "Exam Time Table", icon: CalendarCheck },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "homework", label: "Homework", icon: BookOpen },
  { id: "fees", label: "Fees", icon: Wallet },
  { id: "profile", label: "Profile", icon: User }
];

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab />;
      case "syllabus":
        return <SyllabusTracker />;
      case "timetable":
        return <TimetableTab />;
      case "attendance":
        return <AttendanceTab />;
      case "homework":
        return <HomeworkTab />;
      case "fees":
        return <FeesTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return null;
    }
  };

  return (
    <>
      <DashboardLayout 
        title={TABS.find(t => t.id === activeTab)?.label || "Dashboard"} 
        tabs={TABS} 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      >
        {renderContent()}
      </DashboardLayout>

      {/* Floating Action Button for Upload Homework */}
      {activeTab !== "homework" && (
        <button
          onClick={() => setActiveTab("homework")}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-[#1A1A1A] hover:bg-[#222222] border border-white/10 text-white shadow-xl px-6 py-4 rounded-full flex items-center justify-center gap-2 z-40 transition-transform hover:scale-105"
        >
          <Upload className="w-5 h-5" />
          <span className="font-semibold uppercase tracking-wider text-xs">Upload Homework (PDF/Image)</span>
        </button>
      )}
    </>
  );
}

// --- Tab Components ---

function OverviewTab() {
  const { profile } = useAuthStore();
  const [liveProfile, setLiveProfile] = useState<any>(profile);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = onSnapshot(doc(db, "users", profile.id), (docS) => {
      if (docS.exists()) {
        setLiveProfile(docS.data());
      }
    });
    return () => unsub();
  }, [profile?.id]);

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotices(data);
    });
    return () => unsub();
  }, []);

  const dailyNotice = notices.find(n => n.category === "Daily Notice");
  const otherNotices = notices.filter(n => n.category !== "Daily Notice");

  return (
    <div className="space-y-6">
      {/* School Notice Board */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">School Notice Board</h2>
        
        {/* Today's Update */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-3">Today's Update</h3>
          {dailyNotice ? (
            <div className="p-6 rounded-2xl border border-white/10 bg-[#1A1A1A]">
              <h4 className="text-lg font-semibold text-white mb-2">{dailyNotice.title}</h4>
              <p className="text-sm text-[#8E8E93] mb-4">{new Date(dailyNotice.createdAt).toLocaleDateString()}</p>
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{dailyNotice.content}</p>
            </div>
          ) : (
             <div className="p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] text-center">
              <p className="text-[#8E8E93]">No new daily notices for today.</p>
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        {otherNotices.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-3">Recent Announcements</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {otherNotices.map((notice: any) => (
                <div key={notice.id} className="p-5 rounded-2xl border border-white/5 bg-[#121212] flex flex-col gap-2">
                   <div className="flex items-start justify-between gap-4">
                     <h4 className="text-white font-medium flex items-center gap-2">
                       {notice.title}
                       {notice.category && (
                         <span className="text-[10px] uppercase tracking-wider font-bold border border-white/20 px-2 py-1 rounded-full whitespace-nowrap">
                           [{notice.category}]
                         </span>
                       )}
                     </h4>
                     <span className="text-xs text-[#8E8E93] shrink-0">{new Date(notice.createdAt).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm text-[#8E8E93] line-clamp-2">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Attendance", value: liveProfile?.attendancePercentage !== undefined ? `${liveProfile.attendancePercentage}%` : "Not recorded", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
          { label: "Overall Grade", value: liveProfile?.overallGrade || "Not Graded", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
        ].map((stat, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-md flex flex-col justify-between`}>
            <span className="text-xs font-medium text-[#8E8E93] uppercase tracking-wider">{stat.label}</span>
            <span className={`mt-2 text-2xl font-semibold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Analytics Chart */}
      <div className="p-6 rounded-3xl border border-white/5 bg-[#121212]">
        <h3 className="text-sm font-medium text-white mb-6">Performance Trajectory</h3>
        <div className="flex items-center justify-center h-[250px] w-full text-center text-[#8E8E93] border border-dashed border-white/5 rounded-2xl bg-black/20">
          <p>No performance records available.</p>
        </div>
      </div>
    </div>
  );
}

function TimetableTab() {
  const { profile } = useAuthStore();
  const [timetable, setTimetable] = useState<any | null>(null);

  useEffect(() => {
    if (!profile) return;
    const { studentClass, studentMedium } = profile;
    const qTimetables = query(collection(db, "exam_timetables"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(qTimetables, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const myTimetable = data.find(t => t.classTarget === studentClass && t.mediumTarget === studentMedium);
      setTimetable(myTimetable || null);
    });
    return () => unsub();
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Exam Time Table</h2>
        {!timetable ? (
           <div className="p-10 rounded-2xl border border-white/5 bg-[#1A1A1A] text-center">
             <p className="text-[#8E8E93]">No active exam timetable found for your class and medium.</p>
           </div>
        ) : (
          <div className="p-6 rounded-2xl border border-white/5 bg-[#121212]">
             <h3 className="text-lg font-medium text-white mb-6">{timetable.title}</h3>
             <div className="space-y-3">
               {timetable.schedule && timetable.schedule.map((entry: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-black/40 border border-white/5 hover:bg-[#1A1A1A] transition-colors">
                     <span className="text-[#8E8E93] text-sm tabular-nums">
                       {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                     </span>
                     <span className="text-white font-medium text-right">{entry.subject}</span>
                  </div>
               ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceTab() {
  const { profile } = useAuthStore();
  const [liveProfile, setLiveProfile] = useState<any>(profile);

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = onSnapshot(doc(db, "users", profile.id), (docS) => {
      if (docS.exists()) {
        setLiveProfile(docS.data());
      }
    });
    return () => unsub();
  }, [profile?.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Attendance Box */}
        <div className="flex-1 p-8 test-center rounded-3xl border border-white/5 bg-[#121212] flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-xl mb-4">
            <QrCode className="h-32 w-32 text-black" />
          </div>
          <h3 className="text-lg font-medium text-white">Smart Attendance</h3>
          <p className="text-xs text-[#8E8E93] mt-2 max-w-[200px] text-center">Scan this QR code at the campus entry gate to mark your daily attendance.</p>
        </div>
        
        {/* Stats */}
        <div className="flex-[2] grid grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl border border-white/5 bg-[#1A1A1A] flex flex-col justify-center">
             <span className="text-5xl font-light text-white mb-2">{liveProfile?.attendancePercentage !== undefined ? liveProfile.attendancePercentage : "–"}<span className="text-2xl text-[#8E8E93]">%</span></span>
             <span className="text-sm text-[#8E8E93]">Overall Attendance</span>
          </div>
          <div className="p-6 rounded-3xl border border-white/5 bg-[#1A1A1A] flex flex-col justify-center">
            <span className="text-5xl font-light text-white mb-2">0</span>
            <span className="text-sm text-[#8E8E93]">Leaves Taken</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeworkTab() {
  const { profile } = useAuthStore();
  
  // Clean states for different content types
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [studyMaterialsList, setStudyMaterialsList] = useState<any[]>([]);

  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  const [submittingFor, setSubmittingFor] = useState<any | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // 1. Homework listener
    const qHomework = query(collection(db, "homework"), orderBy("createdAt", "desc"));
    const unsubHomework = onSnapshot(qHomework, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHomeworkList(data);
    }, (error) => {
      console.error("Homework listener error:", error);
    });

    // 2. Study Materials listener
    const qStudyMaterials = query(collection(db, "study_materials"), orderBy("createdAt", "desc"));
    const unsubStudyMaterials = onSnapshot(qStudyMaterials, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudyMaterialsList(data);
    }, (error) => {
      console.error("Study materials listener error:", error);
    });

    return () => {
      unsubHomework();
      unsubStudyMaterials();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  const handleDownloadFile = (fileName: string, base64Data: string) => {
    try {
      const a = document.createElement("a");
      a.href = base64Data;
      a.download = fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file", error);
    }
  };

  const handleBase64Upload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 800 * 1024) {
        reject(new Error("File is too large. Please select an image under 800KB."));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingFor || !submissionFile || !profile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const base64Data = await handleBase64Upload(submissionFile);
      
      const submissionRef = doc(collection(db, "submissions"));
      await setDoc(submissionRef, {
        homeworkId: submittingFor.id,
        homeworkTitle: submittingFor.title,
        studentId: profile.id,
        studentName: profile.fullName,
        fileUrl: base64Data,
        fileName: submissionFile.name,
        fileType: submissionFile.type,
        submittedAt: new Date().toISOString()
      });

      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        alert("Homework submitted successfully.");
        setSubmittingFor(null);
        setSubmissionFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      alert(error.message || "An error occurred during submission.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Study Materials Section */}
        <div>
          <h3 className="text-xl font-medium text-white mb-4">Shared Study Materials & Images</h3>
          {studyMaterialsList.length === 0 ? (
            <div className="text-center py-8 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
              No study materials shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyMaterialsList.map((sm) => (
                <div key={sm.id} className="p-5 rounded-2xl border border-white/5 bg-[#121212] hover:bg-[#1A1A1A] transition-colors cursor-pointer group flex flex-col justify-between h-full" onClick={() => setPreviewMaterial(sm)}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl border bg-blue-500/10 border-blue-500/20 text-blue-400 mb-3 block w-fit">
                        {sm.fileType?.startsWith('image/') ? <Eye className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                      </div>
                      {sm.fileType?.startsWith('image/') && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0 ml-4 group-hover:scale-105 transition-transform">
                          <img src={sm.fileData} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-white font-medium line-clamp-1">{sm.title}</h4>
                    <p className="text-xs text-[#8E8E93] mt-1">Uploaded By {sm.uploadedBy}</p>
                    {sm.classTarget && <p className="text-xs text-blue-400 mt-1 font-medium">{sm.classTarget}</p>}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-full justify-center">
                      <Eye className="w-3.5 h-3.5" /> {sm.fileType?.startsWith('image/') ? "Preview Image" : "Download / View PDF"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Homework Section */}
        <div>
          <h3 className="text-xl font-medium text-white mb-4">Pending Homework</h3>
          <div className="space-y-4">
            {homeworkList.length === 0 && (
              <div className="text-center py-8 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
                No homework assigned yet.
              </div>
            )}
            {homeworkList.map((hw, i) => (
              <div key={hw.id} className="p-5 rounded-2xl border border-white/5 bg-[#121212] flex items-center justify-between group hover:bg-[#1A1A1A] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl border bg-yellow-500/10 border-yellow-500/20 text-yellow-500 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{hw.title}</h4>
                    {hw.aiSummary && (
                       <p className="text-white text-sm mt-2 leading-relaxed bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                         {hw.aiSummary}
                       </p>
                    )}
                    <p className="text-xs text-[#8E8E93] mt-2 group-hover:text-[#A0A0A5]">Uploaded By {hw.uploadedBy || "Teacher"} • {new Date(hw.createdAt).toLocaleDateString()}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                       {hw.fileData && (
                        <button 
                          onClick={() => setPreviewMaterial(hw)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview / Download
                        </button>
                      )}
                      <button 
                        onClick={() => setSubmittingFor(hw)}
                        className="text-xs bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        Submit Practice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-[#121212] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
               <div>
                  <h3 className="text-white font-medium">{previewMaterial.title}</h3>
                  <p className="text-xs text-[#8E8E93] mt-1">{previewMaterial.fileName}</p>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => handleDownloadFile(previewMaterial.fileName, previewMaterial.fileData)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Download">
                   <Download className="w-5 h-5 text-white" />
                 </button>
                 <button onClick={() => setPreviewMaterial(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Close">
                   <X className="w-5 h-5 text-white" />
                 </button>
               </div>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-black flex items-center justify-center min-h-[50vh]">
              {previewMaterial.fileType?.startsWith("image/") ? (
                <img src={previewMaterial.fileData} alt="Preview" className="max-w-full max-h-full object-contain" />
              ) : previewMaterial.fileType === "application/pdf" ? (
                <iframe src={previewMaterial.fileData} className="w-full h-[60vh] md:h-[70vh] bg-white rounded-lg" title="PDF Preview" />
              ) : (
                <div className="text-white text-center">
                   <p className="mb-4">Preview not available for this file type.</p>
                   <button
                     onClick={() => handleDownloadFile(previewMaterial.fileName, previewMaterial.fileData)}
                     className="px-6 py-2 bg-white text-black font-medium rounded-lg"
                   >
                     Download File
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {submittingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-white/10 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-medium text-white">Submit Homework</h3>
              <button onClick={() => setSubmittingFor(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-[#8E8E93] mb-1">Submitting for topic</p>
              <p className="text-white font-medium">{submittingFor.title}</p>
            </div>
            <form onSubmit={handleSubmission} className="space-y-6">
              <div>
                <label className="block text-sm text-[#8E8E93] mb-2">Upload Your Work (PDF or Image)</label>
                <div className="relative w-full bg-[#1A1A1A] border border-white/10 border-dashed rounded-xl px-4 py-8 text-center flex flex-col items-center cursor-pointer hover:bg-white/5 transition-colors">
                  <Upload className="w-8 h-8 text-[#8E8E93] mb-2" />
                  <p className={`text-sm ${submissionFile ? 'text-white' : 'text-[#8E8E93]'}`}>
                    {submissionFile ? submissionFile.name : "Click or drag file to upload"}
                  </p>
                  <input 
                    type="file" 
                    required
                    accept="image/*,application/pdf" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isUploading || !submissionFile}
                className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Submission"}
              </button>
              
              {isUploading && (
                <div className="mt-4 p-4 rounded-xl border border-white/5 bg-[#1A1A1A]">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm text-[#8E8E93]">Uploading...</span>
                     <span className="text-sm text-white font-medium">{uploadProgress}%</span>
                   </div>
                   <div className="w-full bg-[#121212] rounded-full h-2">
                     <div 
                       className="bg-white h-2 rounded-full transition-all duration-300"
                       style={{ width: `${uploadProgress}%` }}
                     ></div>
                   </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FeesTab() {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-8 rounded-3xl border border-white/5 bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] text-center">
        <h3 className="text-[#8E8E93] text-sm uppercase tracking-wider font-medium mb-2">Total Outstanding</h3>
        <p className="text-5xl font-light text-white mb-6">₹ 0.00</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">All dues cleared</span>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium text-white mb-4">Payment History</h4>
        <div className="space-y-3">
          {[
            { term: "Term 1 Tuition", date: "15 Apr 2026", amount: "₹ 24,000" },
            { term: "Annual Transport", date: "10 Apr 2026", amount: "₹ 12,000" }
          ].map((receipt, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-[#121212] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{receipt.term}</p>
                <p className="text-xs text-[#8E8E93] mt-1">Paid on {receipt.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white">{receipt.amount}</span>
                <button className="p-2 text-[#8E8E93] hover:text-white bg-white/5 rounded-lg transition-colors border border-white/10">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { profile } = useAuthStore();
  const [liveProfile, setLiveProfile] = useState<any>(profile);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    mobileNumber: profile?.mobileNumber || "",
    dob: profile?.dob || "",
    address: profile?.address || "",
    caste: profile?.caste || "",
  });

  useEffect(() => {
    if (!profile?.id) return;
    const unsub = onSnapshot(doc(db, "users", profile.id), (docS) => {
      if (docS.exists()) {
        const data = docS.data();
        setLiveProfile(data);
        if (!isEditing) {
          setEditForm({
            mobileNumber: data.mobileNumber || "",
            dob: data.dob || "",
            address: data.address || "",
            caste: data.caste || "",
          });
        }
      }
    });
    return () => unsub();
  }, [profile?.id, isEditing]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const { compressImage } = await import('../utils/imageUtils');
      const compressedBase64 = await compressImage(file, 256, 256);
      
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, { 
        photoURL: compressedBase64,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profile photo updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    try {
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        mobileNumber: editForm.mobileNumber,
        dob: editForm.dob,
        address: editForm.address,
        caste: editForm.caste,
        updatedAt: new Date().toISOString()
      });
      toast.success("Profile details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile details");
    }
  };

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      {/* Digital ID Card */}
      <div className="w-full rounded-3xl border border-white/10 bg-gradient-to-b from-[#222] to-[#0A0A0A] p-6 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Hologram aesthetic */}
        <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        
        <div className="text-center mb-6 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-1">Shivkalyan Sanstha</p>
          <div className="h-px w-12 bg-white/20 mx-auto mt-2"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <label className="relative group cursor-pointer w-28 h-28 rounded-full border-4 border-[#1A1A1A] bg-[#333] mb-4 overflow-hidden shadow-xl block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            {liveProfile?.photoURL ? (
              <img src={liveProfile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-[#8E8E93]">
                <User className="w-10 h-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <span className="text-xs text-white">Uploading...</span>
              ) : (
                <span className="text-xs text-white">Change DP</span>
              )}
            </div>
          </label>
          <h2 className="text-xl font-semibold text-white mb-1">{liveProfile?.fullName || "Student"}</h2>
          <p className="text-xs text-[#8E8E93] mb-4">{liveProfile?.role}</p>
          
          <div className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5 space-y-3">
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-[#8E8E93]">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({...editForm, mobileNumber: e.target.value})}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-[#8E8E93]">DOB</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({...editForm, dob: e.target.value})}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-[#8E8E93]">Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <label className="text-[#8E8E93]">Caste</label>
                  <input
                    type="text"
                    value={editForm.caste}
                    onChange={(e) => setEditForm({...editForm, caste: e.target.value})}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                  <button onClick={() => setIsEditing(false)} className="text-white border border-white/20 px-3 py-1 rounded text-xs hover:bg-white/10">Cancel</button>
                  <button onClick={handleSaveProfile} className="bg-white text-black px-3 py-1 rounded text-xs font-medium hover:bg-gray-200">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-[#8E8E93]">Mobile Number</span>
                  <span className="text-white font-medium">{liveProfile?.mobileNumber || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-[#8E8E93]">DOB</span>
                  <span className="text-white font-medium">{liveProfile?.dob || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-[#8E8E93]">Address</span>
                  <span className="text-white font-medium break-words leading-relaxed">{liveProfile?.address || "N/A"}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="text-[#8E8E93]">Caste</span>
                  <span className="text-white font-medium">{liveProfile?.caste || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                     <span className="text-[#8E8E93]">Class</span>
                     <span className="text-white font-medium">{liveProfile?.studentClass || "N/A"}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                     <span className="text-[#8E8E93]">Medium</span>
                     <span className="text-white font-medium break-words">{liveProfile?.studentMedium || "N/A"}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg text-xs transition-colors"
                >
                  Edit Details
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
