import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'cliapp-build',
      },
    },
  });
}

function generateFallbackClips(title: string, duration: number, focus: string) {
  const videoName = title && title.trim() ? title.trim() : 'Video Highlight';
  const numClips = Math.min(5, Math.max(3, Math.floor(duration / 90)));
  const interval = duration / (numClips + 1);

  const categories = [
    { cat: 'hook', prefix: '🔥 Viral Hook', icon: '🚨', score: 98 },
    { cat: 'actionable', prefix: '⚡ Core Takeaway', icon: '⚡', score: 95 },
    { cat: 'insight', prefix: '💡 High Impact Moment', icon: '💡', score: 92 },
    { cat: 'story', prefix: '🎯 Best Highlight', icon: '🎯', score: 89 },
    { cat: 'funny', prefix: '✨ Key Segment', icon: '✨', score: 87 },
  ];

  return Array.from({ length: numClips }).map((_, i) => {
    const c = categories[i % categories.length];
    const start = Math.floor((i + 1) * interval - 10);
    const clipDur = 30;
    const end = Math.min(duration, Math.max(start + 15, start + clipDur));

    const clipTitle = `${c.prefix} - ${videoName.slice(0, 30)} ${c.icon}`;
    const clipSummary = `Key segment extracted focusing on ${focus || 'viral moments'}.`;
    const clipCaption = `Must-watch moment from "${videoName}"! 🔥 #ViralClips #Reels #TikTok #Shorts`;
    const clipTags = ['#Viral', '#Shorts', '#Reels', '#TikTok', '#Trending'];

    const words = clipCaption.split(/\s+/).map((w, wIdx, arr) => ({
      word: w,
      start: Number((start + (wIdx * clipDur) / arr.length).toFixed(1)),
      end: Number((start + ((wIdx + 1) * clipDur) / arr.length).toFixed(1)),
    }));

    return {
      id: `clip-${Date.now()}-${i}`,
      title: clipTitle,
      hookSummary: clipSummary,
      startTime: Math.max(0, start),
      endTime: end,
      duration: end - start,
      viralScore: c.score,
      suggestedRatio: '9:16',
      suggestedCaption: clipCaption,
      hashtags: clipTags,
      transcriptWords: words,
      category: c.cat,
      speakers: ['Speaker 1'],
      status: 'ready',
    };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, duration, userFocus, customTranscript } = req.body || {};
    const ai = getGeminiClient();

    const videoTitle = title || 'Long Form Video';
    const totalSecs = Number(duration) || 600;
    const focus = userFocus || 'Most Viral & Engaging Moments';

    if (!ai) {
      return res.status(200).json({
        success: true,
        source: 'fallback',
        clips: generateFallbackClips(videoTitle, totalSecs, focus),
      });
    }

    const systemPrompt = `You are an elite short-form video editor and viral growth strategist for TikTok, Instagram Reels, and YouTube Shorts.
Your goal is to analyze long-form video details and extract 3 to 5 high-performing viral video clips.
For each clip:
1. Provide a compelling viral hook title with emojis.
2. Provide precise start time (seconds) and end time (seconds) with duration between 15s and 50s.
3. Provide a Viral Potential Score from 80 to 99.
4. Provide a recommended social ratio ('9:16' for vertical Reels/TikTok, '1:1' for Instagram/LinkedIn, '16:9' for YouTube).
5. Provide a captivating caption for social media with emojis and hashtags.
6. Provide simulated word-level transcript timestamps for animated karaoke subtitles.
7. Categorize as 'hook', 'insight', 'story', 'actionable', or 'funny'.`;

    const userPrompt = `Video Title: "${videoTitle}"
Total Video Duration: ${totalSecs} seconds (${Math.floor(totalSecs / 60)} minutes)
Target Focus: ${focus}
${customTranscript ? `Transcript Snippet: "${customTranscript.slice(0, 1500)}"` : ''}

Generate 3-5 distinct viral clips across the timeline of this video.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hookSummary: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  viralScore: { type: Type.NUMBER },
                  suggestedRatio: { type: Type.STRING },
                  suggestedCaption: { type: Type.STRING },
                  hashtags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  category: { type: Type.STRING },
                  speakers: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  transcriptText: { type: Type.STRING },
                },
                required: ['title', 'startTime', 'endTime', 'viralScore', 'suggestedRatio', 'suggestedCaption'],
              },
            },
          },
          required: ['clips'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);

    if (parsedData.clips && Array.isArray(parsedData.clips) && parsedData.clips.length > 0) {
      const enrichedClips = parsedData.clips.map((item: any, idx: number) => {
        const start = Math.max(0, Math.min(item.startTime || idx * 40, totalSecs - 15));
        const end = Math.min(totalSecs, Math.max(start + 15, item.endTime || start + 35));
        const durationSecs = Math.round(end - start);

        const words = (item.transcriptText || item.hookSummary || 'Check out this epic highlight clip!')
          .split(/\s+/)
          .map((w: string, i: number, arr: any[]) => {
            const step = durationSecs / arr.length;
            return {
              word: w,
              start: Number((start + i * step).toFixed(1)),
              end: Number((start + (i + 1) * step).toFixed(1)),
            };
          });

        return {
          id: `ai-clip-${Date.now()}-${idx}`,
          title: item.title || `Viral Highlight #${idx + 1}`,
          hookSummary: item.hookSummary || 'High-impact key moment extracted by AI.',
          startTime: start,
          endTime: end,
          duration: durationSecs,
          viralScore: item.viralScore || Math.floor(Math.random() * 15 + 84),
          suggestedRatio: (item.suggestedRatio === '1:1' || item.suggestedRatio === '16:9') ? item.suggestedRatio : '9:16',
          suggestedCaption: item.suggestedCaption || `Must-watch moment from ${videoTitle}! 🔥`,
          hashtags: item.hashtags && item.hashtags.length > 0 ? item.hashtags : ['#Viral', '#Shorts', '#Reels', '#TikTok'],
          transcriptWords: words,
          category: item.category || 'hook',
          speakers: item.speakers || ['Speaker 1'],
          status: 'ready',
        };
      });

      return res.status(200).json({
        success: true,
        source: 'gemini',
        clips: enrichedClips,
      });
    }

    return res.status(200).json({
      success: true,
      source: 'fallback',
      clips: generateFallbackClips(videoTitle, totalSecs, focus),
    });
  } catch (err: any) {
    console.error('Error in Vercel api/analyze-video:', err);
    return res.status(200).json({
      success: true,
      source: 'fallback-error',
      clips: generateFallbackClips(req.body?.title || 'Video', req.body?.duration || 600, req.body?.userFocus || 'Viral'),
    });
  }
}
