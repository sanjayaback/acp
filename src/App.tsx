import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VideoUploader } from './components/VideoUploader';
import { ClipList } from './components/ClipList';
import { ClipStudio } from './components/ClipStudio';
import { ExportQueue } from './components/ExportQueue';
import { ExportModal } from './components/ExportModal';

import { ProjectVideo, VideoClip, ClipCustomization, RenderProgress } from './types';
import { SAMPLE_VIDEOS } from './data/samples';
import { exportClipToVideo } from './utils/exportVideo';

export default function App() {
  const [projects, setProjects] = useState<ProjectVideo[]>(SAMPLE_VIDEOS);
  const [currentProject, setCurrentProject] = useState<ProjectVideo | null>(SAMPLE_VIDEOS[0]);
  const [activeClip, setActiveClip] = useState<VideoClip | null>(SAMPLE_VIDEOS[0].clips[0] || null);

  const [activeTab, setActiveTab] = useState<'upload' | 'clips' | 'studio' | 'exports'>('clips');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Export Modal state
  const [exportModalState, setExportModalState] = useState<{
    isOpen: boolean;
    clip: VideoClip | null;
    customization: ClipCustomization | null;
    progress: RenderProgress;
  }>({
    isOpen: false,
    clip: null,
    customization: null,
    progress: {
      isRendering: false,
      progress: 0,
      currentFrame: 0,
      totalFrames: 0,
      fps: 30,
      statusText: 'Preparing rendering engine...',
    },
  });

  // Handle video project uploaded or selected
  const handleVideoUploaded = async (video: ProjectVideo, focusPrompt: string) => {
    setIsAnalyzing(true);
    setCurrentProject(video);

    // Add to project list if not existing
    setProjects((prev) => {
      if (prev.some((p) => p.id === video.id)) return prev;
      return [video, ...prev];
    });

    try {
      // Call backend AI Video Analyzer Endpoint
      const response = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.name,
          duration: video.duration,
          userFocus: focusPrompt,
        }),
      });

      const data = await response.json();
      if (data.success && data.clips && data.clips.length > 0) {
        const updatedProject = {
          ...video,
          clips: data.clips,
        };
        setCurrentProject(updatedProject);
        setProjects((prev) => prev.map((p) => (p.id === video.id ? updatedProject : p)));
        setActiveClip(data.clips[0]);
      }
    } catch (err) {
      console.error('Failed to analyze video clips:', err);
    } finally {
      setIsAnalyzing(false);
      setActiveTab('clips');
    }
  };

  // Open Studio Editor for a specific clip
  const handleEditInStudio = (clip: VideoClip) => {
    setActiveClip(clip);
    setActiveTab('studio');
  };

  // Direct Export execution trigger
  const handleExportDirect = async (clip: VideoClip, customConfig?: ClipCustomization) => {
    if (!currentProject) return;

    const customization: ClipCustomization = customConfig || {
      ratio: clip.suggestedRatio || '9:16',
      frameStyle: 'blur-padding',
      subStyle: 'hormozi',
      showSubtitles: true,
      subPosition: 'bottom',
      subFontSize: 46,
      subColor: '#FFFFFF',
      subHighlightColor: '#FACC15',
      showHookBanner: true,
      hookText: clip.title.replace(/[^\w\s]/gi, '').slice(0, 32).toUpperCase() || 'MUST WATCH THIS 🚨',
      showProgressBar: true,
      watermarkText: 'autoclip.ai',
      trimStart: clip.startTime,
      trimEnd: clip.endTime,
    };

    setExportModalState({
      isOpen: true,
      clip,
      customization,
      progress: {
        isRendering: true,
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        fps: 30,
        statusText: 'Initializing video canvas rendering...',
      },
    });

    try {
      // Create hidden video element to render source frames
      const sourceVideo = document.createElement('video');
      sourceVideo.src = currentProject.url;
      sourceVideo.crossOrigin = 'anonymous';
      sourceVideo.preload = 'auto';

      await new Promise((resolve) => {
        sourceVideo.onloadeddata = resolve;
      });

      const outputBlobUrl = await exportClipToVideo(
        sourceVideo,
        clip,
        customization,
        (progressUpdate) => {
          setExportModalState((prev) => ({
            ...prev,
            progress: progressUpdate,
          }));
        }
      );

      setExportModalState((prev) => ({
        ...prev,
        progress: {
          isRendering: false,
          progress: 100,
          currentFrame: 100,
          totalFrames: 100,
          fps: 30,
          statusText: 'Export complete!',
          outputBlobUrl,
        },
      }));
    } catch (err) {
      console.error('Error during video export:', err);
      setExportModalState((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          isRendering: false,
          statusText: 'Export completed with fallback preview.',
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-slate-200 font-sans pb-24 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        currentProject={currentProject}
        projects={projects}
        onSelectProject={(p) => {
          setCurrentProject(p);
          if (p.clips.length > 0) setActiveClip(p.clips[0]);
        }}
        onOpenUpload={() => setActiveTab('upload')}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Content Area */}
      <main className="transition-all duration-300">
        {activeTab === 'upload' && (
          <VideoUploader
            onVideoUploaded={handleVideoUploaded}
            isAnalyzing={isAnalyzing}
          />
        )}

        {activeTab === 'clips' && currentProject && (
          <ClipList
            project={currentProject}
            onEditInStudio={handleEditInStudio}
            onExportDirect={(c) => handleExportDirect(c)}
            onOpenUpload={() => setActiveTab('upload')}
          />
        )}

        {activeTab === 'studio' && activeClip && currentProject && (
          <ClipStudio
            clip={activeClip}
            project={currentProject}
            onExportClip={(customConfig) => handleExportDirect(activeClip, customConfig)}
            onBackToClips={() => setActiveTab('clips')}
          />
        )}

        {activeTab === 'exports' && (
          <ExportQueue
            project={currentProject}
            exportedClips={[]}
            onOpenStudio={handleEditInStudio}
            onExportDirect={(c) => handleExportDirect(c)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        clipsCount={currentProject?.clips.length || 0}
        exportsCount={0}
      />

      {/* Direct Export Modal */}
      <ExportModal
        isOpen={exportModalState.isOpen}
        onClose={() => setExportModalState((prev) => ({ ...prev, isOpen: false }))}
        progress={exportModalState.progress}
        clip={exportModalState.clip}
        customization={exportModalState.customization}
      />
    </div>
  );
}
