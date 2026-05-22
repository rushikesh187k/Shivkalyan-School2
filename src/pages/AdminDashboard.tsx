import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { ref, uploadBytesResumable, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { LogOut, Users, UserCheck, Calendar, UserPlus, BookOpen, FileText, Upload, Shield, X, Loader2, LayoutDashboard, MessageSquare, Eye } from "lucide-react";
import { collection, query, where, getCountFromServer, onSnapshot, orderBy, limit, doc, setDoc } from "firebase/firestore";
import { Notice, UserProfile, TeacherModel, Material } from "../types";
import toast from "react-hot-toast";
import { DashboardLayout, TabItem } from "../components/DashboardLayout";
import { StudentSearch } from "../components/StudentSearch";
import { motion } from "motion/react";

const ADMIN_TABS: TabItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "student_search", label: "Student Search", icon: Users },
  { id: "teachers", label: "Teachers", icon: BookOpen },
  { id: "notices", label: "Notices", icon: FileText },
  { id: "broadcast", label: "Broadcast", icon: MessageSquare },
  { id: "study_materials", label: "Study Materials", icon: BookOpen },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "timetable", label: "Exam Time Table", icon: Calendar },
  { id: "notes", label: "Notes", icon: Upload },
];

export function AdminDashboard() {
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [studentCount, setStudentCount] = useState<number>(0);
  const [teacherCount, setTeacherCount] = useState<number>(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);

  // Teachers State
  const [teachersList, setTeachersList] = useState<TeacherModel[]>([]);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherMobile, setTeacherMobile] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);

  // Modal State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("Daily Notice");
  const [noticeContent, setNoticeContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (activeTab !== "users") return;
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
      setUsersList(fetched);
    });
    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "teachers") return;
    const teachersQuery = query(collection(db, "teachers"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(teachersQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherModel[];
      setTeachersList(fetched);
    });
    return () => unsubscribe();
  }, [activeTab]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const studentsQuery = query(collection(db, "users"), where("role", "==", "Student"));
        const studentsSnapshot = await getCountFromServer(studentsQuery);
        setStudentCount(studentsSnapshot.data().count);

        const teachersQuery = query(collection(db, "users"), where("role", "==", "Teacher"));
        const teachersSnapshot = await getCountFromServer(teachersQuery);
        setTeacherCount(teachersSnapshot.data().count);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    fetchStats();

    const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      const fetchedNotices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(fetchedNotices);
    }, (error) => {
      console.error("Error fetching notices:", error);
    });

    return () => {
      unsubscribeNotices();
    };
  }, []);

  const handleQuickAction = (action: string) => {
    if (action === "Post Notice") {
      setShowNoticeModal(true);
    } else {
      toast(`Navigate to: ${action}`, { icon: "🚧" });
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim() || !profile) return;
    
    setIsPosting(true);
    try {
      const newNoticeRef = doc(collection(db, "notices"));
      await setDoc(newNoticeRef, {
        title: noticeTitle.trim(),
        category: noticeCategory,
        content: noticeContent.trim(),
        authorName: profile.fullName,
        createdAt: new Date().toISOString()
      });
      toast.success("Notice posted successfully!");
      setShowNoticeModal(false);
      setNoticeTitle("");
      setNoticeCategory("Daily Notice");
      setNoticeContent("");
    } catch (error: any) {
      console.error("Failed to post notice:", error);
      toast.error(error.message || "Failed to post notice");
    } finally {
      setIsPosting(false);
    }
  };

  const renderDashboardContent = () => {
    return (
      <div className="space-y-8">
        {/* Top Section: Statistics */}
        <section>
          <h2 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white"><Users className="h-5 w-5" /></span>
                </div>
                <h3 className="text-[#8E8E93] font-medium text-sm">Total Students</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">
                  {loadingStats ? "..." : studentCount}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white"><UserCheck className="h-5 w-5" /></span>
                </div>
                <h3 className="text-[#8E8E93] font-medium text-sm">Total Teachers</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">
                  {loadingStats ? "..." : teacherCount}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] p-6 flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <span className="text-white"><Calendar className="h-5 w-5" /></span>
                </div>
                <h3 className="text-[#8E8E93] font-medium text-sm">Overall Attendance</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-white">
                  94.2%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Middle Section: Quick Actions */}
        <section>
          <h2 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction("Add Student")}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] hover:bg-[#222222] transition-colors gap-3"
            >
              <UserPlus className="h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white">Add Student</span>
            </button>
            <button 
              onClick={() => handleQuickAction("Add Teacher")}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] hover:bg-[#222222] transition-colors gap-3"
            >
              <BookOpen className="h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white">Add Teacher</span>
            </button>
            <button 
              onClick={() => handleQuickAction("Post Notice")}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] hover:bg-[#222222] transition-colors gap-3"
            >
              <FileText className="h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white">Post Notice</span>
            </button>
            <button 
              onClick={() => handleQuickAction("Upload Timetable")}
              className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] hover:bg-[#222222] transition-colors gap-3"
            >
              <Upload className="h-6 w-6 text-white" />
              <span className="text-xs font-medium text-white">Upload Timetable</span>
            </button>
          </div>
        </section>

        {/* Bottom Section: Recent Notices */}
        <section>
          <h2 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-4">Recent Notices</h2>
          <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] overflow-hidden">
            {notices.length === 0 ? (
              <div className="p-8 text-center text-[#8E8E93] text-sm">
                No recent notices found.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-5 hover:bg-white/5 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <h3 className="text-white font-medium">{notice.title}</h3>
                      <span className="text-xs text-[#8E8E93] whitespace-nowrap bg-[#000000] px-2 py-1 rounded">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#8E8E93] mb-3 line-clamp-2">{notice.content}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center">
                        <UserCheck className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs text-[#8E8E93]">Posted by {notice.authorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderUsersContent = () => {
    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
      <div className="space-y-6">
        <h2 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider mb-4">Directory</h2>
        {usersList.length === 0 ? (
          <div className="text-sm text-[#8E8E93]">Loading users...</div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {usersList.map(user => (
              <motion.div 
                key={user.id}
                variants={itemVariants}
                className="p-5 rounded-2xl border border-white/5 bg-[#1A1A1A] flex items-center justify-between hover:bg-[#222222] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{user.fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{user.fullName}</h3>
                    <p className="text-xs text-[#8E8E93] mt-0.5">{user.mobileNumber || "N/A"}</p>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#8E8E93] font-medium">
                  {user.role}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadState, setUploadState] = useState<'IDLE' | 'UPLOADING' | 'ERROR'>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialTitle, setMaterialTitle] = useState("");
  const [classTarget, setClassTarget] = useState("");
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

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

  const handleUpload = async (e: React.FormEvent, type: string) => {
    e.preventDefault();
    if (!selectedFile || !materialTitle) {
      toast.error("Please provide a title and select a file.");
      return;
    }
    
    try {
      setUploadState('UPLOADING');
      const fileRef = ref(storage, `admin_uploads/${Date.now()}_${selectedFile.name}`);
      const snapshot = await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const collectionName = type === "homework" ? "homework" : (type === "study_material" ? "study_materials" : "materials");
      const materialRef = doc(collection(db, collectionName));
      const newMaterial: any = {
        title: materialTitle,
        type,
        fileData: downloadURL,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        uploadedBy: profile?.fullName || "Admin",
        createdAt: new Date().toISOString()
      };
      
      if (classTarget) {
        newMaterial.classTarget = classTarget;
      }
      
      await setDoc(materialRef, newMaterial);
      
      toast.success("File uploaded successfully");
      setSelectedFile(null);
      setMaterialTitle("");
      setClassTarget("");
    } catch (error: any) {
      setUploadState('ERROR');
      console.error(error);
      alert(error.message || "Unknown error");
    } finally {
      setUploadState('IDLE');
    }
  };

  const renderUploadForm = (title: string, type: string) => (
    <div className="max-w-2xl">
      <h2 className="text-xl font-medium text-white mb-6">Upload {title}</h2>
      <div className="bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
        <form className="space-y-4" onSubmit={(e) => handleUpload(e, type)}>
          <div>
            <label className="block text-sm text-[#8E8E93] mb-2">File Title / Topic</label>
            <input 
              type="text" 
              required 
              value={materialTitle}
              onChange={e => setMaterialTitle(e.target.value)}
              className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30" 
              placeholder={`Enter ${title.toLowerCase()} title`} 
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

  const renderMaterialsList = (listTitle: string, type: string) => {
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


  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherMobile.trim() || !teacherSubject.trim()) {
      return toast.error("Please fill in all fields.");
    }
    setIsAddingTeacher(true);
    try {
      // Auto generate ID for the teacher collection
      const newTeacherRef = doc(collection(db, "teachers"));
      await setDoc(newTeacherRef, {
        fullName: teacherName,
        mobileNumber: teacherMobile,
        subjectSpecialty: teacherSubject,
        createdAt: new Date().toISOString()
      });
      toast.success("Teacher added successfully");
      setShowAddTeacher(false);
      setTeacherName("");
      setTeacherMobile("");
      setTeacherSubject("");
    } catch (error: any) {
      console.error(error);
      handleFirestoreError(error, OperationType.WRITE, "Teacher");
    } finally {
      setIsAddingTeacher(false);
    }
  };

  const renderTeachersContent = () => {
    if (showAddTeacher) {
      return (
        <div className="max-w-xl">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setShowAddTeacher(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-xl font-medium text-white">Add New Teacher</h2>
          </div>
          <form onSubmit={handleAddTeacher} className="space-y-4 bg-[#1A1A1A] border border-white/5 p-6 rounded-2xl">
            <div>
              <label className="block text-sm text-[#8E8E93] mb-2">Full Name</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30"
                placeholder="Teacher Name"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8E8E93] mb-2">Mobile Number</label>
              <input
                type="text"
                required
                value={teacherMobile}
                onChange={(e) => setTeacherMobile(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30"
                placeholder="e.g. +91 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm text-[#8E8E93] mb-2">Subject Specialty</label>
              <input
                type="text"
                required
                value={teacherSubject}
                onChange={(e) => setTeacherSubject(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/30"
                placeholder="e.g. Mathematics"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingTeacher}
              className="w-full bg-white text-black font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors mt-6 flex items-center justify-center disabled:opacity-70"
            >
              {isAddingTeacher ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Teacher"}
            </button>
          </form>
        </div>
      );
    }

    const containerVariants = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-medium text-[#8E8E93] uppercase tracking-wider">Teacher Directory</h2>
          <button
            onClick={() => setShowAddTeacher(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Teacher
          </button>
        </div>
        {teachersList.length === 0 ? (
          <div className="text-sm text-[#8E8E93]">No teachers registered yet.</div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {teachersList.map(teacher => (
              <motion.div 
                key={teacher.id}
                variants={itemVariants}
                className="p-5 rounded-2xl border border-white/5 bg-[#1A1A1A] flex flex-col gap-3 hover:bg-[#222222] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">{teacher.fullName.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">{teacher.fullName}</h3>
                    <p className="text-xs text-[#8E8E93] mt-0.5">{teacher.mobileNumber}</p>
                  </div>
                </div>
                <div className="mt-2 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-[#8E8E93]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{teacher.subjectSpecialty}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboardContent();
      case "users":
        return renderUsersContent();
      case "student_search":
        return <StudentSearch />;
      case "teachers":
        return renderTeachersContent();
      case "study_materials":
        return (
          <div className="space-y-10">
            {renderUploadForm("Study Material", "study_material")}
            <hr className="border-white/10" />
            {renderMaterialsList("Shared Study Materials", "study_material")}
          </div>
        );
      case "homework":
        return (
          <div className="space-y-10">
            {renderUploadForm("Homework Topic", "homework")}
            <hr className="border-white/10" />
            {renderMaterialsList("Assigned Homework", "homework")}
          </div>
        );
      case "timetable":
        return (
          <div className="space-y-10">
            {renderUploadForm("Exam Time Table", "timetable")}
            <hr className="border-white/10" />
            {renderMaterialsList("Exam Time Table", "timetable")}
          </div>
        )
      case "notes":
        return (
          <div className="space-y-10">
            {renderUploadForm("Class Notes", "notes")}
            <hr className="border-white/10" />
            {renderMaterialsList("Class Notes", "notes")}
          </div>
        )
      case "notices":
        return (
          <div className="space-y-6">
            <div className="flex justify-between flex-wrap gap-4 items-center">
              <h2 className="text-xl text-white font-medium">All Notices</h2>
              <button
                onClick={() => setShowNoticeModal(true)}
                className="bg-white text-black px-4 py-2 font-medium rounded-xl hover:bg-gray-200 transition-colors"
               >
                 Post Notice
               </button>
            </div>
            {notices.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-10 border border-white/10 rounded-2xl bg-[#1A1A1A]">
                   <p className="text-[#8E8E93]">No notices available.</p>
               </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notices.map((notice) => (
                    <div key={notice.id} className="p-6 rounded-2xl border border-white/5 bg-[#1A1A1A] hover:border-white/20 transition-colors">
                      <div className="flex flex-col gap-2 mb-4">
                         <div className="flex justify-between items-start">
                           <h3 className="text-lg text-white font-medium">{notice.title}</h3>
                           {notice.category && (
                             <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                               {notice.category}
                             </span>
                           )}
                         </div>
                         <p className="text-xs text-[#8E8E93]">
                             {new Date(notice.createdAt).toLocaleString()} • by {notice.authorName}
                         </p>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                    </div>
                  ))}
               </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-[#8E8E93]">
            <p>This module is under construction.</p>
          </div>
        );
    }
  };

  return (
    <>
      <DashboardLayout
        title="Admin Control Panel"
        tabs={ADMIN_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderContent()}
      </DashboardLayout>

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

      {/* Post Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-medium text-white">Post New Notice</h2>
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="p-2 -mr-2 text-[#8E8E93] hover:text-white hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handlePostNotice} className="p-6 space-y-5">
              <div>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Notice Title"
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-[#8E8E93] focus:border-white/30 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-white/30 focus:outline-none transition-colors appearance-none"
                  required
                >
                  <option value="Daily Notice">Daily Notice</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <textarea
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Body Content..."
                  rows={4}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder-[#8E8E93] focus:border-white/30 focus:outline-none transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isPosting}
                className="w-full flex items-center justify-center bg-white text-black font-medium text-sm rounded-2xl px-5 py-4 hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPosting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Post Notice"}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Floating Action Button for Upload Homework */}
      {activeTab !== "homework" && activeTab !== "study_materials" && (
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
