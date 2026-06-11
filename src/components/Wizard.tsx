import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Film, 
  Plus, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  MessageSquare,
  Bookmark,
  Shuffle
} from "lucide-react";
import { RecommendationBatch } from "../types";

interface WizardProps {
  onComplete: (inputs: WizardState) => Promise<void>;
  isGenerating: boolean;
  onCancel: () => void;
}

export interface WizardState {
  booksRead: string[];
  showsWatched: string[];
  genre: string;
  tropes: string[];
  specificDetails: string;
}

const GENRE_TROPE_MAP: Record<string, string[]> = {
  "Fantasy": ["High Fantasy", "World-building", "Grimdark", "Magical Academia", "Mythology / Folklore", "Portal Fantasy", "Fae Customs", "Hard Magic Systems"],
  "Sci-Fi": ["Cyberpunk", "Space Opera", "Time Travel", "Dystopian Revolt", "Synthetic Humans / AI", "Hard Sci-Fi", "Solarpunk", "Parallel Universes"],
  "Romance": ["Enemies to Lovers", "Rom-Com", "Fake Dating", "Friends to Lovers", "Grumpy & Sunshine", "Slow Burn", "Dark Romance", "Forced Proximity"],
  "Thriller & Mystery": ["Murder Mystery", "Psychological Thriller", "Dark Academia", "Cozy Mystery", "Police Procedural", "Supernatural Noir", "Conspiracy Theory"],
  "Horror": ["Supernatural Terror", "Gothic Dread", "Survival / Slasher", "Psychological Disturbance", "Haunted Locations", "Cosmic Horror", "Folk Horror"],
  "Historical Fiction": ["Ancient Civilizations", "Victorian Intrigue", "WWII Resistances", "Regency Romance", "Historical Mystery", "Biopic / Real Lives", "Time Slip"]
};

const SPECIFIC_SUGGESTIONS = [
  "A murder mystery where a teenager investigates instead of the police",
  "High stakes vampire/werewolf dynamics where characters feed on each other",
  "A cozy cottage core fantasy with cooking, baking, and a low stakes quest",
  "Mind-bending sci-fi where memory is a currency traded on the dark web",
  "An enemies-to-lovers story set in a competitive magical library"
];

export default function Wizard({ onComplete, isGenerating, onCancel }: WizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<WizardState>({
    booksRead: [],
    showsWatched: [],
    genre: "Fantasy",
    tropes: [],
    specificDetails: ""
  });

  // Local inputs
  const [bookInput, setBookInput] = useState("");
  const [showInput, setShowInput] = useState("");

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = bookInput.trim();
    if (clean && formState.booksRead.length < 5) {
      if (!formState.booksRead.some(b => b.toLowerCase() === clean.toLowerCase())) {
        setFormState(prev => ({
          ...prev,
          booksRead: [...prev.booksRead, clean]
        }));
      }
      setBookInput("");
    }
  };

  const handleRemoveBook = (index: number) => {
    setFormState(prev => ({
      ...prev,
      booksRead: prev.booksRead.filter((_, i) => i !== index)
    }));
  };

  const handleAddShow = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = showInput.trim();
    if (clean && formState.showsWatched.length < 5) {
      if (!formState.showsWatched.some(s => s.toLowerCase() === clean.toLowerCase())) {
        setFormState(prev => ({
          ...prev,
          showsWatched: [...prev.showsWatched, clean]
        }));
      }
      setShowInput("");
    }
  };

  const handleRemoveShow = (index: number) => {
    setFormState(prev => ({
      ...prev,
      showsWatched: prev.showsWatched.filter((_, i) => i !== index)
    }));
  };

  const handleGenreChange = (g: string) => {
    setFormState(prev => ({
      ...prev,
      genre: g,
      tropes: [] // Clear tropes from previous genre to maintain matching coherence
    }));
  };

  const handleTropeToggle = (trope: string) => {
    setFormState(prev => {
      const exists = prev.tropes.includes(trope);
      return {
        ...prev,
        tropes: exists 
          ? prev.tropes.filter(t => t !== trope) 
          : [...prev.tropes, trope]
      };
    });
  };

  const injectSuggestion = () => {
    const randomIdx = Math.floor(Math.random() * SPECIFIC_SUGGESTIONS.length);
    setFormState(prev => ({
      ...prev,
      specificDetails: SPECIFIC_SUGGESTIONS[randomIdx]
    }));
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formState.specificDetails.trim()) return;
    await onComplete(formState);
  };

  const progressPct = ((currentStep - 1) / 4) * 100;

  return (
    <div className="max-w-xl mx-auto bg-[#0d0d0d]/90 border border-white/10 shadow-2xl rounded-3xl overflow-hidden relative vibe-gradient" id="wizard-container">
      {/* Visual Header */}
      <div className="border-b border-white/5 text-white px-6 py-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-purple-400">Step {currentStep} of 5</span>
            <h2 className="font-serif font-black text-xl text-white tracking-tight">NextPick Configurator</h2>
          </div>
          <button 
            onClick={onCancel}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-purple-500 rounded-full" 
            animate={{ width: `${progressPct}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
          />
        </div>
      </div>

      <div className="p-6 md:p-8 min-h-[380px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {/* Step 1: Books */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  What books have you loved?
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Add 0 to 5 books you recently enjoyed to establish your baseline taste metrics.
                </p>
              </div>

              <form onSubmit={handleAddBook} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. A Court of Thorns and Roses / Dune"
                  value={bookInput}
                  onChange={(e) => setBookInput(e.target.value)}
                  disabled={formState.booksRead.length >= 5}
                  className="flex-1 px-4 py-2 text-sm bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  id="book-input-field"
                />
                <button
                  type="submit"
                  disabled={formState.booksRead.length >= 5 || !bookInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-550 text-white rounded-xl text-sm font-semibold disabled:bg-white/5 disabled:text-white/20 transition-colors flex items-center gap-1 shadow-sm"
                  id="add-book-btn"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {formState.booksRead.length === 0 ? (
                  <p className="text-xs text-center text-white/40 py-8 italic border border-dashed border-white/10 rounded-2xl bg-white/3 font-sans">
                    No books entered yet (you can skip this step or click Add above)
                  </p>
                ) : (
                  formState.booksRead.map((book, i) => (
                    <motion.div
                      key={book}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
                    >
                      <span className="text-xs font-semibold text-white/90 font-sans">{book}</span>
                      <button
                        onClick={() => handleRemoveBook(i)}
                        className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-purple-300 font-semibold uppercase">
                  {formState.booksRead.length} / 5 books
                </span>
              </div>
            </motion.div>
          )}

          {/* Step 2: Shows & Movies */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <Film className="h-4 w-4 text-purple-400" />
                  What shows or movies have you enjoyed?
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Add 0 to 5 visual titles (series or movies) that share your desired visual tone.
                </p>
              </div>

              <form onSubmit={handleAddShow} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Breaking Bad / Interstellar"
                  value={showInput}
                  onChange={(e) => setShowInput(e.target.value)}
                  disabled={formState.showsWatched.length >= 5}
                  className="flex-1 px-4 py-2 text-sm bg-white/5 text-white placeholder:text-white/30 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  id="show-input-field"
                />
                <button
                  type="submit"
                  disabled={formState.showsWatched.length >= 5 || !showInput.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-550 text-white rounded-xl text-sm font-semibold disabled:bg-white/5 disabled:text-white/20 transition-colors flex items-center gap-1 shadow-sm"
                  id="add-show-btn"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </form>

              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {formState.showsWatched.length === 0 ? (
                  <p className="text-xs text-center text-white/40 py-8 italic border border-dashed border-white/10 rounded-2xl bg-white/3">
                    No shows or movies entered yet (click Add above to capture)
                  </p>
                ) : (
                  formState.showsWatched.map((show, i) => (
                    <motion.div
                      key={show}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 border border-white/10"
                    >
                      <span className="text-xs font-semibold text-white/90">{show}</span>
                      <button
                        onClick={() => handleRemoveShow(i)}
                        className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-purple-300 font-semibold uppercase">
                  {formState.showsWatched.length} / 5 shows
                </span>
              </div>
            </motion.div>
          )}

          {/* Step 3: Genre & Tropes */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-serif italic text-white tracking-tight">
                  Choose your Primary Genre
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Select a main style archetype. This updates the available hyper-specific tropes below.
                </p>
              </div>

              {/* Grid-based humble genre selectors */}
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(GENRE_TROPE_MAP).map((genreName) => {
                  const isSelected = formState.genre === genreName;
                  return (
                    <button
                      key={genreName}
                      onClick={() => handleGenreChange(genreName)}
                      className={`px-3.5 py-2.5 text-xs font-semibold text-left rounded-xl border transition-all ${
                        isSelected 
                          ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/10 ring-2 ring-purple-500/20" 
                          : "bg-white/3 border-white/10 text-white/85 hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        {genreName}
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-tropes Selection */}
              <div className="space-y-2 mt-2">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wide font-mono block">
                  Select Sub-tropes &amp; Sub-genres ({formState.tropes.length} chosen)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-[130px] overflow-y-auto p-2 border border-white/5 rounded-xl bg-white/3">
                  {GENRE_TROPE_MAP[formState.genre].map((trope) => {
                    const active = formState.tropes.includes(trope);
                    return (
                      <button
                        key={trope}
                        onClick={() => handleTropeToggle(trope)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs leading-none transition-all ${
                          active
                            ? "bg-purple-600 border border-purple-500 text-white font-semibold shadow-sm"
                            : "bg-white/5 border border-white/15 text-white/60 hover:text-white hover:border-purple-400/40"
                        }`}
                      >
                        {trope}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Hyper-Specific Details */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-400" />
                  What specific vibe are you tracking?
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Describe the mood, target setting, dynamic, or odd prompt you want the engine to ground ideas on.
                </p>
              </div>

              <div className="space-y-2">
                <textarea
                  className="w-full h-32 px-4 py-3 text-sm bg-white/5 text-white border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-white/30"
                  placeholder="e.g. A psychological thriller set in a coastal town with eerie lighthouses and characters hiding deep maritime family conspiracies."
                  value={formState.specificDetails}
                  onChange={(e) => setFormState(prev => ({ ...prev, specificDetails: e.target.value }))}
                  id="specific-details-textarea"
                />

                <div className="flex justify-between items-center bg-white/3 px-3.5 py-2.5 rounded-xl border border-white/10">
                  <p className="text-[10px] text-white/50 max-w-[280px]">
                    Need ideas? Let us shuffle a compelling preset aesthetic prompt!
                  </p>
                  <button
                    type="button"
                    onClick={injectSuggestion}
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white bg-white/5 border border-white/15 hover:border-purple-400/50 transition-all px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
                  >
                    <Shuffle className="h-3 w-3 text-purple-400" />
                    Shuffle Vibe
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Summary & Confirm Generation */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-tight">
                  Verify and Lock Selection
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  The curated engine will generate exactly 5 books, 2 shows, and 1 film matching your customized criteria.
                </p>
              </div>

              <div className="bg-white/3 border border-white/10 p-4.5 rounded-2xl space-y-3.5 text-xs text-white/80 max-h-[180px] overflow-y-auto">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 block font-bold">Primary Genre</span>
                  <p className="text-white font-bold">{formState.genre}</p>
                </div>

                {formState.tropes.length > 0 && (
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 block font-bold">Sub-tropes Chosen</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formState.tropes.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 text-[10px] border border-purple-800/30 font-semibold">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(formState.booksRead.length > 0 || formState.showsWatched.length > 0) && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                    {formState.booksRead.length > 0 && (
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 block">Favorite Books</span>
                        <p className="text-white/80 truncate font-semibold mt-0.5">{formState.booksRead.join(", ")}</p>
                      </div>
                    )}
                    {formState.showsWatched.length > 0 && (
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/40 block">Favorite Media</span>
                        <p className="text-white/80 truncate font-semibold mt-0.5">{formState.showsWatched.join(", ")}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-white/5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 block font-bold">Your Aesthetic Mandate</span>
                  <p className="text-white/90 italic mt-1 font-semibold">"{formState.specificDetails || "N/A"}"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Panel buttons */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-white/5">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1 transition-colors"
              id="wizard-back-btn"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div className="w-10" />
          )}

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 4 && !formState.specificDetails.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors flex items-center gap-1 shadow-sm disabled:bg-white/5 disabled:text-white/20"
              id="wizard-next-btn"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isGenerating}
              className="relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold text-sm tracking-tight hover:opacity-90 active:scale-95 disabled:scale-100 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/20"
              id="wizard-generate-btn"
            >
              <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              Generate recommendations
            </button>
          )}
        </div>
      </div>

      {/* Generating/AI Loading Screen (Highly artistic and polite) */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0add] bg-opacity-95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center text-white"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut"
              }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-2xl mb-6 border border-purple-500/30"
            >
              <Sparkles className="h-7 w-7 text-white" />
            </motion.div>

            <h3 className="text-xl font-serif italic text-white">Consulting the NextPick Catalog...</h3>
            <p className="text-xs text-white/50 max-w-sm mt-2 font-mono">
              The editorial engine is designing exactly 5 bespoke book lists, 2 TV series matchings, and 1 film masterpiece matching your curated subgenres.
            </p>

            <div className="mt-8 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-bounce" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
