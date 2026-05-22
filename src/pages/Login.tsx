import React, { useState, useEffect } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserRole } from "../types";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const ROLES: UserRole[] = ["Student", "Teacher", "Admin", "Parent"];

export function Login() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  
  const [role, setRole] = useState<UserRole>("Student");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [assignedClass, setAssignedClass] = useState("");
  
  const [step, setStep] = useState<"details" | "otp">("details");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      if (profile.role === "Admin") navigate("/admin");
      else if (profile.role === "Student") navigate("/student");
      else navigate(`/${profile.role.toLowerCase()}`);
    }
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Please enter your full name.");
    if (!mobile.trim() || mobile.length !== 10 || !/^\d+$/.test(mobile)) return toast.error("Please enter a valid 10-digit mobile number.");
    
    if (role === "Teacher") {
      if (!qualifications.trim()) return toast.error("Please enter your qualifications.");
      if (!assignedClass.trim()) return toast.error("Please enter your assigned class.");
    }
    
    if (role === "Student") {
      if (!assignedClass.trim()) return toast.error("Please select a standard/class.");
    }

    setLoading(true);
    try {
      // By-pass OTP for testing
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import("firebase/auth");
      
      const email = `test${mobile}@shivkalyan.edu`;
      const password = `pass${mobile}123!`;
      let currentUser;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        currentUser = userCredential.user;
      } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          currentUser = userCredential.user;
        } else {
          throw error;
        }
      }

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const now = new Date().toISOString();
        
        const profileData = {
          id: currentUser.uid,
          fullName,
          mobileNumber: mobile,
          role,
          ...(role === "Teacher" ? { qualifications, assignedClass } : {}),
          ...(role === "Student" ? { assignedClass } : {}),
          createdAt: now,
          updatedAt: now,
        };
        
        await setDoc(userDocRef, profileData, { merge: true });
        toast.success("Successfully logged in (OTP Bypassed)!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !confirmationResult) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const now = new Date().toISOString();
        const newProfile = {
          fullName,
          mobileNumber: user.phoneNumber || mobile,
          role,
          ...(role === "Teacher" ? { qualifications, assignedClass } : {}),
          createdAt: now,
          updatedAt: now,
        };
        
        try {
          await setDoc(userDocRef, newProfile);
        } catch (dbError) {
          handleFirestoreError(dbError, OperationType.CREATE, `users/${user.uid}`);
        }
      }

      toast.success("Successfully logged in!");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-verification-code') {
        toast.error("Invalid OTP code. Please try again.");
      } else {
        toast.error(error.message || "Invalid OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] font-sans selection:bg-white/30 selection:text-white">
      <div id="recaptcha-container" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-8 w-full max-w-md mx-auto relative z-10">
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-white">
                 <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                 <path d="M2 12h20" />
                 <path d="M12 2v20" />
                 <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              </svg>
            </div>
            <div className="flex flex-col text-left">
              <p className="text-[#E0E0E0] text-sm md:text-base font-semibold leading-tight">शिवकल्याण शिक्षण संस्था</p>
              <p className="text-[#8E8E93] text-[11px] font-medium mt-0.5">घणसोली, नवी मुंबई</p>
            </div>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#FFFFFF] mt-6">Login as {role}</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === "details" ? (
            <motion.form 
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
              onSubmit={handleSendOtp}
            >
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setMobile(val);
                    }}
                    className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                    placeholder="10-digit Mobile Number"
                  />
                </div>
                {role === "Teacher" && (
                  <>
                    <div>
                      <input
                        type="text"
                        required
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                        placeholder="Qualifications (e.g. M.Sc, B.Ed)"
                      />
                    </div>
                  </>
                )}
                
                {(role === "Teacher" || role === "Student") && (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Enter Class / Standard (e.g. Class 10 A, Batch 2)"
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value)}
                      className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white focus:border-white/30 focus:bg-[#1A1A1A] placeholder-[#8E8E93]"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#1A1A1A] border border-white/5 px-5 py-4 text-sm font-medium text-white transition-all hover:bg-[#222222] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-black/50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
              onSubmit={handleVerifyOtp}
            >
              <div className="mb-2">
                <p className="text-sm text-[#8E8E93]">
                  Enter the 6-digit code sent to <span className="text-white">{mobile}</span>
                </p>
                <button 
                  type="button" 
                  onClick={() => setStep("details")}
                  className="mt-2 text-xs font-medium text-[#8E8E93] hover:text-white transition-colors"
                >
                  Change Number
                </button>
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-center text-2xl tracking-[0.75em] text-white placeholder-[#333333] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                  placeholder="------"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-medium text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Login"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Role Navigation */}
      <div className="pb-10 pt-4 px-8 w-full max-w-md mx-auto relative z-10">
        <div className="flex items-center justify-between">
          {ROLES.map((r) => {
            const isActive = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => {
                  if (step === "details") setRole(r);
                }}
                disabled={step === "otp"} // Disable changing role when entering OTP
                className={`flex flex-col items-center gap-1.5 transition-all ${
                  isActive ? "text-white" : "text-[#8E8E93] hover:text-white/80"
                } ${step === "otp" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span className="text-xs font-medium tracking-wide">{r}</span>
                <div 
                  className={`h-1 w-1 rounded-full transition-all duration-300 ${
                    isActive ? "bg-white scale-100" : "bg-transparent scale-0"
                  }`} 
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
