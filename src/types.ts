export type SocialRatio = '9:16' | '1:1' | '4:5' | '16:9' | '9:16-split';

export type PlatformType = 'tiktok' | 'reels' | 'youtube' | 'instagram' | 'linkedin' | 'twitter';

export type SubStyle = 'hormozi' | 'clean' | 'neon' | 'classic' | 'minimal';

export type FrameStyle = 'auto-crop' | 'blur-padding' | 'brand-backdrop' | 'split-stack';

export interface CaptionWord {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface VideoClip {
  id: string;
  title: string;
  hookSummary: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // in seconds
  viralScore: number; // 0 - 100
  suggestedRatio: SocialRatio;
  suggestedCaption: string;
  hashtags: string[];
  transcriptWords: CaptionWord[];
  category: 'hook' | 'insight' | 'story' | 'actionable' | 'funny';
  speakers: string[];
  status: 'ready' | 'processing' | 'exported';
  exportedUrl?: string;
}

export interface ProjectVideo {
  id: string;
  name: string;
  url: string;
  duration: number;
  sizeMb?: number;
  sourceType: 'file' | 'sample';
  thumbnailUrl?: string;
  clips: VideoClip[];
}

export interface ClipCustomization {
  ratio: SocialRatio;
  frameStyle: FrameStyle;
  subStyle: SubStyle;
  showSubtitles: boolean;
  subPosition: 'bottom' | 'middle' | 'top';
  subFontSize: number; // in px or scale
  subColor: string;
  subHighlightColor: string;
  showHookBanner: boolean;
  hookText: string;
  showProgressBar: boolean;
  watermarkText: string;
  trimStart: number;
  trimEnd: number;
}

export interface RenderProgress {
  isRendering: boolean;
  progress: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  statusText: string;
  outputBlobUrl?: string;
}

export type KeyDurationOption = '7d' | '30d' | '90d' | '365d' | 'lifetime';

export interface LicenseInfo {
  key: string;
  activatedAt: string;
  expiresAt: string | null; // null for lifetime
  isLifetime: boolean;
  planName: string;
  issuedTo?: string;
  isValid: boolean;
  isExpired: boolean;
  daysRemaining: number | null; // null for lifetime
}

export interface ActivationResult {
  success: boolean;
  message: string;
  license?: LicenseInfo;
}

