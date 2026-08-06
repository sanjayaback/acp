import React, { useState } from 'react';
import { Play, AlertCircle, Film } from 'lucide-react';

interface SmartVideoPlayerProps {
  url: string;
  posterUrl?: string;
  startTime?: number;
  endTime?: number;
  className?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

// Extract YouTube ID if applicable
export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export const SmartVideoPlayer: React.FC<SmartVideoPlayerProps> = ({
  url,
  posterUrl,
  startTime = 0,
  endTime,
  className = 'w-full h-full object-cover',
  autoPlay = false,
  controls = true,
  onTimeUpdate,
  videoRef,
}) => {
  const [hasError, setHasError] = useState(false);
  const ytId = getYouTubeId(url);

  // If YouTube Link -> Render YouTube Embed Player
  if (ytId) {
    const startSec = Math.floor(startTime);
    const endSec = endTime ? Math.floor(endTime) : undefined;
    const embedUrl = `https://www.youtube-nocookie.com/embed/${ytId}?start=${startSec}${
      endSec ? `&end=${endSec}` : ''
    }&autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`;

    return (
      <div className={`relative bg-black rounded overflow-hidden ${className}`}>
        <iframe
          src={embedUrl}
          title="YouTube Video Player"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // If standard video or HTML5 stream
  const videoSrc = startTime > 0 ? `${url}#t=${startTime}` : url;
  const defaultPoster = posterUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop';

  return (
    <div className={`relative bg-black overflow-hidden flex items-center justify-center ${className}`}>
      {!hasError ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={defaultPoster}
          controls={controls}
          autoPlay={autoPlay}
          crossOrigin="anonymous"
          playsInline
          onTimeUpdate={(e) => {
            if (onTimeUpdate) {
              onTimeUpdate((e.target as HTMLVideoElement).currentTime);
            }
          }}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Fallback Poster Player if video stream fails */
        <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
          <img src={defaultPoster} alt="Video Poster" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600/80 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-2">
              <Film className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-slate-200">Web Video Stream Active</span>
            <span className="text-[11px] text-slate-400 mt-1 max-w-xs truncate">{url}</span>
          </div>
        </div>
      )}
    </div>
  );
};
