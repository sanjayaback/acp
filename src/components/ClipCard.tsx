import React from 'react';
import { Play, Flame, Wand2, Download, Copy, Check, Smartphone, Monitor, Square } from 'lucide-react';
import { VideoClip, SocialRatio } from '../types';
import { formatTime, formatDuration } from '../utils/time';
import { SmartVideoPlayer } from './SmartVideoPlayer';

interface ClipCardProps {
  clip: VideoClip;
  onEditInStudio: (clip: VideoClip) => void;
  onExportDirect: (clip: VideoClip) => void;
  videoUrl: string;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  onEditInStudio,
  onExportDirect,
  videoUrl,
}) => {
  const [copiedCaption, setCopiedCaption] = React.useState(false);

  const getRatioBadge = (ratio: SocialRatio) => {
    switch (ratio) {
      case '9:16':
      case '9:16-split':
        return { label: '9:16 TikTok / Reels', icon: Smartphone, color: 'from-pink-500 to-rose-500' };
      case '1:1':
        return { label: '1:1 Feed / LinkedIn', icon: Square, color: 'from-purple-500 to-indigo-500' };
      case '16:9':
        return { label: '16:9 YouTube', icon: Monitor, color: 'from-blue-500 to-cyan-500' };
      default:
        return { label: '9:16 Vertical', icon: Smartphone, color: 'from-pink-500 to-rose-500' };
    }
  };

  const badge = getRatioBadge(clip.suggestedRatio);
  const IconComp = badge.icon;

  const handleCopyCaption = () => {
    const textToCopy = `${clip.suggestedCaption}\n\n${clip.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="bg-[#0F1115] border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all flex flex-col sm:flex-row group">
      {/* Video Preview Box */}
      <div className="relative sm:w-56 h-48 sm:h-auto bg-[#07080A] shrink-0 overflow-hidden flex items-center justify-center">
        <SmartVideoPlayer
          url={videoUrl}
          startTime={clip.startTime}
          endTime={clip.endTime}
          controls={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-transparent to-transparent pointer-events-none" />

        {/* Ratio Tag Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-semibold text-slate-200 border border-white/10 z-10">
          <IconComp className="w-3 h-3 text-indigo-400" />
          <span>{clip.suggestedRatio}</span>
        </div>

        {/* Viral Score Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-amber-300 z-10">
          <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>{clip.viralScore}% Score</span>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/80 text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded border border-white/10 z-10">
          {formatTime(clip.startTime)} - {formatTime(clip.endTime)} ({formatDuration(clip.duration)})
        </div>

        {/* Center Play / Studio Hover CTA */}
        <button
          onClick={() => onEditInStudio(clip)}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:scale-110 transition-transform">
            <Play className="w-4 h-4 ml-0.5 fill-current" />
          </div>
        </button>
      </div>

      {/* Clip Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-600/10 text-indigo-300 border border-indigo-600/20">
              {clip.category}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {clip.speakers.join(', ')}
            </span>
          </div>

          <h3 className="font-semibold text-base text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
            {clip.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">
            {clip.hookSummary}
          </p>
        </div>

        {/* AI Suggested Caption Preview */}
        <div className="bg-[#07080A] border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 space-y-1">
          <p className="line-clamp-2 text-slate-300 italic">
            "{clip.suggestedCaption}"
          </p>
          <div className="flex items-center justify-between text-[11px] text-indigo-400 pt-1">
            <span className="truncate">{clip.hashtags.join(' ')}</span>
            <button
              onClick={handleCopyCaption}
              className="text-slate-400 hover:text-indigo-300 flex items-center gap-1 shrink-0 ml-2"
              title="Copy caption"
            >
              {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            onClick={() => onEditInStudio(clip)}
            className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-600/30 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Customize & Reframing</span>
          </button>

          <button
            onClick={() => onExportDirect(clip)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Clip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
