export type UserRole = "Student" | "Teacher" | "Admin" | "Parent";

export interface TeacherModel {
  id: string;
  fullName: string;
  mobileNumber: string;
  subjectSpecialty: string;
  createdAt: string;
}

export interface Material {
  id: string;
  title: string;
  type: "homework" | "timetable" | "notes" | "study_material";
  fileData: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  classTarget?: string;
  aiSummary?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string; // The Firestore document ID, which matches Firebase Auth UID
  fullName: string;
  mobileNumber: string;
  photoURL?: string;
  role: UserRole;
  qualifications?: string;
  assignedClass?: string;
  attendancePercentage?: number;
  overallGrade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notice {
  id: string;
  title: string;
  category?: string;
  content: string;
  authorName: string;
  createdAt: string;
}
