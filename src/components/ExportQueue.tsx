import React from 'react';
import { Download, Film, Sparkles, CheckCircle2, Flame, Copy, Check, Share2 } from 'lucide-react';
import { VideoClip, ProjectVideo } from '../types';
import { formatTime, formatDuration } from '../utils/time';

interface ExportQueueProps {
  project: ProjectVideo | null;
  exportedClips: VideoClip[];
  onOpenStudio: (clip: VideoClip) => void;
  onExportDirect: (clip: VideoClip) => void;
}

export const ExportQueue: React.FC<ExportQueueProps> = ({
  project,
  exportedClips,
  onOpenStudio,
  onExportDirect,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const allClips = project?.clips || [];

  const handleCopyCaption = (clip: VideoClip) => {
    const textToCopy = `${clip.suggestedCaption}\n\n${clip.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">{allClips.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total AI Clips</div>
        </div>

        <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">
            {allClips.length > 0
              ? Math.round(allClips.reduce((acc, c) => acc + c.viralScore, 0) / allClips.length)
              : 0}%
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Avg Viral Score</div>
        </div>

        <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{exportedClips.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Ready Exports</div>
        </div>
      </div>

      {/* Export List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Export & Downloads Center</span>
          </h2>

          {allClips.length > 0 && (
            <button
              onClick={() => onExportDirect(allClips[0])}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-600/10 border border-indigo-600/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              Quick Export First Clip
            </button>
          )}
        </div>

        {allClips.length > 0 ? (
          <div className="space-y-3">
            {allClips.map((clip) => (
              <div
                key={clip.id}
                className="bg-[#0F1115] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#07080A] border border-white/10 flex items-center justify-center shrink-0">
                    <Film className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-100">{clip.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {clip.viralScore}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {clip.suggestedRatio} • {formatDuration(clip.duration)} ({formatTime(clip.startTime)} - {formatTime(clip.endTime)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCopyCaption(clip)}
                    className="flex-1 sm:flex-initial bg-[#07080A] hover:bg-white/5 border border-white/10 text-slate-300 font-medium text-xs px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedId === clip.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                    <span>{copiedId === clip.id ? 'Copied' : 'Captions'}</span>
                  </button>

                  <button
                    onClick={() => onOpenStudio(clip)}
                    className="flex-1 sm:flex-initial bg-[#07080A] hover:bg-white/5 border border-white/10 text-slate-300 font-medium text-xs px-3 py-2 rounded-lg transition-colors"
                  >
                    Customize
                  </button>

                  <button
                    onClick={() => onExportDirect(clip)}
                    className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#0F1115] border border-white/10 rounded-xl p-12 text-center text-slate-400 space-y-2">
            <Download className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs">No video clips generated yet. Upload a long video to extract clips.</p>
          </div>
        )}
      </div>
    </div>
  );
};
