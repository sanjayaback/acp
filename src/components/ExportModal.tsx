import React, { useState } from 'react';
import { X, Download, FileText, Copy, Check, Sparkles, CheckCircle2, Film } from 'lucide-react';
import { VideoClip, ClipCustomization, RenderProgress } from '../types';
import { exportToSRT } from '../utils/exportVideo';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: RenderProgress;
  clip: VideoClip | null;
  customization: ClipCustomization | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  clip,
  customization,
}) => {
  const [copiedCaption, setCopiedCaption] = useState(false);

  if (!isOpen || !clip) return null;

  const handleDownloadVideo = () => {
    if (!progress.outputBlobUrl) return;
    const a = document.createElement('a');
    a.href = progress.outputBlobUrl;
    const cleanTitle = clip.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    a.download = `autoclip_${cleanTitle}_${customization?.ratio || '9x16'}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSRT = () => {
    const srtContent = exportToSRT(clip);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${clip.id}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyCaption = () => {
    const textToCopy = `${clip.suggestedCaption}\n\n${clip.hashtags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F1115] border border-white/10 rounded-xl max-w-lg w-full p-6 shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#07080A] border border-white/10 text-slate-400 hover:text-slate-200 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Direct Video Exporter</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-100">{clip.title}</h2>
        </div>

        {/* Rendering Progress View */}
        {progress.isRendering ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
              <Film className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span>{progress.statusText}</span>
                <span className="font-mono text-indigo-400">{progress.progress}%</span>
              </div>

              <div className="w-full bg-[#07080A] h-2.5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Rendering {customization?.ratio || '9:16'} cropped video with animated captions & audio...
              </p>
            </div>
          </div>
        ) : (
          /* Render Complete & Direct Download Options */
          <div className="space-y-5">
            {progress.outputBlobUrl && (
              <div className="bg-[#07080A] rounded-xl overflow-hidden border border-white/10 max-h-64 flex items-center justify-center">
                <video
                  src={progress.outputBlobUrl}
                  controls
                  autoPlay
                  className="max-h-64 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold">Video Clip Ready!</span> Direct high-res export complete.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleDownloadVideo}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Video Clip (MP4/WEBM)</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleDownloadSRT}
                  className="bg-[#07080A] hover:bg-white/5 border border-white/10 text-slate-300 font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Download .SRT</span>
                </button>

                <button
                  onClick={handleCopyCaption}
                  className="bg-[#07080A] hover:bg-white/5 border border-white/10 text-slate-300 font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>Copy Captions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
