import React, { useState, useEffect } from "react";
import { Upload, BookOpen, Calendar, FileText, Plus, X, Eye, Loader2, Users } from "lucide-react";
import { TeacherManageGrades } from "../components/TeacherManageGrades";
import { DashboardLayout, TabItem } from "../components/DashboardLayout";

// Removed StudentSearch since we replaced it with TeacherManageGrades
import toast from "react-hot-toast";
import { collection, doc, setDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { Material } from "../types";

const TEACHER_TABS: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BookOpen },
  { id: "students", label: "Manage Grades", icon: Users },
  { id: "study_materials", label: "Study Materials", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "timetable", label: "Exam Time Table", icon: Calendar },
  { id: "notes", label: "Notes", icon: Upload },
];

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  const { profile } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'ERROR'>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [classTarget, setClassTarget] = useState("");
  
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  useEffect(() => {
    let allMaterials: Material[] = [];

    const updateState = () => {
      // Sort unified list
      const sorted = [...allMaterials].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setMaterials(sorted);
    };

    const qMaterials = query(collection(db, "materials"), orderBy("createdAt", "desc"));
    const unsubMaterials = onSnapshot(qMaterials, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Material[];
      allMaterials = allMaterials.filter(m => m.type === "homework" || m.type === "study_material"); // keep only separate collections
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

    const qSubmissions = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
    const unsubSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissions(fetched);
    });

    return () => {
      unsubMaterials();
      unsubHomework();
      unsubStudyMaterials();
      unsubSubmissions();
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setShowUploadForm(false);
  };

  const [showQuickUpload, setShowQuickUpload] = useState(false);

  const handleUpload = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    
    try {
      setUploadState('UPLOADING');
      // Create a storage reference
      const fileRef = ref(storage, `teacher_uploads/${Date.now()}_${selectedFile.name}`);
      
      // Upload the file to Firebase Storage
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      let aiSummary = "";
      if (type === "homework") {
        try {
          const res = await fetch("/api/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, text: "" })
          });
          const data = await res.json();
          if (data.summary) {
            aiSummary = data.summary;
          }
        } catch (err) {
          console.error("AI Summary generation failed", err);
        }
      }

      const collectionName = type === "homework" ? "homework" : (type === "study_material" ? "study_materials" : "materials");
      const materialRef = doc(collection(db, collectionName));
      const newMaterial: any = {
        title,
        type,
        fileData: downloadURL,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadedBy: profile?.fullName || "Teacher",
        createdAt: new Date().toISOString()
      };
      
      if (aiSummary) {
        newMaterial.aiSummary = aiSummary;
      }
      
      if (classTarget) {
        newMaterial.classTarget = classTarget;
      }
      
      await setDoc(materialRef, newMaterial);
      
      toast.success("File uploaded successfully");
      setShowUploadForm(false);
      setShowQuickUpload(false);
      setSelectedFile(null);
      setTitle("");
      setClassTarget("");
    } catch (error: any) {
      setUploadState('ERROR');
      console.error(error);
      alert(error.message || "Unknown error");
    } finally {
      setUploadState('IDLE');
    }
  };

  const renderUploadForm = (formTitle: string, type: string) => (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-medium text-white">Upload {formTitle}</h2>
      </div>
      <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
        <form className="space-y-4" onSubmit={(e) => handleUpload(e, type)}>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">File Title / Topic</label>
            <input 
              type="text" 
              required 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30" 
              placeholder={`e.g. Maths Homework Practice Set`} 
            />
          </div>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">Target Class / Standard (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Class 10 A, Batch 2"
              value={classTarget}
              onChange={e => setClassTarget(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">File (PDF/Image)</label>
            <div className="relative w-full bg-[#121212] border border-white/10 border-dashed rounded-xl px-4 py-8 text-center flex flex-col items-center cursor-pointer hover:bg-white/5 transition-colors">
              <Upload className="w-8 h-8 text-[#8E8E93] mb-2" />
              <p className={`text-sm ${selectedFile ? 'text-white' : 'text-[#8E8E93]'}`}>
                {selectedFile ? selectedFile.name : "Click or drag file to upload (Max 10MB)"}
              </p>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                       setSelectedFile(e.target.files[0]);
                   }
                }} 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={uploadState === 'UPLOADING'}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors mt-6 flex items-center justify-center disabled:opacity-70"
          >
            {uploadState === 'UPLOADING' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload Material"}
          </button>
        </form>
      </div>
    </div>
  );

  const renderList = (listTitle: string, type: string) => {
    const list = materials.filter(m => m.type === type);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-white">{listTitle}</h2>
        </div>
        {list.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
            No {listTitle.toLowerCase()} uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(m => (
              <div key={m.id} className="p-5 rounded-2xl border border-white/5 bg-[#1A1A1A] flex flex-col justify-between hover:bg-[#222222] transition-colors">
                 <div>
                   <h3 className="text-white font-medium mb-1">{m.title}</h3>
                   <p className="text-xs text-[#8E8E93]">
                     By {m.uploadedBy} • {new Date(m.createdAt).toLocaleDateString()}
                   </p>
                   {m.classTarget && (
                     <p className="text-xs text-blue-400 mt-1 font-medium">{m.classTarget}</p>
                   )}
                 </div>
                 <div className="mt-4 flex gap-2">
                   <button 
                     onClick={() => setPreviewMaterial(m)}
                     className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                   >
                     <Eye className="w-4 h-4" /> Preview
                   </button>
                   <a 
                     href={m.fileData}
                     download={m.fileName}
                     className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                   >
                    Download
                   </a>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSubmissionsList = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-white">Student Submissions</h2>
        </div>
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
            No homework submissions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="p-5 rounded-2xl border border-white/5 bg-[#1A1A1A] flex flex-col justify-between hover:bg-[#222222] transition-colors">
                <div>
                  <h3 className="text-white font-medium mb-1">Homework: {sub.homeworkTitle}</h3>
                  <p className="text-sm text-blue-400 font-medium my-1.5">{sub.studentName}</p>
                  <p className="text-xs text-[#8E8E93]">
                    Submitted: {new Date(sub.submittedAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 flex gap-2">
                  {sub.fileType?.startsWith('image/') && (
                    <button 
                      onClick={() => setPreviewMaterial({
                        id: sub.id,
                        title: `${sub.studentName}'s Submission`,
                        type: 'submission',
                        fileData: sub.fileUrl,
                        fileName: sub.fileName,
                        fileType: sub.fileType,
                        uploadedBy: sub.studentName,
                        createdAt: sub.submittedAt
                      })}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                  )}
                  <a 
                    href={sub.fileUrl}
                    download={sub.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "students":
        return <TeacherManageGrades />;
      case "study_materials":
        return (
          <div className="space-y-10">
            {renderUploadForm("Study Material", "study_material")}
            <hr className="border-white/10" />
            {renderList("Shared Study Materials", "study_material")}
          </div>
        );
      case "homework":
        return (
          <div className="space-y-10">
            {renderUploadForm("Homework Topic", "homework")}
            <hr className="border-white/10" />
            {renderList("Assigned Homework", "homework")}
            <hr className="border-white/10" />
            {renderSubmissionsList()}
          </div>
        );
      case "timetable":
        return (
          <div className="space-y-10">
            {renderUploadForm("Exam Time Table", "timetable")}
            <hr className="border-white/10" />
            {renderList("Exam Time Table", "timetable")}
          </div>
        )
      case "notes":
        return (
          <div className="space-y-10">
            {renderUploadForm("Class Notes", "notes")}
            <hr className="border-white/10" />
            {renderList("Class Notes", "notes")}
          </div>
        )
      default:
        return (
          <div>
            <h2 className="text-xl font-medium text-white mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <FileText className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Total Homeworks</p>
                <p className="text-2xl font-semibold text-white">{materials.filter(m => m.type === "homework").length}</p>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <Calendar className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Uploaded Timetables</p>
                <p className="text-2xl font-semibold text-white">{materials.filter(m => m.type === "timetable").length}</p>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <BookOpen className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Study Materials</p>
                <p className="text-2xl font-semibold text-white">{materials.filter(m => m.type === "study_material").length}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <DashboardLayout title="Teacher Portal" tabs={TEACHER_TABS} activeTab={activeTab} onTabChange={handleTabChange}>
        <div className="p-6 md:p-8">
          {renderContent()}
        </div>
      </DashboardLayout>

      {/* Floating Action Button for Upload Homework */}
      {activeTab !== "homework" && activeTab !== "study_materials" && (
        <button
          onClick={() => setShowQuickUpload(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 bg-[#1A1A1A] hover:bg-[#222222] border border-white/10 text-white shadow-xl px-6 py-4 rounded-full flex items-center justify-center gap-2 z-40 transition-transform hover:scale-105"
        >
          <Upload className="w-5 h-5" />
          <span className="font-semibold uppercase tracking-wider text-xs">Upload Homework (PDF/Image)</span>
        </button>
      )}

      {/* Quick Upload Modal */}
      {showQuickUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#121212] rounded-3xl border border-white/10 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-medium text-white">Quick Homework Upload</h3>
               <button onClick={() => setShowQuickUpload(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <X className="w-5 h-5 text-white" />
               </button>
            </div>
            {renderUploadForm("Homework Topic", "homework")}
          </div>
        </div>
      )}

      {/* Preview Modal */}
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
    </>
  );
}
