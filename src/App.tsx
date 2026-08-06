import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VideoUploader } from './components/VideoUploader';
import { ClipList } from './components/ClipList';
import { ClipStudio } from './components/ClipStudio';
import { ExportQueue } from './components/ExportQueue';
import { ExportModal } from './components/ExportModal';
import { ActivationModal } from './components/ActivationModal';
import { AdminKeyManager } from './components/AdminKeyManager';

import { ProjectVideo, VideoClip, ClipCustomization, RenderProgress, LicenseInfo } from './types';
import { exportClipToVideo } from './utils/exportVideo';
import { getStoredLicense } from './utils/license';
import { AlertCircle, Lock } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<ProjectVideo[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectVideo | null>(null);
  const [activeClip, setActiveClip] = useState<VideoClip | null>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'clips' | 'studio' | 'exports'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // License State & Modals
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage for active license on startup
    const stored = getStoredLicense();
    setLicense(stored);
  }, []);

  const isLicenseValid = license?.isValid && !license?.isExpired;

  // Helper to ensure license is active before restricted actions
  const requireActiveLicense = (): boolean => {
    if (!isLicenseValid) {
      setIsActivationModalOpen(true);
      return false;
    }
    return true;
  };

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
    if (!requireActiveLicense()) return;

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
    if (!requireActiveLicense()) return;
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
      // Create hidden video element with safety timeout for web & YouTube URLs
      const sourceVideo = await new Promise<HTMLVideoElement>((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;

        let isDone = false;
        const done = () => {
          if (!isDone) {
            isDone = true;
            resolve(video);
          }
        };

        video.onloadeddata = done;
        video.onloadedmetadata = done;
        video.onerror = done;

        // 1.5 second fallback timeout to prevent hanging on YouTube / web links
        setTimeout(done, 1500);

        video.src = currentProject.url;
        video.load();
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
        onOpenUpload={() => {
          if (requireActiveLicense()) {
            setActiveTab('upload');
          }
        }}
        isAnalyzing={isAnalyzing}
        license={license}
        onOpenActivation={() => setIsActivationModalOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
      />

      {/* Lockout Warning Banner if License Missing or Expired */}
      {!isLicenseValid && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 text-xs text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Activation Required:</strong>{' '}
              {license?.isExpired
                ? 'Your license key has expired. Please update your key to continue exporting and generating clips.'
                : 'Please enter your software activation key to unlock full video processing features.'}
            </span>
          </div>
          <button
            onClick={() => setIsActivationModalOpen(true)}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded text-xs transition-colors shrink-0"
          >
            Enter Key
          </button>
        </div>
      )}

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
            onOpenUpload={() => {
              if (requireActiveLicense()) setActiveTab('upload');
            }}
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
        setActiveTab={(tab) => {
          if ((tab === 'upload' || tab === 'exports') && !isLicenseValid) {
            setIsActivationModalOpen(true);
            return;
          }
          setActiveTab(tab);
        }}
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

      {/* Activation Key Modal */}
      <ActivationModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        currentLicense={license}
        onLicenseUpdated={(newLic) => setLicense(newLic)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        isLockout={!isLicenseValid}
      />

      {/* Owner Admin Key Portal */}
      <AdminKeyManager
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
      />
    </div>
  );
}

