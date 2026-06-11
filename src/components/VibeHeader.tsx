import React from "react";
import { BookOpen, LogOut, Film, Sparkles, Database } from "lucide-react";
import { VibeUser } from "../types";

interface VibeHeaderProps {
  user: VibeUser | null;
  onLogout: () => void;
  isFirebaseMock: boolean;
}

export default function VibeHeader({ user, onLogout, isFirebaseMock }: VibeHeaderProps) {
  return (
    <header className="border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 transition-all">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Humble and Literal Branding */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-sm animate-pulse">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif font-black tracking-tight text-white text-xl flex items-center gap-1.5">
              Next<span className="text-purple-400 font-normal">Pick</span>
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] font-mono text-purple-300/60">
              Curation Engine v2.0
            </p>
          </div>
        </div>

        {/* User Info / Controls */}
        <div className="flex items-center space-x-4">
          {/* Mock Status (Informational only, clean design styling) */}
          {isFirebaseMock && (
            <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-950/30 text-purple-300 font-mono text-[10px] border border-purple-900/30">
              <Database className="h-3 w-3 text-purple-400" />
              <span>Simulated Sandbox Mode</span>
            </div>
          )}

          {user && (
            <div className="flex items-center space-x-3 bg-white/5 p-1.5 pr-3 rounded-full border border-white/10 shadow-sm">
              <img
                src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"}
                alt={user.displayName || "User Avatar"}
                className="h-8 w-8 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-white leading-none">
                  {user.displayName || "Guest Explorer"}
                </p>
                <p className="text-[9px] font-mono text-white/40">
                  {user.email || "vibe@explorer.email"}
                </p>
              </div>
              <button
                onClick={onLogout}
                className="p-1 text-white/60 hover:text-purple-400 transition-colors"
                title="Log out"
                id="header-logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
