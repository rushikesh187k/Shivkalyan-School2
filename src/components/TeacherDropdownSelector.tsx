import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TeacherModel } from '../types';
import { ChevronDown } from 'lucide-react';

interface TeacherDropdownSelectorProps {
  onSelected: (teacherId: string, teacherName: string) => void;
  selectedId?: string;
  className?: string;
}

export function TeacherDropdownSelector({ onSelected, selectedId, className = "" }: TeacherDropdownSelectorProps) {
  const [teachers, setTeachers] = useState<TeacherModel[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'teachers'), orderBy('fullName', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherModel[];
      setTeachers(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const selectedTeacher = teachers.find(t => t.id === selectedId);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
      >
        <span className={selectedTeacher ? "text-white" : "text-[#8E8E93]"}>
          {loading ? "Loading..." : selectedTeacher ? selectedTeacher.fullName : "Select Teacher"}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#8E8E93] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {teachers.length === 0 ? (
              <div className="px-5 py-4 text-sm text-[#8E8E93]">No teachers available</div>
            ) : (
              teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  type="button"
                  className="w-full text-left px-5 py-3 text-sm text-white hover:bg-[#222222] transition-colors border-b border-white/5 last:border-0"
                  onClick={() => {
                    onSelected(teacher.id, teacher.fullName);
                    setIsOpen(false);
                  }}
                >
                  <div className="font-medium">{teacher.fullName}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">{teacher.subjectSpecialty} • {teacher.mobileNumber}</div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
