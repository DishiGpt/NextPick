import React, { useState } from "react";
import { 
  Book, 
  Tv, 
  Film, 
  Calendar, 
  SlidersHorizontal,
  Bookmark,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { RecommendationBatch } from "../types";

interface HistoryArchiveProps {
  historyList: RecommendationBatch[];
  onSelectBatch: (batch: RecommendationBatch) => void;
  selectedBatch: RecommendationBatch | null;
  onRefreshHistory: () => void;
}

type FilterType = "all" | "books" | "series" | "movies";

export default function HistoryArchive({ 
  historyList, 
  onSelectBatch, 
  selectedBatch,
  onRefreshHistory
}: HistoryArchiveProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("netflix")) return "🍿";
    if (p.includes("prime") || p.includes("amazon")) return "🌀";
    if (p.includes("hotstar") || p.includes("jio")) return "⚡";
    if (p.includes("apple") || p.includes("itunes")) return "🍏";
    if (p.includes("audible")) return "🎧";
    if (p.includes("kindle")) return "📚";
    if (p.includes("kobo")) return "📖";
    if (p.includes("disney")) return "🏰";
    return "🌐";
  };

  const getPlatformStyle = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("netflix")) return "bg-red-950/40 text-red-300 border-red-900/35";
    if (p.includes("prime") || p.includes("amazon")) return "bg-blue-950/40 text-blue-300 border-blue-900/35";
    if (p.includes("disney") || p.includes("hotstar") || p.includes("jio")) return "bg-sky-950/40 text-sky-300 border-sky-900/35";
    if (p.includes("audible") || p.includes("kobo")) return "bg-amber-950/40 text-amber-300 border-amber-900/35";
    if (p.includes("kindle")) return "bg-emerald-950/40 text-emerald-300 border-emerald-900/35";
    return "bg-white/5 text-white/70 border-white/10";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="archive-master-layout">
      {/* LEFT COLUMN: ARCHIVE LIST (4 span on wide screens) */}
      <div className="lg:col-span-4 space-y-4" id="archive-sidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4.5 w-4.5 text-purple-400" />
            <h3 className="font-serif font-bold text-white text-lg tracking-tight">Your NextPick Vault</h3>
          </div>
          <button
            onClick={onRefreshHistory}
            className="p-1 px-2.5 rounded-lg border border-white/10 hover:border-purple-500 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all text-xs flex items-center gap-1 font-semibold"
            id="history-reload-btn"
          >
            <RefreshCw className="h-3 w-3" />
            Sync
          </button>
        </div>

        {/* History batches scroll container */}
        <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
          {historyList.length === 0 ? (
            <div className="bg-white/3 border border-white/5 rounded-2xl p-6 text-center">
              <FolderOpen className="h-8 w-8 text-white/20 mx-auto stroke-1" />
              <p className="text-xs font-bold text-white mt-2">No Past Recommendations</p>
              <p className="text-[10px] text-white/40 mt-1">
                Your calculated books and movies will establish a permanent record here once built.
              </p>
            </div>
          ) : (
            historyList.map((batch, idx) => {
              const isSelected = selectedBatch?.createdAt === batch.createdAt;
              const formattedDate = new Date(batch.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <button
                  key={batch.id || batch.createdAt || idx}
                  onClick={() => onSelectBatch(batch)}
                  className={`w-full text-left p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected 
                      ? "bg-gradient-to-br from-purple-950/45 to-pink-950/30 border-purple-500 text-white shadow-lg shadow-purple-900/25 ring-2 ring-purple-500/20" 
                      : "bg-[#111]/60 hover:bg-[#181818]/80 border-white/10 text-white/85"
                  }`}
                  id={`batch-sidebar-item-${idx}`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-2 py-0.5 rounded font-extrabold tracking-wide uppercase ${
                        isSelected ? "bg-purple-600 text-white" : "bg-white/5 text-white/50 border border-white/5"
                      }`}>
                        {batch.inputs.genre}
                      </span>
                      <span className={isSelected ? "text-white/60" : "text-white/40"}>
                        {formattedDate}
                      </span>
                    </div>

                    <p className={`text-xs font-extrabold truncate uppercase font-sans tracking-wide ${
                      isSelected ? "text-purple-300" : "text-white"
                    }`}>
                      {batch.inputs.specificDetails}
                    </p>

                    <div className={`flex items-center gap-1.5 text-[10px] ${
                      isSelected ? "text-white/50" : "text-white/40"
                    }`}>
                      <span className="flex items-center gap-0.5"><Book className="h-3 w-3" /> 5</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Tv className="h-3 w-3" /> 2</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Film className="h-3 w-3" /> 1</span>
                    </div>
                  </div>
                  <div className="text-right w-full mt-2 self-end">
                    <ChevronRight className={`h-4 w-4 ml-auto ${
                      isSelected ? "text-purple-400" : "text-white/30"
                    }`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE FILTER & RESULTS LIST */}
      <div className="lg:col-span-8 space-y-6" id="archive-results-panel">
        {selectedBatch ? (
          <div className="bg-[#0c0c0c]/80 border border-white/10 shadow-2xl rounded-3xl p-6 md:p-8 space-y-6 vibe-gradient">
            {/* Header / Vibe Specs */}
            <div className="border-b border-white/5 pb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-extrabold block">
                Active Selection
              </span>
              <h2 className="text-3xl font-serif font-black text-white tracking-tight mt-1">
                Your Personalized Recommendation Suite
              </h2>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold">
                  Genre: {selectedBatch.inputs.genre}
                </span>
                {selectedBatch.inputs.tropes.map(t => (
                  <span key={t} className="px-3 py-1 bg-white/5 text-white/80 rounded-lg border border-white/10 font-mono text-[11px] font-bold">
                    #{t}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-white/70 bg-white/3 p-3.5 border border-white/5 rounded-xl italic leading-relaxed">
                <strong className="text-purple-300">NextPick input:</strong> "{selectedBatch.inputs.specificDetails}"
              </p>
            </div>

            {/* Platform Filter Controls (Mandatory Filter Requirements) */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-white/3 p-2.5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-white/70 font-bold ml-1">
                <SlidersHorizontal className="h-4 w-4 text-purple-400" />
                <span>Filter recommendations:</span>
              </div>
              <div className="flex gap-1 animate-fadeIn">
                {(["all", "books", "series", "movies"] as FilterType[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold leading-none capitalize transition-all ${
                      activeFilter === filter
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-900/10"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border border-white/10"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* RECOMMENDATION SECTIONS */}
            <div className="space-y-6">
              {/* 1. BOOKS SECTION */}
              {(activeFilter === "all" || activeFilter === "books") && (
                <div className="space-y-3.5" id="filtered-books-block">
                  <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
                    <Book className="h-5 w-5 text-purple-400" />
                    <h3 className="font-serif font-extrabold text-lg tracking-tight">Curated Books ({selectedBatch.results.books.length})</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {selectedBatch.results.books.map((book, idx) => (
                      <div key={idx} className="vibe-card p-5 rounded-2xl border border-white/10 hover:shadow-2xl transition-all flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-serif font-bold text-white text-base leading-tight tracking-tight uppercase">
                              {book.title}
                            </h4>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-bold">
                              Book #{idx+1}
                            </span>
                          </div>
                          <p className="text-xs font-mono font-bold text-purple-300 italic mt-0.5">by {book.author}</p>
                          <p className="text-xs text-white/75 mt-2.5 leading-relaxed bg-[#0a0a0a]/65 p-3.5 rounded-xl border border-white/5">
                            {book.whyYouWillLoveIt}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {book.platforms.map((platform, pIdx) => (
                            <span 
                              key={pIdx} 
                              className={`px-2.5 py-1 text-[10px] rounded-lg border font-bold flex items-center gap-1 ${getPlatformStyle(platform)}`}
                            >
                              <span>{getPlatformIcon(platform)}</span>
                              <span>{platform}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. TV SERIES SECTION */}
              {(activeFilter === "all" || activeFilter === "series") && (
                <div className="space-y-3.5 pt-4" id="filtered-series-block">
                  <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
                    <Tv className="h-5 w-5 text-purple-400" />
                    <h3 className="font-serif font-extrabold text-lg tracking-tight">Curated TV Programs ({selectedBatch.results.series.length})</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBatch.results.series.map((show, idx) => (
                      <div key={idx} className="vibe-card p-5 rounded-2xl border border-white/10 hover:shadow-2xl transition-all flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold text-white text-base tracking-tight leading-tight uppercase">
                              {show.title}
                            </h4>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-purple-400 font-bold">
                              Show #{idx+1}
                            </span>
                          </div>
                          <p className="text-xs text-white/75 mt-2.5 leading-relaxed bg-[#0a0a0a]/65 p-3.5 rounded-xl border border-white/5">
                            {show.whyYouWillLoveIt}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {show.platforms.map((platform, pIdx) => (
                            <span 
                              key={pIdx} 
                              className={`px-2.5 py-1 text-[10px] rounded-lg border font-bold flex items-center gap-1 ${getPlatformStyle(platform)}`}
                            >
                              <span>{getPlatformIcon(platform)}</span>
                              <span>{platform}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. MOVIE SECTION */}
              {(activeFilter === "all" || activeFilter === "movies") && (
                <div className="space-y-3.5 pt-4" id="filtered-movie-block">
                  <div className="flex items-center gap-2 text-white border-b border-white/5 pb-2">
                    <Film className="h-5 w-5 text-purple-400" />
                    <h3 className="font-serif font-extrabold text-lg tracking-tight">Curated Movie Masterpiece</h3>
                  </div>

                  <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 text-white p-6 rounded-2xl border border-purple-500/20 shadow-2xl relative overflow-hidden" id="movie-bento-hero">
                    <div className="absolute inset-0 bg-radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_60%) pointer-events-none" />
                    <div className="z-10 relative space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[9px] tracking-widest text-purple-300 font-bold uppercase bg-purple-900/40 px-2 py-0.5 rounded border border-purple-800/30">
                            Bespoke Film Recommendation
                          </span>
                          <h4 className="font-serif font-black text-2xl text-white tracking-tight leading-none mt-2 uppercase">
                            {selectedBatch.results.movie.title}
                          </h4>
                        </div>
                        <Sparkles className="h-5 w-5 text-yellow-300 fill-yellow-200 animate-pulse" />
                      </div>

                      <p className="text-xs text-white/85 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/15 italic">
                        {selectedBatch.results.movie.whyYouWillLoveIt}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {selectedBatch.results.movie.platforms.map((platform, pIdx) => (
                          <span 
                            key={pIdx} 
                            className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/85 font-mono text-[10px] font-bold flex items-center gap-1 shadow"
                          >
                            <span>{getPlatformIcon(platform)}</span>
                            <span>{platform}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/3 border border-white/5 p-12 text-center rounded-3xl min-h-[350px] flex flex-col justify-center items-center">
            <Sparkles className="h-10 w-10 text-purple-400/45 animate-pulse stroke-1" />
            <h4 className="text-md font-serif font-extrabold text-white tracking-tight mt-3">Select or Curate Recommendations</h4>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-1">
              Select an archival batch from the left sidebar tracker, or click "Find Your Next Recommendation" above to configure a brand new list.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
