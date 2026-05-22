/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { useAuthStore } from "./store/useAuthStore";
import { UserProfile } from "./types";

import { Login } from "./pages/Login";
import { AdminDashboard } from "./pages/AdminDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

function GenericDashboard({ title }: { title: string }) {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <nav className="border-b border-white/10 bg-[#1A1A1A]/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-lg font-medium text-white">{title}</h1>
            <button
              onClick={() => { auth.signOut(); navigate('/login'); }}
              className="text-gray-400 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#1A1A1A]/30 p-8 text-center sm:min-h-[600px] backdrop-blur-sm">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-md text-sm text-gray-400">
            Welcome, {profile?.fullName}. This module is under construction.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    // Temporary disabled auto device recognize
    signOut(auth);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#1A1A1A',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
        }
      }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/student" 
          element={
            <ProtectedRoute allowedRoles={["Student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/teacher" 
          element={
            <ProtectedRoute allowedRoles={["Teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/parent" 
          element={
            <ProtectedRoute allowedRoles={["Parent"]}>
              <GenericDashboard title="Parent Dashboard" />
            </ProtectedRoute>
          } 
        />
        
        {/* Basic catch-all to redirect based on auth */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

