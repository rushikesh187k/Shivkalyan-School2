import React, { useState } from "react";
import { doc, setDoc, getDocs, collection, writeBatch, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Upload, Loader2, Image as ImageIcon, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useSchoolLogo } from "../hooks/useSchoolLogo";

export function AdminSettings() {
  const [isUploading, setIsUploading] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const logoUrl = useSchoolLogo();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast.error("File is too large. Limit is 800KB.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        await setDoc(doc(db, "system_settings", "branding"), {
          logoUrl: base64Data
        }, { merge: true });
        
        toast.success("School logo updated successfully!");
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload.");
      setIsUploading(false);
    }
  };

  const handlePurgeData = async () => {
    if (window.confirm("Are you absolutely sure you want to delete all test data? This cannot be undone.")) {
      setIsPurging(true);
      try {
        const collectionsToPurge = ["homework", "daily_attendance", "syllabus_progress", "exam_timetables"];
        
        let batch = writeBatch(db);
        let opCount = 0;

        const commitBatchIfNeeded = async () => {
          if (opCount >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        };

        for (const coll of collectionsToPurge) {
          const snap = await getDocs(collection(db, coll));
          for (const d of snap.docs) {
            batch.delete(d.ref);
            opCount++;
            await commitBatchIfNeeded();
          }
        }

        const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "Student")));
        for (const d of usersSnap.docs) {
          batch.delete(d.ref);
          opCount++;
          await commitBatchIfNeeded();
        }

        if (opCount > 0) {
          await batch.commit();
        }

        toast.success("All test data has been successfully purged!");
      } catch (error) {
        console.error("Purge error:", error);
        toast.error("Failed to purge data. See console for details.");
      } finally {
        setIsPurging(false);
      }
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-medium text-white mb-6">System Settings</h2>
        
        <div className="bg-[#121212] p-6 rounded-3xl border border-white/10 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">School Branding</h3>
            <p className="text-sm text-[#8E8E93] mb-6">Upload an image to replace the default school logo across the application login and dashboards.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/10 pb-8">
            <div className="w-24 h-24 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
              {logoUrl ? (
                 <img src={logoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                 <ImageIcon className="w-8 h-8 text-[#8E8E93]" />
              )}
            </div>
            
            <div className="flex-1 w-full">
              <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-[#1A1A1A] hover:bg-white/5 transition-colors px-6 py-6 w-full text-center">
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handleLogoUpload}
                   disabled={isUploading}
                 />
                 {isUploading ? (
                   <div className="flex items-center gap-2 text-white">
                     <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2">
                     <Upload className="w-6 h-6 text-[#8E8E93]" />
                     <span className="text-sm font-medium text-white">Upload School Logo</span>
                     <span className="text-xs text-[#8E8E93]">Optimized for square (1:1) aspect ratio, max 800KB</span>
                   </div>
                 )}
              </label>
            </div>
          </div>

          <div className="pt-2">
            <h3 className="text-lg font-medium text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h3>
            <p className="text-sm text-[#8E8E93] mb-4">
              Permanently delete all test records from the database. This action removes all homework, daily attendance, syllabus progress, exam timetables, and student user accounts. Your primary Admin account will remain safe.
            </p>
            <button 
              onClick={handlePurgeData}
              disabled={isPurging}
              className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isPurging ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Purging Data...</>
              ) : (
                <><AlertTriangle className="w-5 h-5" /> Purge All Test Data</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
