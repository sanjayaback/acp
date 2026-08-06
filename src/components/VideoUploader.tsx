import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Zap, FileVideo, CheckCircle2, Link as LinkIcon, Youtube, Globe, AlertCircle } from 'lucide-react';
import { ProjectVideo } from '../types';
import { formatDuration, formatBytes } from '../utils/time';

interface VideoUploaderProps {
  onVideoUploaded: (video: ProjectVideo, focusPrompt: string) => void;
  isAnalyzing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoUploaded,
  isAnalyzing,
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'link'>('file');
  const [selectedFocus, setSelectedFocus] = useState<string>('Viral Hooks & High Energy');
  
  // File Upload State
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; name: string; size: number } | null>(null);

  // Link Paste State
  const [pastedUrl, setPastedUrl] = useState<string>('');
  const [linkTitle, setLinkTitle] = useState<string>('');
  const [linkDurationSecs, setLinkDurationSecs] = useState<number>(600); // 10 minutes default
  const [urlError, setUrlError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const focusPresets = [
    { id: 'viral', label: '🔥 Viral Hooks & Energy', desc: 'Find high-curiosity 15-45s hooks for TikTok/Reels' },
    { id: 'insights', label: '💡 Educational Key Takeaways', desc: 'Extract high-value advice and actionable insights' },
    { id: 'stories', label: '🎯 Personal Stories & Quotes', desc: 'Emotional, authentic narrative moments' },
    { id: 'all', label: '⚡ Auto Multi-Format Mix', desc: 'Balanced mix of hooks, insights, and 9:16 social ratios' },
  ];

  // Extract YouTube ID if applicable
  const getYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (.mp4, .webm, .mov)');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    const tempVid = document.createElement('video');
    tempVid.src = url;
    tempVid.onloadedmetadata = () => {
      setVideoMeta({
        duration: tempVid.duration,
        name: file.name,
        size: file.size,
      });
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartFileAnalysis = () => {
    if (!selectedFile || !videoPreviewUrl || !videoMeta) return;

    const newProject: ProjectVideo = {
      id: `custom-vid-${Date.now()}`,
      name: videoMeta.name,
      url: videoPreviewUrl,
      duration: videoMeta.duration,
      sizeMb: Math.round(videoMeta.size / (1024 * 1024)),
      sourceType: 'file',
      clips: [],
    };

    onVideoUploaded(newProject, selectedFocus);
  };

  const handleStartLinkAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const cleanUrl = pastedUrl.trim();
    if (!cleanUrl) {
      setUrlError('Please enter or paste a video link/URL.');
      return;
    }

    const ytId = getYouTubeId(cleanUrl);
    const defaultName = ytId ? `YouTube Video (${ytId})` : cleanUrl.split('/').pop()?.split('?')[0] || 'Imported Web Video';
    const finalTitle = linkTitle.trim() || defaultName;

    // Use high resolution thumbnail if YouTube or generic poster fallback
    const thumbUrl = ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop';

    const newProject: ProjectVideo = {
      id: `link-vid-${Date.now()}`,
      name: finalTitle,
      url: cleanUrl,
      duration: linkDurationSecs || 600,
      sourceType: 'file',
      thumbnailUrl: thumbUrl,
      clips: [],
    };

    onVideoUploaded(newProject, selectedFocus);
  };

  const handleSelectSample = (sample: ProjectVideo) => {
    onVideoUploaded(sample, selectedFocus);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Multi 9:16 Social Clip Generator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Turn Long Videos into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Multiple 9:16 Social Clips
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Upload local video files or paste video links (YouTube, Web MP4s). Automatically extract multiple 9:16 vertical clips for TikTok, Instagram Reels, and YouTube Shorts.
        </p>
      </div>

      {/* AI Extraction Goal Selection */}
      <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 sm:p-5 space-y-3">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Select AI Clip Extraction Goal</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {focusPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setSelectedFocus(preset.label)}
              className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 ${
                selectedFocus === preset.label
                  ? 'bg-indigo-600/10 border-indigo-600/50 text-slate-100 shadow-md shadow-indigo-600/10'
                  : 'bg-[#07080A] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium text-xs text-slate-200">{preset.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{preset.desc}</div>
              </div>
              {selectedFocus === preset.label && (
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Input Source Mode Switcher: File Upload vs Paste Link */}
      <div className="bg-[#0F1115] border border-white/10 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadMode('file')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                uploadMode === 'file'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video File</span>
            </button>

            <button
              onClick={() => setUploadMode('link')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                uploadMode === 'link'
                  ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Video Link / URL</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            {uploadMode === 'file' ? 'MP4, WEBM, MOV' : 'YouTube, Web MP4 Links'}
          </span>
        </div>

        {/* Mode 1: File Upload */}
        {uploadMode === 'file' && (
          <div>
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-600/10 scale-[0.99]'
                    : 'border-white/15 bg-[#07080A] hover:border-white/30 hover:bg-[#07080A]/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/10">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Drag and drop your long video here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    or click to browse from device
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#07080A] border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4">
                {videoPreviewUrl && (
                  <div className="w-32 h-20 bg-black rounded overflow-hidden shrink-0 relative border border-white/10">
                    <video src={videoPreviewUrl} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-slate-200 font-mono px-1 rounded">
                      {videoMeta ? formatDuration(videoMeta.duration) : '--:--'}
                    </div>
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-sm text-slate-200 truncate">{videoMeta?.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDuration(videoMeta?.duration || 0)} • {formatBytes(videoMeta?.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setVideoPreviewUrl(null);
                      setVideoMeta(null);
                    }}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs text-slate-400 hover:text-slate-200 bg-[#0F1115] border border-white/10 rounded-lg"
                  >
                    Change
                  </button>
                  <button
                    onClick={handleStartFileAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate 9:16 Clips</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Paste Link / URL */}
        {uploadMode === 'link' && (
          <form onSubmit={handleStartLinkAnalysis} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <Youtube className="w-4 h-4 text-rose-500" />
                <span>Paste Video Link (YouTube, Vimeo, MP4 URL)</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://domain.com/video.mp4"
                  className="w-full bg-[#07080A] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Custom Video Title (Optional)</label>
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="e.g. 10 Minute Masterclass Podcast"
                  className="w-full bg-[#07080A] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Estimated Duration (Seconds)</label>
                <select
                  value={linkDurationSecs}
                  onChange={(e) => setLinkDurationSecs(Number(e.target.value))}
                  className="w-full bg-[#07080A] border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={300}>5 Minutes (300s)</option>
                  <option value={600}>10 Minutes (600s)</option>
                  <option value={900}>15 Minutes (900s)</option>
                  <option value={1200}>20 Minutes (1200s)</option>
                  <option value={1800}>30 Minutes (1800s)</option>
                </select>
              </div>
            </div>

            {urlError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Analyzing Video Link...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Multiple 9:16 Viral Clips</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

