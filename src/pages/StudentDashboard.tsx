import React, { useState, useEffect } from "react";
import { LayoutDashboard, CalendarCheck, BookOpen, Wallet, User, QrCode, Download, ChevronRight, CheckCircle2, Clock, Eye, X, FileText, Loader2, Upload } from "lucide-react";
import { DashboardLayout, TabItem } from "../components/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, setDoc } from "firebase/firestore";
import { db, storage } from "../lib/firebase";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuthStore } from "../store/useAuthStore";
import { Material } from "../types";
import toast from "react-hot-toast";

const performanceData = [
  { month: "Jan", score: 85 },
  { month: "Feb", score: 88 },
  { month: "Mar", score: 84 },
  { month: "Apr", score: 92 },
  { month: "May", score: 95 },
  { month: "Jun", score: 91 },
];

const TABS: TabItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
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
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Attendance", value: liveProfile?.attendancePercentage !== undefined ? `${liveProfile.attendancePercentage}%` : "–", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
          { label: "Overall Grade", value: liveProfile?.overallGrade || "Not Graded", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
          { label: "Pending Tasks", value: "3", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
          { label: "Fee Status", value: "Paid", color: "text-white", bg: "bg-white/10", border: "border-white/20" },
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
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="month" stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8E8E93" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1A1A1A", borderColor: "#333", borderRadius: "12px", color: "#fff" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Assistant Placeholder */}
      <div className="p-6 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-50">
          <div className="w-24 h-24 bg-blue-500/30 blur-3xl rounded-full"></div>
        </div>
        <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
          AI Study Assistant
        </h3>
        <p className="text-sm text-gray-400 max-w-md">Based on your recent scores, you should focus more on Advanced Mathematics. I have generated a personalized study plan for you.</p>
        <button className="mt-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-xs font-medium text-blue-200 hover:bg-blue-500/30 transition-colors">
          View Study Plan
        </button>
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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [submittingFor, setSubmittingFor] = useState<Material | null>(null);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionState, setSubmissionState] = useState<'IDLE' | 'UPLOADING' | 'ERROR'>('IDLE');

  useEffect(() => {
    let allMaterials: Material[] = [];

    const updateState = () => {
      const sorted = [...allMaterials].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMaterials(sorted);
    };

    const qMaterials = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsubMaterials = onSnapshot(qMaterials, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Material[];
      allMaterials = allMaterials.filter(m => m.type === "homework" || m.type === "study_material"); 
      allMaterials = [...allMaterials, ...fetched.filter(m => m.type !== "homework" && m.type !== "study_material")];
      updateState();
    });

    const qHomework = query(collection(db, "homework"), orderBy("createdAt", "desc"));
    const unsubHomework = onSnapshot(qHomework, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, type: "homework", ...doc.data() })) as Material[];
      allMaterials = allMaterials.filter(m => m.type !== "homework");
      allMaterials = [...allMaterials, ...fetched];
      updateState();
    });

    const qStudyMaterials = query(collection(db, "study_materials"), orderBy("createdAt", "desc"));
    const unsubStudyMaterials = onSnapshot(qStudyMaterials, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, type: "study_material", ...doc.data() })) as Material[];
      allMaterials = allMaterials.filter(m => m.type !== "study_material");
      allMaterials = [...allMaterials, ...fetched];
      updateState();
    });

    return () => {
      unsubMaterials();
      unsubHomework();
      unsubStudyMaterials();
    };
  }, []);

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingFor || !submissionFile || !profile) return;
    
    try {
      setSubmissionState('UPLOADING');
      const fileRef = ref(storage, `student_submissions/${profile.id}_${Date.now()}_${submissionFile.name}`);
      const uploadTask = await uploadBytes(fileRef, submissionFile);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      const submissionRef = doc(collection(db, "submissions"));
      await setDoc(submissionRef, {
        homeworkId: submittingFor.id,
        homeworkTitle: submittingFor.title,
        studentId: profile.id,
        studentName: profile.fullName,
        fileUrl: downloadURL,
        fileName: submissionFile.name,
        fileType: submissionFile.type,
        submittedAt: new Date().toISOString()
      });
      
      toast.success("Homework submitted successfully");
      setSubmittingFor(null);
      setSubmissionFile(null);
    } catch (error: any) {
      setSubmissionState('ERROR');
      console.error(error);
      alert(error.message || "Upload failed");
    } finally {
      setSubmissionState('IDLE');
    }
  };

  const homeworks = materials.filter(m => m.type === "homework");
  const studyMaterials = materials.filter(m => m.type === "study_material");

  return (
    <>
      <div className="space-y-8">
        {/* Study Materials Section */}
        <div>
          <h3 className="text-xl font-medium text-white mb-4">Shared Study Materials & Images</h3>
          {studyMaterials.length === 0 ? (
            <div className="text-center py-8 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
              No study materials shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyMaterials.map((sm) => (
                <div key={sm.id} className="p-5 rounded-2xl border border-white/5 bg-[#121212] hover:bg-[#1A1A1A] transition-colors cursor-pointer group flex flex-col justify-between h-full" onClick={() => setPreviewMaterial(sm)}>
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl border bg-blue-500/10 border-blue-500/20 text-blue-400 mb-3 block w-fit">
                        {sm.fileType.startsWith('image/') ? <Eye className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                      </div>
                      {sm.fileType.startsWith('image/') && (
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
                      <Eye className="w-3.5 h-3.5" /> {sm.fileType.startsWith('image/') ? "Preview Image" : "Download / View PDF"}
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
            {homeworks.length === 0 && (
              <div className="text-center py-8 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
                No homework assigned yet.
              </div>
            )}
            {homeworks.map((hw, i) => (
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
                        <a 
                          href={hw.fileData}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download / View
                        </a>
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
               <button onClick={() => setPreviewMaterial(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <X className="w-5 h-5 text-white" />
               </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-black flex items-center justify-center min-h-[50vh]">
              {previewMaterial.fileType.startsWith("image/") ? (
                <img src={previewMaterial.fileData} alt="Preview" className="max-w-full max-h-full object-contain" />
              ) : previewMaterial.fileType === "application/pdf" ? (
                <iframe src={previewMaterial.fileData} className="w-full h-[60vh] md:h-[70vh] bg-white rounded-lg" title="PDF Preview" />
              ) : (
                <div className="text-white text-center">
                   <p className="mb-4">Preview not available for this file type.</p>
                   <a
                     href={previewMaterial.fileData}
                     download={previewMaterial.fileName}
                     className="px-6 py-2 bg-white text-black font-medium rounded-lg"
                   >
                     Download File
                   </a>
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
                    {submissionFile ? submissionFile.name : "Click or drag file to upload (Max 10MB)"}
                  </p>
                  <input 
                    type="file" 
                    required
                    accept=".pdf,image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSubmissionFile(e.target.files[0]);
                      }
                    }} 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={submissionState === 'UPLOADING' || !submissionFile}
                className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submissionState === 'UPLOADING' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Submission"}
              </button>
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
  const [isUploading, setIsUploading] = useState(false);

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

  return (
    <div className="flex flex-col items-center max-w-sm mx-auto">
      {/* Digital ID Card */}
      <div className="w-full aspect-[2/3] rounded-3xl border border-white/10 bg-gradient-to-b from-[#222] to-[#0A0A0A] p-6 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Hologram aesthetic */}
        <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#8E8E93] font-bold mb-1">Shivkalyan Sanstha</p>
          <div className="h-px w-12 bg-white/20 mx-auto mt-2"></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <label className="relative group cursor-pointer w-32 h-32 rounded-full border-4 border-[#1A1A1A] bg-[#333] mb-6 overflow-hidden shadow-xl block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-[#8E8E93]">
                <User className="w-12 h-12" />
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
          <h2 className="text-2xl font-semibold text-white mb-1">{profile?.fullName || "Student"}</h2>
          <p className="text-sm text-[#8E8E93] mb-6">{profile?.role}</p>
          
          <div className="w-full bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8E8E93]">Mobile</span>
              <span className="text-white font-medium">{profile?.mobileNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between text-xs mb-2">
              <span className="text-[#8E8E93]">DOB</span>
              <span className="text-white font-medium">--</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#8E8E93]">Blood Group</span>
              <span className="text-white font-medium">--</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
