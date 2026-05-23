import React, { useState, useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { useSchoolLogo } from "../hooks/useSchoolLogo";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Login() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const logoUrl = useSchoolLogo();
  
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  // Registration form state
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [caste, setCaste] = useState("");
  const [studentClass, setStudentClass] = useState("9th Standard");
  const [studentMedium, setStudentMedium] = useState("Medium 1");
  const [securityCode, setSecurityCode] = useState("");

  useEffect(() => {
    if (user && profile && !isNewUser) {
      if (profile.role === "Admin") navigate("/admin");
      else if (profile.role === "Student") navigate("/student");
      else navigate(`/${profile.role.toLowerCase()}`);
    }
  }, [user, profile, navigate, isNewUser]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      if (!email) {
        throw new Error("No verified email received from Google.");
      }

      setVerifiedEmail(email);

      // Check existence
      const docRef = doc(db, "users", email);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        toast.success("Successfully logged in!");
        // Navigation is handled by the useEffect above
      } else {
        setIsNewUser(true);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        toast.error(`Domain unauthorized. Please add '${domain}' to Firebase Console > Authentication > Settings > Authorized domains.`, { duration: 10000 });
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("Google Sign-In is not enabled. Please enable it in the Firebase Console > Authentication > Sign-in method.", { duration: 10000 });
      } else {
        toast.error(error.message || "Failed to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (securityCode !== "SHIVKALYAN2026") {
      toast.error("Invalid School Admission Code. Please check with your class teacher.");
      return;
    }

    if (!fullName || !dob || !address || !caste || !studentClass || !studentMedium) {
      toast.error("Please fill all the details.");
      return;
    }

    setLoading(true);
    try {
      const newUserProfile = {
        id: verifiedEmail,
        fullName,
        dob,
        address,
        caste,
        studentClass,
        studentMedium,
        role: "Student",
        email: verifiedEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = doc(db, "users", verifiedEmail);
      await setDoc(docRef, newUserProfile);
      
      toast.success("Registration successful!");
      setIsNewUser(false); // Triggers routing to dashboard since user profile updates in App.tsx
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] font-sans selection:bg-white/30 selection:text-white">
      <div className="flex-1 flex flex-col justify-center px-8 w-full max-w-md mx-auto relative z-10">
        <div className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="School Crest" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold tracking-widest">SK</span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <p className="text-[#E0E0E0] text-sm md:text-base font-semibold leading-tight">शिवकल्याण शिक्षण संस्था</p>
              <p className="text-[#8E8E93] text-[11px] font-medium mt-0.5">घणसोली, नवी मुंबई</p>
            </div>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#FFFFFF] mt-6">
             {isNewUser ? "Student Registration" : "Login"}
          </h1>
        </div>

        <AnimatePresence mode="wait">
          {!isNewUser ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1A1A1A] border border-white/5 px-5 py-4 text-sm font-medium text-white transition-all hover:bg-[#222222] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-black/50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="registration"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
              onSubmit={handleRegistrationSubmit}
            >
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
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                  placeholder="Address"
                />
              </div>

              <div>
                <input
                  type="text"
                  required
                  value={caste}
                  onChange={(e) => setCaste(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                  placeholder="Caste"
                />
              </div>

              <div className="flex gap-4">
                <select
                  required
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white focus:border-white/30 focus:bg-[#1A1A1A] placeholder-[#8E8E93] appearance-none"
                >
                  <option value="9th Standard">9th Standard</option>
                  <option value="10th Standard">10th Standard</option>
                </select>

                <select
                  required
                  value={studentMedium}
                  onChange={(e) => setStudentMedium(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white focus:border-white/30 focus:bg-[#1A1A1A] placeholder-[#8E8E93] appearance-none"
                >
                  <option value="Medium 1">Medium 1</option>
                  <option value="Medium 2">Medium 2</option>
                </select>
              </div>

              <div>
                <input
                  type="password"
                  required
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value)}
                  className="block w-full rounded-2xl border border-white/10 bg-[#121212] px-5 py-4 text-sm text-white placeholder-[#8E8E93] outline-none transition-colors focus:border-white/30 focus:bg-[#1A1A1A]"
                  placeholder="School Security Code"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-medium text-black transition-all hover:bg-gray-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit Registration"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
