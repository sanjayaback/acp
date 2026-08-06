import React from 'react';
import { Scissors, Sparkles, Upload, Video, ChevronDown, CheckCircle2 } from 'lucide-react';
import { ProjectVideo } from '../types';

interface HeaderProps {
  currentProject: ProjectVideo | null;
  projects: ProjectVideo[];
  onSelectProject: (p: ProjectVideo) => void;
  onOpenUpload: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onOpenUpload,
  isAnalyzing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0F1115]/95 backdrop-blur-md border-b border-white/10 px-6 py-3.5 shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Scissors className="w-4 h-4 text-white -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-100 text-base tracking-tight leading-none">
                ClipFlow <span className="text-slate-500 font-normal">/ AI Social Clipper</span>
              </h1>
            </div>
          </div>
        </div>

        {/* Project Dropdown / Active Status */}
        <div className="flex items-center gap-3">
          {currentProject && (
            <div className="relative group">
              <button
                className="flex items-center gap-2 bg-[#07080A] hover:bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 transition-all max-w-[160px] sm:max-w-[240px] truncate"
                title={currentProject.name}
              >
                <Video className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate text-left font-medium">{currentProject.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0F1115] border border-white/10 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Video Project
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-white/5 transition-colors ${
                      p.id === currentProject.id ? 'text-indigo-400 bg-indigo-600/10 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1">{p.name}</span>
                    {p.id === currentProject.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Analyzing Status Indicator */}
          {isAnalyzing ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-emerald-400 text-xs rounded-full font-medium animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span className="font-medium hidden xs:inline">Processing...</span>
            </div>
          ) : (
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload Video</span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
