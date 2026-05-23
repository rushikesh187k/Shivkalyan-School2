import React, { useState, useEffect } from "react";
import { Upload, BookOpen, Calendar, FileText, X, Eye, Loader2, Users, Download, UserCheck } from "lucide-react";
import { TeacherManageGrades } from "../components/TeacherManageGrades";
import { TeacherAttendanceControl } from "../components/TeacherAttendanceControl";
import { DashboardLayout, TabItem } from "../components/DashboardLayout";
import { collection, doc, setDoc, onSnapshot, query, orderBy, Timestamp, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { Material } from "../types";

const TEACHER_TABS: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: BookOpen },
  { id: "students", label: "Manage Grades", icon: Users },
  { id: "attendance", label: "Attendance Control", icon: UserCheck },
  { id: "study_materials", label: "Study Materials", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "timetable", label: "Exam Time Table", icon: Calendar },
  { id: "notes", label: "Notes", icon: Upload },
];

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { profile } = useAuthStore();
  
  // Clean states for different content types
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [studyMaterialsList, setStudyMaterialsList] = useState<any[]>([]);
  const [timetablesList, setTimetablesList] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [submissionsList, setSubmissionsList] = useState<any[]>([]);

  // Upload pipeline state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [classTarget, setClassTarget] = useState("");
  
  // UI states
  const [previewMaterial, setPreviewMaterial] = useState<any | null>(null);
  const [showQuickUpload, setShowQuickUpload] = useState(false);

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

    // 3. Timetables listener
    const qTimetables = query(collection(db, "timetable"), orderBy("createdAt", "desc"));
    const unsubTimetables = onSnapshot(qTimetables, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimetablesList(data);
    });

    // 4. Notes listener
    const qNotes = query(collection(db, "notes"), orderBy("createdAt", "desc"));
    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotesList(data);
    });

    // 5. Submissions listener
    const qSubmissions = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
    const unsubSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubmissionsList(data);
    });

    return () => {
      unsubHomework();
      unsubStudyMaterials();
      unsubTimetables();
      unsubNotes();
      unsubSubmissions();
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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

  const handleUploadSubmit = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      alert("Please provide a title and select a file to upload.");
      return;
    }
    
    // Determine the exact target collection
    const targetCollection = type;
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
      const base64Data = await handleBase64Upload(selectedFile);
      
      const newDocRef = doc(collection(db, targetCollection));
      await setDoc(newDocRef, {
        title: title,
        type: type,
        fileData: base64Data,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadedBy: profile?.fullName || "Teacher",
        classTarget: classTarget || "",
        createdAt: new Date().toISOString()
      });

      setUploadProgress(100);
      clearInterval(progressInterval);
      
      setTimeout(() => {
        // Reset form fields on success
        setSelectedFile(null);
        setTitle("");
        setClassTarget("");
        setShowQuickUpload(false);
        setIsUploading(false);
        setUploadProgress(0);
        alert("File uploaded successfully.");
      }, 500);
      
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      alert(error.message || "An error occurred saving upload details.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const renderUploadForm = (formTitle: string, targetCollection: string) => (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-medium text-white">Upload {formTitle}</h2>
      </div>
      <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
        <form className="space-y-4" onSubmit={(e) => handleUploadSubmit(e, targetCollection)}>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">Title / Topic / Name</label>
            <input 
              type="text" 
              required 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30" 
              placeholder="e.g. Maths Chapter 1 PDF" 
            />
          </div>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">Target Class (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Class 10 A"
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
                {selectedFile ? selectedFile.name : "Click or drag file to upload"}
              </p>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileChange} 
                disabled={isUploading}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors mt-6 flex items-center justify-center disabled:opacity-70"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Upload to System"}
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
  );

  const renderList = (listTitle: string, dataList: any[]) => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-white">{listTitle}</h2>
        </div>
        {dataList.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
            No records found here yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataList.map(m => (
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
                   <button
                     onClick={() => handleDownloadFile(m.fileName, m.fileData)}
                     className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                   >
                    Download
                   </button>
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
        {submissionsList.length === 0 ? (
          <div className="text-center py-12 text-[#8E8E93] border border-white/5 rounded-2xl bg-[#1A1A1A]">
            No homework submissions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submissionsList.map((sub: any) => (
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
                  <button
                    onClick={() => handleDownloadFile(sub.fileName, sub.fileUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    Download
                  </button>
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
      case "attendance":
        return <TeacherAttendanceControl />;
      case "study_materials":
        return (
          <div className="space-y-10">
            {renderUploadForm("Study Material", "study_materials")}
            <hr className="border-white/10" />
            {renderList("Shared Study Materials", studyMaterialsList)}
          </div>
        );
      case "homework":
        return (
          <div className="space-y-10">
            {renderUploadForm("Homework Assignment", "homework")}
            <hr className="border-white/10" />
            {renderList("Assigned Homework", homeworkList)}
            <hr className="border-white/10" />
            {renderSubmissionsList()}
          </div>
        );
      case "timetable":
        return (
          <div className="space-y-10">
            {renderUploadForm("Exam Time Table", "timetable")}
            <hr className="border-white/10" />
            {renderList("Exam Time Tables", timetablesList)}
          </div>
        );
      case "notes":
        return (
          <div className="space-y-10">
            {renderUploadForm("Class Notes", "notes")}
            <hr className="border-white/10" />
            {renderList("Class Notes", notesList)}
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-xl font-medium text-white mb-6">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <FileText className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Total Homeworks</p>
                <p className="text-2xl font-semibold text-white">{homeworkList.length}</p>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <Calendar className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Uploaded Timetables</p>
                <p className="text-2xl font-semibold text-white">{timetablesList.length}</p>
              </div>
              <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5">
                <BookOpen className="w-8 h-8 text-[#8E8E93] mb-4" />
                <p className="text-sm text-[#8E8E93] mb-1">Study Materials</p>
                <p className="text-2xl font-semibold text-white">{studyMaterialsList.length}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <DashboardLayout title="Teacher Dashboard" tabs={TEACHER_TABS} activeTab={activeTab} onTabChange={handleTabChange}>
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
          <span className="font-semibold uppercase tracking-wider text-xs">Quick Homework Upload</span>
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
    </>
  );
}

