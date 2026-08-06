import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Film, Play, Zap, FileVideo, CheckCircle2, ArrowRight } from 'lucide-react';
import { ProjectVideo } from '../types';
import { SAMPLE_VIDEOS } from '../data/samples';
import { formatDuration, formatBytes } from '../utils/time';

interface VideoUploaderProps {
  onVideoUploaded: (video: ProjectVideo, focusPrompt: string) => void;
  isAnalyzing: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoUploaded,
  isAnalyzing,
}) => {
  const [selectedFocus, setSelectedFocus] = useState<string>('Viral Hooks & High Energy');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{ duration: number; name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const focusPresets = [
    { id: 'viral', label: '🔥 Viral Hooks & Energy', desc: 'Find high-curiosity 15-45s hooks for TikTok/Reels' },
    { id: 'insights', label: '💡 Educational Key Takeaways', desc: 'Extract high-value advice and actionable insights' },
    { id: 'stories', label: '🎯 Personal Stories & Quotes', desc: 'Emotional, authentic narrative moments' },
    { id: 'all', label: '⚡ Auto Multi-Format Mix', desc: 'Balanced mix of hooks, insights, and social ratios' },
  ];

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (.mp4, .webm, .mov)');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);

    // Read metadata duration
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

  const handleSelectSample = (sample: ProjectVideo) => {
    onVideoUploaded(sample, selectedFocus);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Hero Banner */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Multi-Ratio Clip Generator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Turn Long Videos into <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Viral 9:16 Social Clips
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Automatically extract high-engagement highlights, reframed perfectly for TikTok, Instagram Reels, YouTube Shorts, and 1:1 Feed posts with animated captions.
        </p>
      </div>

      {/* AI Focus Preference Selection */}
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

      {/* Upload Zone & Custom File Preview */}
      <div className="bg-[#0F1115] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Upload Your Video</span>
          </h2>
          <span className="text-xs text-slate-400">Supports MP4, WEBM, MOV</span>
        </div>

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
                    <span>Generate AI Clips</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Sample Videos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-400" />
            <span>Or Try Demo Long Video Samples</span>
          </h2>
          <span className="text-xs text-slate-400">Instant AI clip generation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAMPLE_VIDEOS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="group bg-[#0F1115] border border-white/10 hover:border-indigo-600/50 rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col"
            >
              <div className="relative h-36 bg-[#07080A] overflow-hidden">
                <img
                  src={sample.thumbnailUrl}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080A] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="bg-black/80 backdrop-blur-md text-slate-200 text-xs font-mono px-2 py-0.5 rounded border border-white/10">
                    {formatDuration(sample.duration)}
                  </span>
                  <span className="bg-indigo-600/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-indigo-600/30">
                    {sample.clips.length} Pre-Detected Clips
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40">
                    <Play className="w-4 h-4 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <h3 className="font-medium text-sm text-slate-200 line-clamp-2 group-hover:text-indigo-300 transition-colors">
                  {sample.name}
                </h3>
                <div className="mt-3 flex items-center justify-between text-xs text-indigo-400 font-medium">
                  <span>Extract Clips Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
