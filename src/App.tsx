import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  LogIn, 
  BookOpen, 
  Film, 
  Tv, 
  History, 
  AlertCircle, 
  FileText,
  UserCheck
} from "lucide-react";
import { VibeUser, RecommendationBatch } from "./types";
import { authenticateWithGoogle, terminateUserSession, isFirebaseMock } from "./firebase";
import VibeHeader from "./components/VibeHeader";
import Wizard from "./components/Wizard";
import HistoryArchive from "./components/HistoryArchive";

export default function App() {
  const [currentUser, setCurrentUser] = useState<VibeUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  
  // App views
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<RecommendationBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<RecommendationBatch | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  
  // Message reporting
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-load session from local store if in simulated mockup mode on boot
  useEffect(() => {
    const saved = localStorage.getItem("nextpick_mock_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (_) {}
    }
    setIsAuthChecking(false);
  }, []);

  // Fetch history list when user changes
  useEffect(() => {
    if (currentUser) {
      fetchUserHistory();
    } else {
      setHistoryList([]);
      setSelectedBatch(null);
    }
  }, [currentUser]);

  const fetchUserHistory = async () => {
    try {
      const headers: any = {};
      // Inject user ID header for sandbox retrieval fallback
      headers["x-user-id"] = currentUser?.uid || "anonymous_user";

      // Include ID token token in authorization header if user is not mock
      if (currentUser && !currentUser.isMock) {
        // Standard Firebase implementation gets token via: getIDToken()
        // Here we pass standard mock or actual UUID
        headers["Authorization"] = `Bearer ${currentUser.uid}`;
      }

      const res = await fetch("/api/recommendations/history", { headers });
      if (res.ok) {
        const data = await res.json();
        const list = data.history || [];
        setHistoryList(list);
        if (list.length > 0 && !selectedBatch) {
          setSelectedBatch(list[0]); // Default select latest build
        }
      }
    } catch (err) {
      console.error("Failed to load past recommendation history.", err);
    }
  };

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const user = await authenticateWithGoogle();
      setCurrentUser(user);
      setSuccessMessage(`Logged in successfully${user.isMock ? " (Simulated Sandbox)" : ""} as ${user.displayName || "Explorer"}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to authenticate Google user context.");
    }
  };

  const handleLogout = async () => {
    try {
      await terminateUserSession();
      setCurrentUser(null);
      setSuccessMessage("Logged out successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to sign out of current session.");
    }
  };

  const handleCreateRecommendationBatch = async (inputs: any) => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const headers: any = { "Content-Type": "application/json" };
      const userId = currentUser?.uid || "anonymous_user";
      headers["x-user-id"] = userId;
      
      if (currentUser && !currentUser.isMock) {
        headers["Authorization"] = `Bearer ${currentUser.uid}`;
      }

      const response = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(inputs)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI recommendations from backend.");
      }

      // Add generated batch to history and select it
      const newBatch: RecommendationBatch = data;
      setHistoryList(prev => [newBatch, ...prev]);
      setSelectedBatch(newBatch);
      setShowWizard(false);
      setSuccessMessage("Besboke recommendation batch curated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e: any) {
      setErrorMessage(e.message || "curation failed standard checks.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="font-mono text-[9px] text-purple-400 uppercase tracking-widest leading-none">Starting Framework...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] font-sans antialiased selection:bg-purple-600 selection:text-white pb-16 vibe-gradient" id="app-root">
      {/* Editorial Header */}
      <VibeHeader 
        user={currentUser} 
        onLogout={handleLogout} 
        isFirebaseMock={isFirebaseMock} 
      />

      {/* Global Message Banners */}
      <div className="max-w-6xl mx-auto px-4 mt-4">
        {errorMessage && (
          <div className="p-4 bg-red-950/40 border border-red-900/30 text-red-200 rounded-2xl flex items-start gap-3 shadow-lg animate-fade-in" id="error-banner">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">System Status Alert</p>
              <p className="text-xs text-red-300/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}
        {successMessage && (
          <div className="p-4 bg-purple-950/40 border border-purple-900/30 text-purple-200 rounded-2xl flex items-start gap-3 shadow-lg animate-fade-in" id="success-banner">
            <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {!currentUser ? (
          /* LANDING STATE (Elegant, clean, bold display typographic masterpiece) */
          <div className="py-12 md:py-24 text-center max-w-2xl mx-auto space-y-8 animate-fadeIn" id="landing-screen">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/30 text-purple-300 font-mono text-[9px] uppercase tracking-wider border border-purple-900/30 font-bold">
                <Sparkles className="h-3 w-3 text-purple-400" />
                Powered by Gemini Live API Catalog
              </div>
              
              <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white leading-tight">
                Bespoke books, <br />
                shows, and scripts. <br />
                Matched to <span className="italic text-purple-400 font-normal">your vibe</span>.
              </h2>
              
              <p className="text-sm text-white/50 max-w-md mx-auto leading-relaxed">
                Connect your account to curate exactly 5 Books, 2 TV Series, and 1 Movie masterpiece tailored to your genre mood, favorite sub-tropes, and custom aesthetic goals.
              </p>
            </div>

            {/* Simulated login capabilities / google sso trigger button */}
            <div className="space-y-3 max-w-sm mx-auto pt-4">
              <button
                onClick={handleLogin}
                className="w-full py-4.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-2xl font-bold text-sm tracking-tight shadow-2xl hover:shadow-purple-900/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 border border-purple-500/20"
                id="login-trigger-btn"
              >
                <LogIn className="h-4 w-4" />
                Get Started with Google Auth
              </button>
              
              {isFirebaseMock && (
                <p className="text-[9px] font-mono text-white/40 leading-relaxed text-center">
                  Notice: Sandbox is running a mock environment. Logging in will launch an immediate virtual user credentials token automatically!
                </p>
              )}
            </div>

            {/* Value pillars of the application (Literal with elegant minimalist icons) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left border-t border-white/5">
              <div className="space-y-1.5 bg-white/2 p-4 rounded-xl border border-white/5">
                <BookOpen className="h-5 w-5 text-purple-400" />
                <h5 className="text-xs font-serif font-bold text-white tracking-tight uppercase">5 Custom Books</h5>
                <p className="text-[11px] text-white/50 leading-normal">Deep editorial lookups including Kindle or paperback buying platform details.</p>
              </div>
              <div className="space-y-1.5 bg-white/2 p-4 rounded-xl border border-white/5">
                <Tv className="h-5 w-5 text-purple-400" />
                <h5 className="text-xs font-serif font-bold text-white tracking-tight uppercase">2 TV Series</h5>
                <p className="text-[11px] text-white/50 leading-normal">Engaging episodes available across streaming outlets like Netflix &amp; Prime.</p>
              </div>
              <div className="space-y-1.5 bg-white/2 p-4 rounded-xl border border-white/5">
                <Film className="h-5 w-5 text-purple-400" />
                <h5 className="text-xs font-serif font-bold text-white tracking-tight uppercase">1 Masterpiece Film</h5>
                <p className="text-[11px] text-white/50 leading-normal">A select cinematic production that matches your current detailed vision.</p>
              </div>
            </div>
          </div>
        ) : (
          /* ACCESSIBLE DASHBOARD STATE */
          <div className="space-y-8" id="dashboard-screen">
            {/* Find recommendation hero bar */}
            {!showWizard && (
              <div className="bg-[#0c0c0c]/85 border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6" id="dashboard-hero">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-transparent to-pink-950/15 pointer-events-none" />
                <div className="relative z-10 text-center md:text-left space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400 font-extrabold block">Personal Curator</span>
                  <h3 className="text-xl md:text-2xl font-serif font-black text-white italic tracking-tight">Need a fresh intellectual escape?</h3>
                  <p className="text-xs text-white/50">
                    Boot our 5-step custom design wizard to assemble your next book, show, and cinematic masterpiece list.
                  </p>
                </div>
                
                <button
                  onClick={() => setShowWizard(true)}
                  className="relative z-10 shrink-0 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-sm hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-xl shadow-purple-950/20 border border-purple-500/20"
                  id="dashboard-open-wizard-btn"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Find Your Next Recommendation
                </button>
              </div>
            )}

            {/* Dynamic rendering center: Show custom Wizard block OR Archive table selection block */}
            {showWizard ? (
              <div className="py-4">
                <Wizard 
                  onComplete={handleCreateRecommendationBatch} 
                  isGenerating={isGenerating} 
                  onCancel={() => setShowWizard(false)}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <HistoryArchive 
                  historyList={historyList}
                  onSelectBatch={setSelectedBatch}
                  selectedBatch={selectedBatch}
                  onRefreshHistory={fetchUserHistory}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
