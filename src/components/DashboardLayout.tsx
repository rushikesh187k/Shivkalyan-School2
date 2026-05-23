import React from "react";
import { LogOut } from "lucide-react";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { useSchoolLogo } from "../hooks/useSchoolLogo";
import { motion } from "motion/react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  title: string;
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
}

export function DashboardLayout({ title, tabs, activeTab, onTabChange, children }: DashboardLayoutProps) {
  const { profile } = useAuthStore();
  const logoUrl = useSchoolLogo();

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-white/5 z-50">
        <div className="h-24 flex items-center gap-3 px-6 border-b border-white/5">
          <div className="flex-shrink-0 w-10 h-10 bg-[#1A1A1A] rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
            {logoUrl ? (
               <img src={logoUrl} alt="School Logo" className="w-full h-full object-cover" />
            ) : (
               <span className="text-white font-bold text-sm tracking-widest">SK</span>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-white font-medium text-sm leading-tight">शिवकल्याण शिक्षण संस्था</h1>
            <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5">घणसोली, नवी मुंबई</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium relative group",
                  isActive ? "text-white bg-white/10" : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-white/5">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{profile?.fullName}</span>
              <span className="text-xs text-[#8E8E93] truncate">{profile?.role}</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="p-2 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen relative pb-20 md:pb-0">
        
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 sticky top-0 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5 z-40">
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-white hidden md:block">{title}</h2>
          
          {/* Main Global Search Bar */}
          <div className="flex-1 max-w-2xl mx-auto md:mx-8">
            <div 
              onClick={() => {
                if (profile?.role !== "Student") {
                  onTabChange(profile?.role === "Admin" ? "student_search" : "students")
                }
              }} 
              className="relative group cursor-pointer w-full"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#8E8E93] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                readOnly={profile?.role !== "Student"}
                placeholder="Search students or notes..."
                className="block w-full pl-12 pr-4 py-3 border border-white/10 rounded-full leading-5 bg-[#121212] flex-1 text-sm text-white placeholder-[#8E8E93] focus:outline-none focus:bg-[#1A1A1A] focus:ring-1 focus:ring-white/30 transition-all cursor-pointer hover:bg-[#1A1A1A]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Only Sign Out */}
            <button 
              onClick={handleSignOut}
              className="md:hidden p-2 text-[#8E8E93] hover:text-white bg-white/5 rounded-full transition-colors border border-white/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="flex h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#1A1A1A] border border-white/10 items-center justify-center overflow-hidden shrink-0">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-white">{profile?.fullName.charAt(0)}</span>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="flex items-center justify-around px-2 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 transition-colors",
                  isActive ? "text-white" : "text-[#8E8E93]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-white/10" : "bg-transparent"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
