import { ClipCustomization, VideoClip, RenderProgress } from '../types';

export function getRatioDimensions(ratio: string): { width: number; height: number } {
  switch (ratio) {
    case '9:16':
    case '9:16-split':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '4:5':
      return { width: 1080, height: 1350 };
    case '16:9':
      return { width: 1920, height: 1080 };
    default:
      return { width: 1080, height: 1920 };
  }
}

/**
 * Render and export final clip as downloadable video file using Canvas + MediaRecorder API
 */
export async function exportClipToVideo(
  sourceVideo: HTMLVideoElement,
  clip: VideoClip,
  customization: ClipCustomization,
  onProgress: (progress: RenderProgress) => void
): Promise<string> {
  const { width, height } = getRatioDimensions(customization.ratio);
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  const duration = customization.trimEnd - customization.trimStart;
  const startSec = customization.trimStart;
  const endSec = customization.trimEnd;

  // Set video audio routing
  let audioStream: MediaStream | null = null;
  try {
    // @ts-ignore
    if (typeof sourceVideo.captureStream === 'function') {
      // @ts-ignore
      audioStream = sourceVideo.captureStream();
    } else if (typeof (sourceVideo as any).mozCaptureStream === 'function') {
      audioStream = (sourceVideo as any).mozCaptureStream();
    }
  } catch (e) {
    console.warn('Audio captureStream not directly available, video will render video tracks.', e);
  }

  const canvasStream = canvas.captureStream(30); // 30 FPS
  
  if (audioStream && audioStream.getAudioTracks().length > 0) {
    audioStream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });
  }

  // Determine standard mime type
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 6000000, // 6 Mbps high quality
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    mediaRecorder.onerror = (e) => {
      reject(e);
    };

    // Prepare video element playback
    sourceVideo.pause();
    sourceVideo.currentTime = startSec;
    sourceVideo.muted = false;

    let isCancelled = false;

    sourceVideo.onseeked = () => {
      if (isCancelled) return;
      
      mediaRecorder.start(100);
      sourceVideo.play().catch(console.error);

      const renderLoop = () => {
        if (sourceVideo.paused || sourceVideo.ended || sourceVideo.currentTime >= endSec) {
          sourceVideo.pause();
          mediaRecorder.stop();
          onProgress({
            isRendering: false,
            progress: 100,
            currentFrame: Math.round(duration * 30),
            totalFrames: Math.round(duration * 30),
            fps: 30,
            statusText: 'Rendering complete!',
          });
          return;
        }

        const currentTime = sourceVideo.currentTime;
        const currentRelTime = currentTime - startSec;
        const progressPct = Math.min(99, Math.max(0, (currentRelTime / duration) * 100));

        // Render Frame
        drawCanvasFrame(ctx, sourceVideo, width, height, currentTime, startSec, duration, clip, customization);

        onProgress({
          isRendering: true,
          progress: Math.round(progressPct),
          currentFrame: Math.round(currentRelTime * 30),
          totalFrames: Math.round(duration * 30),
          fps: 30,
          statusText: `Encoding frames... ${Math.round(progressPct)}%`,
        });

        requestAnimationFrame(renderLoop);
      };

      requestAnimationFrame(renderLoop);
    };
  });
}

/**
 * Draw a single frame to canvas with reframing, background blur, subtitles, hook banners
 */
export function drawCanvasFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  currentTime: number,
  startSec: number,
  duration: number,
  clip: VideoClip,
  customization: ClipCustomization
) {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Background & Frame Style
  const frameStyle = customization.frameStyle;
  const vidWidth = video.videoWidth || 1920;
  const vidHeight = video.videoHeight || 1080;
  const vidAspect = vidWidth / vidHeight;
  const canvasAspect = width / height;

  // Safe drawImage helper with CORS and video state error handling
  const safeDrawImage = (
    v: HTMLVideoElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    try {
      if (v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
        ctx.drawImage(v, dx, dy, dw, dh);
      } else {
        // Draw elegant gradient video container
        const fillGrad = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
        fillGrad.addColorStop(0, '#1E1B4B');
        fillGrad.addColorStop(1, '#0F172A');
        ctx.fillStyle = fillGrad;
        ctx.fillRect(dx, dy, dw, dh);
      }
    } catch (e) {
      const fillGrad = ctx.createLinearGradient(dx, dy, dx + dw, dy + dh);
      fillGrad.addColorStop(0, '#1E1B4B');
      fillGrad.addColorStop(1, '#0F172A');
      ctx.fillStyle = fillGrad;
      ctx.fillRect(dx, dy, dw, dh);
    }
  };

  if (frameStyle === 'blur-padding') {
    // Fill background with blurred scaled video
    ctx.save();
    ctx.filter = 'blur(30px) brightness(0.55)';
    safeDrawImage(video, -50, -50, width + 100, height + 100);
    ctx.restore();

    // Draw main video centered inside
    let drawW = width;
    let drawH = width / vidAspect;
    if (drawH > height * 0.85) {
      drawH = height * 0.85;
      drawW = drawH * vidAspect;
    }
    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    // Subtle drop shadow around main video card
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 30;
    safeDrawImage(video, drawX, drawY, drawW, drawH);
    ctx.restore();

  } else if (frameStyle === 'brand-backdrop') {
    // Elegant radial dark gradient + glowing ambient orb
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E1B4B');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glowing subtle aura
    const aura = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width * 0.8);
    aura.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    let drawW = width * 0.92;
    let drawH = drawW / vidAspect;
    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
    ctx.shadowBlur = 40;
    // Rounded border around video
    roundRectPath(ctx, drawX, drawY, drawW, drawH, 24);
    ctx.clip();
    safeDrawImage(video, drawX, drawY, drawW, drawH);
    ctx.restore();

  } else if (frameStyle === 'split-stack') {
    // Stacked podcast top & bottom
    const halfH = height / 2;
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, width, height);

    // Top half
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, halfH - 4);
    ctx.clip();
    safeDrawImage(video, -width * 0.1, 0, width * 1.2, halfH);
    ctx.restore();

    // Bottom half mirrored/flipped view
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, halfH + 4, width, halfH);
    ctx.clip();
    safeDrawImage(video, 0, halfH, width, halfH);
    ctx.restore();

    // Divider line
    ctx.fillStyle = '#6366F1';
    ctx.fillRect(0, halfH - 3, width, 6);

  } else {
    // 'auto-crop' (Default smart center fill)
    safeDrawImage(video, 0, 0, width, height);
  }

  // 2. Top Viral Hook Banner Overlay
  if (customization.showHookBanner && customization.hookText) {
    drawHookBanner(ctx, customization.hookText, width, height);
  }

  // 3. Animated Subtitles Overlay
  if (customization.showSubtitles) {
    drawAnimatedSubtitles(ctx, currentTime, clip, customization, width, height);
  }

  // 4. Top Animated Progress Bar
  if (customization.showProgressBar) {
    const elapsed = Math.max(0, currentTime - startSec);
    const pct = Math.min(1, elapsed / duration);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, width, 12);

    const grad = ctx.createLinearGradient(0, 0, width * pct, 0);
    grad.addColorStop(0, '#EC4899'); // Pink
    grad.addColorStop(1, '#F59E0B'); // Yellow/Gold
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width * pct, 12);
  }

  // 5. Watermark / Brand Tag
  if (customization.watermarkText) {
    ctx.font = 'bold 24px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`@${customization.watermarkText.replace(/^@/, '')}`, width - 32, height - 36);
  }
}

/**
 * Draw top viral hook banner badge
 */
function drawHookBanner(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
  ctx.save();
  const bannerY = height * 0.08;
  const paddingX = 36;
  const paddingY = 20;

  ctx.font = '900 36px Plus Jakarta Sans, Arial Black, sans-serif';
  const textMetrics = ctx.measureText(text.toUpperCase());
  const boxW = Math.min(width - 60, textMetrics.width + paddingX * 2);
  const boxH = 72;
  const boxX = (width - boxW) / 2;

  // Background pill
  const grad = ctx.createLinearGradient(boxX, bannerY, boxX + boxW, bannerY + boxH);
  grad.addColorStop(0, '#FACC15'); // Yellow
  grad.addColorStop(1, '#FB923C'); // Orange

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;

  roundRectPath(ctx, boxX, bannerY, boxW, boxH, 20);
  ctx.fillStyle = grad;
  ctx.fill();

  // Dark text
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#090D16';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), width / 2, bannerY + boxH / 2 + 2);

  ctx.restore();
}

/**
 * Draw live animated karaoke subtitles on canvas
 */
function drawAnimatedSubtitles(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  clip: VideoClip,
  customization: ClipCustomization,
  width: number,
  height: number
) {
  const words = clip.transcriptWords;
  if (!words || words.length === 0) return;

  // Find active word
  let activeIndex = words.findIndex(w => currentTime >= w.start && currentTime <= w.end);
  if (activeIndex === -1) {
    // Find closest word if in gap
    activeIndex = words.findIndex(w => currentTime < w.start);
    if (activeIndex > 0) activeIndex -= 1;
    else if (activeIndex === -1 && words.length > 0) activeIndex = words.length - 1;
  }

  // Window of 4-6 words around active word
  const windowSize = 5;
  const startIdx = Math.max(0, activeIndex - 2);
  const endIdx = Math.min(words.length, startIdx + windowSize);
  const displaySlice = words.slice(startIdx, endIdx);

  if (displaySlice.length === 0) return;

  let posY = height * 0.78;
  if (customization.subPosition === 'top') posY = height * 0.22;
  if (customization.subPosition === 'middle') posY = height * 0.50;

  ctx.save();

  // Subtitle Style Presets
  const fontSize = customization.subFontSize || 48;
  const fontStyle = '900 ' + fontSize + 'px Plus Jakarta Sans, Arial Black, sans-serif';
  ctx.font = fontStyle;

  // Calculate widths for word highlight background or text
  const totalText = displaySlice.map(w => w.word).join(' ');
  const totalMetrics = ctx.measureText(totalText);

  // Draw background pill for 'clean' or 'minimal'
  if (customization.subStyle === 'clean' || customization.subStyle === 'minimal') {
    const boxW = totalMetrics.width + 48;
    const boxH = fontSize + 32;
    const boxX = (width - boxW) / 2;

    ctx.fillStyle = customization.subStyle === 'clean' ? 'rgba(9, 13, 22, 0.85)' : 'rgba(0, 0, 0, 0.65)';
    roundRectPath(ctx, boxX, posY - boxH / 2, boxW, boxH, 16);
    ctx.fill();
  }

  // Measure each word
  let currentX = (width - totalMetrics.width) / 2;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  displaySlice.forEach((item) => {
    const isHighlighted = currentTime >= item.start && currentTime <= item.end;
    const wordStr = item.word + ' ';
    const wordWidth = ctx.measureText(wordStr).width;

    ctx.save();

    if (isHighlighted) {
      // Zoom / Pop effect for active word in Hormozi / Neon style
      if (customization.subStyle === 'hormozi' || customization.subStyle === 'neon') {
        ctx.shadowColor = customization.subHighlightColor || '#FACC15';
        ctx.shadowBlur = 24;
      }

      ctx.fillStyle = customization.subHighlightColor || '#FACC15';

      if (customization.subStyle === 'neon') {
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(item.word, currentX, posY);
      }

      ctx.fillText(item.word, currentX, posY);

    } else {
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = customization.subColor || '#FFFFFF';

      if (customization.subStyle === 'hormozi' || customization.subStyle === 'neon') {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';
        ctx.strokeText(item.word, currentX, posY);
      }

      ctx.fillText(item.word, currentX, posY);
    }

    ctx.restore();
    currentX += wordWidth;
  });

  ctx.restore();
}

/**
 * Helper to draw rounded rectangle paths
 */
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Export SRT subtitle file format for the clip
 */
export function exportToSRT(clip: VideoClip): string {
  const words = clip.transcriptWords;
  if (!words || words.length === 0) {
    return '1\n00:00:00,000 --> 00:00:10,000\n' + clip.title + '\n\n';
  }

  // Group into lines of 4-6 words
  const lineSize = 5;
  const srtEntries: string[] = [];
  let index = 1;

  for (let i = 0; i < words.length; i += lineSize) {
    const chunk = words.slice(i, i + lineSize);
    const startSec = chunk[0].start - clip.startTime;
    const endSec = chunk[chunk.length - 1].end - clip.startTime;

    const startSRT = formatSRTTime(Math.max(0, startSec));
    const endSRT = formatSRTTime(Math.max(0.5, endSec));
    const text = chunk.map(c => c.word).join(' ');

    srtEntries.push(`${index}\n${startSRT} --> ${endSRT}\n${text}\n`);
    index++;
  }

  return srtEntries.join('\n');
}

function formatSRTTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const hStr = String(hrs).padStart(2, '0');
  const mStr = String(mins).padStart(2, '0');
  const sStr = String(secs).padStart(2, '0');
  const msStr = String(ms).padStart(3, '0');

  return `${hStr}:${mStr}:${sStr},${msStr}`;
}
