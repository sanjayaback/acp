import React, { useState } from 'react';
import { Sparkles, Smartphone, Square, Monitor, Film, Layers, Filter } from 'lucide-react';
import { VideoClip, ProjectVideo } from '../types';
import { ClipCard } from './ClipCard';

interface ClipListProps {
  project: ProjectVideo;
  onEditInStudio: (clip: VideoClip) => void;
  onExportDirect: (clip: VideoClip) => void;
  onOpenUpload: () => void;
}

export const ClipList: React.FC<ClipListProps> = ({
  project,
  onEditInStudio,
  onExportDirect,
  onOpenUpload,
}) => {
  const [filterRatio, setFilterRatio] = useState<string>('all');

  const filteredClips = project.clips.filter((clip) => {
    if (filterRatio === 'all') return true;
    if (filterRatio === '9:16') return clip.suggestedRatio === '9:16' || clip.suggestedRatio === '9:16-split';
    if (filterRatio === '1:1') return clip.suggestedRatio === '1:1' || clip.suggestedRatio === '4:5';
    if (filterRatio === '16:9') return clip.suggestedRatio === '16:9';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Info Banner */}
      <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-300 border border-indigo-600/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>AI Clips Ready</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {project.clips.length} Viral Highlights
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-100 mt-1">
            {project.name}
          </h2>
        </div>

        {/* Ratio Filters */}
        <div className="flex items-center gap-1.5 bg-[#07080A] p-1 rounded-lg border border-white/10 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterRatio('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterRatio === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All ({project.clips.length})</span>
          </button>

          <button
            onClick={() => setFilterRatio('9:16')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterRatio === '9:16'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Reels/TikTok</span>
          </button>

          <button
            onClick={() => setFilterRatio('1:1')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterRatio === '1:1'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1 Square</span>
          </button>

          <button
            onClick={() => setFilterRatio('16:9')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterRatio === '16:9'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9 YouTube</span>
          </button>
        </div>
      </div>

      {/* Clip Cards Feed */}
      {filteredClips.length > 0 ? (
        <div className="space-y-4">
          {filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              onEditInStudio={onEditInStudio}
              onExportDirect={onExportDirect}
              videoUrl={project.url}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Film className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No clips found for this filter</h3>
          <p className="text-xs text-slate-500">Try changing the ratio filter or generate new clips.</p>
          <button
            onClick={onOpenUpload}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Upload another video
          </button>
        </div>
      )}
    </div>
  );
};
