import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Smartphone, Square, Monitor, Sparkles, Sliders, Type, Layout, Wand2, Download, RotateCcw, Volume2, VolumeX, Scissors } from 'lucide-react';
import { VideoClip, SocialRatio, FrameStyle, SubStyle, ClipCustomization, ProjectVideo } from '../types';
import { formatTime, formatTimeMs } from '../utils/time';
import { drawCanvasFrame, getRatioDimensions } from '../utils/exportVideo';
import { SmartVideoPlayer, getYouTubeId } from './SmartVideoPlayer';

interface ClipStudioProps {
  clip: VideoClip;
  project: ProjectVideo;
  onExportClip: (customization: ClipCustomization) => void;
  onBackToClips: () => void;
}

export const ClipStudio: React.FC<ClipStudioProps> = ({
  clip,
  project,
  onExportClip,
  onBackToClips,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(clip.startTime);

  // Customization state
  const [customization, setCustomization] = useState<ClipCustomization>({
    ratio: clip.suggestedRatio || '9:16',
    frameStyle: 'blur-padding',
    subStyle: 'hormozi',
    showSubtitles: true,
    subPosition: 'bottom',
    subFontSize: 46,
    subColor: '#FFFFFF',
    subHighlightColor: '#FACC15', // Yellow
    showHookBanner: true,
    hookText: clip.title.replace(/[^\w\s]/gi, '').slice(0, 32).toUpperCase() || 'MUST WATCH THIS 🚨',
    showProgressBar: true,
    watermarkText: 'autoclip.ai',
    trimStart: clip.startTime,
    trimEnd: clip.endTime,
  });

  const [activeTab, setActiveTab] = useState<'ratio' | 'frame' | 'captions' | 'banner' | 'trim'>('ratio');

  const duration = Math.max(1, customization.trimEnd - customization.trimStart);

  // Synchronize canvas rendering loop with video element
  useEffect(() => {
    let animId: number;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const { width, height } = getRatioDimensions(customization.ratio);
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          // Loop video inside trim bounds
          if (video.currentTime >= customization.trimEnd) {
            video.currentTime = customization.trimStart;
          } else if (video.currentTime < customization.trimStart) {
            video.currentTime = customization.trimStart;
          }

          setCurrentTime(video.currentTime);

          drawCanvasFrame(
            ctx,
            video,
            width,
            height,
            video.currentTime,
            customization.trimStart,
            duration,
            clip,
            customization
          );
        }
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [customization, clip, duration]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= customization.trimEnd) {
        videoRef.current.currentTime = customization.trimStart;
      }
      videoRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (timeSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timeSec;
    setCurrentTime(timeSec);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#0F1115] border border-white/10 rounded-xl p-3.5">
        <button
          onClick={onBackToClips}
          className="text-xs text-slate-400 hover:text-slate-200 font-medium px-3 py-1.5 rounded-lg bg-[#07080A] border border-white/10 transition-colors"
        >
          ← Back to Clips
        </button>

        <div className="text-center truncate">
          <h2 className="text-sm font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-xs">{clip.title}</h2>
          <p className="text-[11px] text-slate-400 font-mono">
            {formatTimeMs(currentTime)} / {formatTimeMs(customization.trimEnd)}
          </p>
        </div>

        <button
          onClick={() => onExportClip(customization)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Video</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Canvas Video Preview Player */}
        <div className="lg:col-span-7 bg-[#07080A] border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center relative">
          {/* Hidden Source Video Element */}
          <video
            ref={videoRef}
            src={project.url}
            className="hidden"
            playsInline
            crossOrigin="anonymous"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Social Frame Box Container */}
          <div
            className={`relative overflow-hidden rounded-xl bg-black border border-white/10 flex items-center justify-center ${
              customization.ratio === '9:16' || customization.ratio === '9:16-split'
                ? 'w-[260px] sm:w-[320px] h-[460px] sm:h-[568px]'
                : customization.ratio === '1:1'
                ? 'w-[320px] sm:w-[400px] h-[320px] sm:h-[400px]'
                : customization.ratio === '4:5'
                ? 'w-[300px] sm:w-[360px] h-[375px] sm:h-[450px]'
                : 'w-[340px] sm:w-[500px] h-[190px] sm:h-[280px]'
            }`}
          >
            {/* Live Render Canvas or YouTube Smart Player */}
            {getYouTubeId(project.url) ? (
              <SmartVideoPlayer
                url={project.url}
                startTime={customization.trimStart}
                endTime={customization.trimEnd}
                autoPlay={isPlaying}
                className="w-full h-full"
              />
            ) : (
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            )}

            {/* Play Overlay Control */}
            {!getYouTubeId(project.url) && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
              >
                {!isPlaying && (
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/50 group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 ml-1 fill-current" />
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Video Controls Scrubber Bar */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </button>

              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-lg bg-[#0F1115] border border-white/10 text-slate-300 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <input
                type="range"
                min={customization.trimStart}
                max={customization.trimEnd}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 accent-indigo-500 bg-[#0F1115] h-2 rounded-lg cursor-pointer"
              />

              <span className="text-xs font-mono text-slate-400 w-12 text-right">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Customizer Sidebar Controls */}
        <div className="lg:col-span-5 bg-[#0F1115] border border-white/10 rounded-xl p-4 space-y-5">
          {/* Customizer Navigation Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-[#07080A] p-1 rounded-lg border border-white/10 text-center text-xs">
            <button
              onClick={() => setActiveTab('ratio')}
              className={`py-2 rounded font-medium transition-all ${
                activeTab === 'ratio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ratio
            </button>
            <button
              onClick={() => setActiveTab('frame')}
              className={`py-2 rounded font-medium transition-all ${
                activeTab === 'frame' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Style
            </button>
            <button
              onClick={() => setActiveTab('captions')}
              className={`py-2 rounded font-medium transition-all ${
                activeTab === 'captions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Captions
            </button>
            <button
              onClick={() => setActiveTab('banner')}
              className={`py-2 rounded font-medium transition-all ${
                activeTab === 'banner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hook
            </button>
            <button
              onClick={() => setActiveTab('trim')}
              className={`py-2 rounded font-medium transition-all ${
                activeTab === 'trim' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trim
            </button>
          </div>

          {/* TAB 1: Aspect Ratio Selection */}
          {activeTab === 'ratio' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Social Aspect Ratio</span>
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: '9:16', label: '9:16 TikTok / Reels', sub: '1080x1920 Vertical', icon: Smartphone },
                  { id: '1:1', label: '1:1 IG Feed / LinkedIn', sub: '1080x1080 Square', icon: Square },
                  { id: '4:5', label: '4:5 Instagram Post', sub: '1080x1350 Portrait', icon: Square },
                  { id: '16:9', label: '16:9 YouTube / X', sub: '1920x1080 Landscape', icon: Monitor },
                  { id: '9:16-split', label: '9:16 Podcast Stack', sub: 'Split Top & Bottom', icon: Layout },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setCustomization({ ...customization, ratio: opt.id as SocialRatio })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      customization.ratio === opt.id
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-semibold'
                        : 'bg-[#07080A] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <opt.icon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{opt.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Frame & Reframing Styles */}
          {activeTab === 'frame' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-4 h-4 text-indigo-400" />
                <span>Auto-Reframing Mode</span>
              </label>

              <div className="space-y-2">
                {[
                  { id: 'blur-padding', label: 'Soft Blur Video Background', desc: 'Fits original video with blurred video padding' },
                  { id: 'auto-crop', label: 'Smart Speaker Center Crop', desc: 'Fills entire 9:16 canvas centered on speaker' },
                  { id: 'brand-backdrop', label: 'Dark Glass Brand Aura', desc: 'Modern dark gradient backdrop with subtle glow' },
                  { id: 'split-stack', label: 'Split Screen Podcast Stack', desc: 'Stacked view for interviews and podcasts' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setCustomization({ ...customization, frameStyle: st.id as FrameStyle })}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      customization.frameStyle === st.id
                        ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-semibold'
                        : 'bg-[#07080A] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium text-slate-200">{st.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{st.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Captions & Animated Subtitles */}
          {activeTab === 'captions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span>Animated Subtitles</span>
                </label>
                <input
                  type="checkbox"
                  checked={customization.showSubtitles}
                  onChange={(e) => setCustomization({ ...customization, showSubtitles: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {customization.showSubtitles && (
                <div className="space-y-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-400">Preset Style</span>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {[
                        { id: 'hormozi', label: '⚡ Hormozi Yellow Pop' },
                        { id: 'neon', label: '✨ TikTok Neon Stroke' },
                        { id: 'clean', label: '🖤 Clean Dark Pill' },
                        { id: 'minimal', label: 'Minimal Soft' },
                      ].map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setCustomization({ ...customization, subStyle: sub.id as SubStyle })}
                          className={`p-2 rounded-lg border text-xs text-left transition-all ${
                            customization.subStyle === sub.id
                              ? 'bg-indigo-600/20 border-indigo-500/80 text-white font-semibold'
                              : 'bg-[#07080A] border-white/10 text-slate-400'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-xs text-slate-400">Position</span>
                      <select
                        value={customization.subPosition}
                        onChange={(e) => setCustomization({ ...customization, subPosition: e.target.value as any })}
                        className="w-full mt-1 bg-[#07080A] border border-white/10 rounded-lg text-xs text-slate-200 p-2"
                      >
                        <option value="bottom">Bottom Third</option>
                        <option value="middle">Middle Center</option>
                        <option value="top">Top Third</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Highlight Color</span>
                      <div className="flex items-center gap-2 mt-1">
                        {['#FACC15', '#38BDF8', '#4ADE80', '#F43F5E', '#FFFFFF'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setCustomization({ ...customization, subHighlightColor: color })}
                            className={`w-6 h-6 rounded-full border border-white/20 ${
                              customization.subHighlightColor === color ? 'ring-2 ring-indigo-400 scale-110' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Viral Hook Banner */}
          {activeTab === 'banner' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Viral Hook Title Banner</span>
                </label>
                <input
                  type="checkbox"
                  checked={customization.showHookBanner}
                  onChange={(e) => setCustomization({ ...customization, showHookBanner: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>

              {customization.showHookBanner && (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-400">Banner Headline Text</span>
                    <input
                      type="text"
                      value={customization.hookText}
                      onChange={(e) => setCustomization({ ...customization, hookText: e.target.value })}
                      placeholder="e.g. DONT MAKE THIS MISTAKE 🚨"
                      className="w-full mt-1 bg-[#07080A] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Top Animated Progress Bar</span>
                      <input
                        type="checkbox"
                        checked={customization.showProgressBar}
                        onChange={(e) => setCustomization({ ...customization, showProgressBar: e.target.checked })}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-slate-400">Watermark / Brand Handle</span>
                      <input
                        type="text"
                        value={customization.watermarkText}
                        onChange={(e) => setCustomization({ ...customization, watermarkText: e.target.value })}
                        placeholder="e.g. autoclip.ai"
                        className="w-full mt-1 bg-[#07080A] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Timeline Precision Trimming */}
          {activeTab === 'trim' && (
            <div className="space-y-4">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-emerald-400" />
                <span>Trim Start & End Time</span>
              </label>

              <div className="space-y-3 bg-[#07080A] p-3 rounded-lg border border-white/10">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Start Cut</span>
                    <span className="font-mono text-indigo-400">{formatTimeMs(customization.trimStart)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={customization.trimEnd - 3}
                    step={0.5}
                    value={customization.trimStart}
                    onChange={(e) => setCustomization({ ...customization, trimStart: Number(e.target.value) })}
                    className="w-full accent-indigo-500 bg-[#0F1115] h-2 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>End Cut</span>
                    <span className="font-mono text-indigo-400">{formatTimeMs(customization.trimEnd)}</span>
                  </div>
                  <input
                    type="range"
                    min={customization.trimStart + 3}
                    max={project.duration || clip.endTime + 60}
                    step={0.5}
                    value={customization.trimEnd}
                    onChange={(e) => setCustomization({ ...customization, trimEnd: Number(e.target.value) })}
                    className="w-full accent-indigo-500 bg-[#0F1115] h-2 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="text-center text-xs text-slate-400 pt-1 font-mono">
                  Clip Duration: <span className="text-emerald-400 font-bold">{Math.round(duration)}s</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
