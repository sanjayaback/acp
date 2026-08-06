import React from 'react';
import { Upload, Film, Wand2, Download, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'upload' | 'clips' | 'studio' | 'exports';
  setActiveTab: (tab: 'upload' | 'clips' | 'studio' | 'exports') => void;
  clipsCount: number;
  exportsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  clipsCount,
  exportsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1115]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {/* Upload Source Tab */}
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
            activeTab === 'upload'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-5 h-5 mb-1" />
          <span className="text-[11px] leading-none">Upload</span>
        </button>

        {/* AI Clips Feed Tab */}
        <button
          onClick={() => setActiveTab('clips')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
            activeTab === 'clips'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Film className="w-5 h-5 mb-1" />
            {clipsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {clipsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-none">AI Clips</span>
        </button>

        {/* Studio Editor Tab */}
        <button
          onClick={() => setActiveTab('studio')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
            activeTab === 'studio'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Wand2 className="w-5 h-5 mb-1" />
            <Sparkles className="w-2.5 h-2.5 text-pink-400 absolute -top-1 -right-1" />
          </div>
          <span className="text-[11px] leading-none">Studio</span>
        </button>

        {/* Exports Queue Tab */}
        <button
          onClick={() => setActiveTab('exports')}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative ${
            activeTab === 'exports'
              ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Download className="w-5 h-5 mb-1" />
            {exportsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {exportsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] leading-none">Exports</span>
        </button>
      </div>
    </nav>
  );
};
