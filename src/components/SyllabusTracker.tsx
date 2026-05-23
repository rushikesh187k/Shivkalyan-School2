import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { CheckCircle2, Circle } from "lucide-react";
import toast from "react-hot-toast";

const SYLLABUS_DATA = {
  "Science": ["Laws of Motion", "Work and Energy", "Current Electricity", "Measurement of Matter", "Acids, Bases and Salts"],
  "Maths": ["Sets", "Real Numbers", "Polynomials", "Ratio and Proportion", "Linear Equations"],
  "History": ["Sources of History", "India: Events after 1960", "India's Internal Challenges", "Economic Development"],
  "English": ["Life", "A Synopsis - The Swiss Family Robinson", "Have you ever seen...?", "The Fall of Troy"]
};

export function SyllabusTracker() {
  const { profile } = useAuthStore();
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.mobileNumber) return;

    // Use mobileNumber as document key
    const docRef = doc(db, "syllabus_progress", profile.mobileNumber);
    
    setLoading(true);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setProgress(docSnap.data().progress || {});
      } else {
        // Initialize if not exists
        setDoc(docRef, { progress: {} }).catch(console.error);
        setProgress({});
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching syllabus progress:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [profile?.mobileNumber]);

  const toggleChapter = async (subject: string, chapter: string) => {
    if (!profile?.mobileNumber) return;
    
    const key = `${subject}_${chapter}`;
    const newStatus = !progress[key];
    
    // Optimistic update
    setProgress(prev => ({ ...prev, [key]: newStatus }));
    
    try {
      const docRef = doc(db, "syllabus_progress", profile.mobileNumber);
      await updateDoc(docRef, {
        [`progress.${key}`]: newStatus
      });
    } catch (error) {
      console.error("Error updating syllabus progress", error);
      // Revert on failure
      setProgress(prev => ({ ...prev, [key]: !newStatus }));
      toast.error("Failed to update progress");
    }
  };

  const calculateProgress = () => {
    let total = 0;
    let completed = 0;
    
    Object.keys(SYLLABUS_DATA).forEach(subject => {
      SYLLABUS_DATA[subject as keyof typeof SYLLABUS_DATA].forEach(chapter => {
        total++;
        if (progress[`${subject}_${chapter}`]) completed++;
      });
    });

    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const overallProgress = calculateProgress();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/10 flex items-center justify-between">
        <div>
           <h2 className="text-xl font-medium text-white mb-1">My Syllabus Tracker</h2>
           <p className="text-sm text-[#8E8E93]">Track your academic progress across all subjects</p>
        </div>
        <div className="text-right">
           <div className="text-3xl font-semibold text-blue-400">{overallProgress}%</div>
           <p className="text-xs text-[#8E8E93] uppercase tracking-wider mt-1">Completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(SYLLABUS_DATA).map(([subject, chapters]) => {
          let subjectCompleted = 0;
          chapters.forEach(ch => {
            if (progress[`${subject}_${ch}`]) subjectCompleted++;
          });
          const subjectProgress = Math.round((subjectCompleted / chapters.length) * 100);

          return (
            <div key={subject} className="bg-[#121212] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
              <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="text-lg font-medium text-white">{subject}</h3>
                <span className="text-xs bg-white/10 text-white px-2 py-1 rounded-md">{subjectProgress}%</span>
              </div>
              
              <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 mb-6 relative z-10">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${subjectProgress}%` }}
                ></div>
              </div>

              <div className="space-y-3 relative z-10">
                {chapters.map(chapter => {
                  const key = `${subject}_${chapter}`;
                  const isDone = !!progress[key];
                  
                  return (
                    <button 
                      key={chapter} 
                      onClick={() => toggleChapter(subject, chapter)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${
                        isDone 
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-100 hover:bg-blue-500/20' 
                          : 'bg-[#1A1A1A] border-white/5 text-[#8E8E93] hover:bg-[#222222] hover:text-white'
                      }`}
                    >
                      <span className="text-sm font-medium pr-4">{chapter}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 opacity-40 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
