export interface VideoCandidate {
  element: HTMLVideoElement;
  visibleArea: number;
  renderedArea: number;
  isVisible: boolean;
  isPlaying: boolean;
}

export interface VideoDetectionSnapshot {
  activeVideo: HTMLVideoElement | null;
  candidates: VideoCandidate[];
  inaccessibleIframeCount: number;
}

interface CollectedVideos {
  candidates: VideoCandidate[];
  inaccessibleIframeCount: number;
}

function getRenderedArea(rect: DOMRect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function getVisibleArea(rect: DOMRect, viewportWidth: number, viewportHeight: number): number {
  const horizontal = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
  const vertical = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
  return horizontal * vertical;
}

function isElementVisible(video: HTMLVideoElement, ownerWindow: Window): boolean {
  const style = ownerWindow.getComputedStyle(video);
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    Number.parseFloat(style.opacity || '1') === 0
  ) {
    return false;
  }

  const rect = video.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function sortByArea(a: VideoCandidate, b: VideoCandidate): number {
  if (b.visibleArea !== a.visibleArea) {
    return b.visibleArea - a.visibleArea;
  }
  return b.renderedArea - a.renderedArea;
}

function pickActiveVideo(candidates: VideoCandidate[]): HTMLVideoElement | null {
  const playingVisible = candidates.filter((candidate) => candidate.isPlaying && candidate.isVisible);
  if (playingVisible.length > 0) {
    playingVisible.sort(sortByArea);
    return playingVisible[0]?.element ?? null;
  }

  const visible = candidates.filter((candidate) => candidate.isVisible);
  if (visible.length > 0) {
    visible.sort(sortByArea);
    return visible[0]?.element ?? null;
  }

  const playing = candidates.filter((candidate) => candidate.isPlaying);
  if (playing.length > 0) {
    playing.sort(sortByArea);
    return playing[0]?.element ?? null;
  }

  if (candidates.length === 0) {
    return null;
  }

  const sorted = [...candidates].sort(sortByArea);
  return sorted[0]?.element ?? null;
}

function collectVideosFromDocument(
  doc: Document,
  depth: number,
  maxDepth: number,
): CollectedVideos {
  const ownerWindow = doc.defaultView;
  if (!ownerWindow) {
    return { candidates: [], inaccessibleIframeCount: 0 };
  }

  const candidates: VideoCandidate[] = [];

  for (const video of Array.from(doc.querySelectorAll('video'))) {
    try {
      const rect = video.getBoundingClientRect();
      const renderedArea = getRenderedArea(rect);
      const visibleArea = getVisibleArea(rect, ownerWindow.innerWidth, ownerWindow.innerHeight);
      const isVisible = isElementVisible(video, ownerWindow) && visibleArea > 0;
      const isPlaying = !video.paused && !video.ended;
      candidates.push({
        element: video,
        visibleArea,
        renderedArea,
        isVisible,
        isPlaying,
      });
    } catch {
      continue;
    }
  }

  let inaccessibleIframeCount = 0;

  if (depth < maxDepth) {
    const iframes = Array.from(doc.querySelectorAll('iframe'));
    for (const iframe of iframes) {
      try {
        const iframeDocument = iframe.contentDocument;
        if (!iframeDocument) {
          inaccessibleIframeCount += 1;
          continue;
        }

        const child = collectVideosFromDocument(iframeDocument, depth + 1, maxDepth);
        candidates.push(...child.candidates);
        inaccessibleIframeCount += child.inaccessibleIframeCount;
      } catch {
        inaccessibleIframeCount += 1;
      }
    }
  }

  return { candidates, inaccessibleIframeCount };
}

function installRouteChangeListener(callback: () => void): () => void {
  const historyRef = window.history;
  const originalPushState = historyRef.pushState;
  const originalReplaceState = historyRef.replaceState;

  const wrappedPushState: typeof history.pushState = function pushState(
    this: History,
    ...args: Parameters<History['pushState']>
  ) {
    originalPushState.apply(this, args);
    callback();
  };

  const wrappedReplaceState: typeof history.replaceState = function replaceState(
    this: History,
    ...args: Parameters<History['replaceState']>
  ) {
    originalReplaceState.apply(this, args);
    callback();
  };

  historyRef.pushState = wrappedPushState;
  historyRef.replaceState = wrappedReplaceState;

  window.addEventListener('popstate', callback);
  window.addEventListener('hashchange', callback);
  window.addEventListener('yt-navigate-finish', callback as EventListener);

  return () => {
    historyRef.pushState = originalPushState;
    historyRef.replaceState = originalReplaceState;
    window.removeEventListener('popstate', callback);
    window.removeEventListener('hashchange', callback);
    window.removeEventListener('yt-navigate-finish', callback as EventListener);
  };
}

export class VideoDetector {
  private readonly maxIframeDepth: number;

  private observer: MutationObserver | null = null;

  private cleanupRouteListener: (() => void) | null = null;

  private dirty = true;

  private snapshot: VideoDetectionSnapshot = {
    activeVideo: null,
    candidates: [],
    inaccessibleIframeCount: 0,
  };

  constructor(maxIframeDepth = 2) {
    this.maxIframeDepth = maxIframeDepth;
  }

  start(): void {
    this.stop();

    const root = document.documentElement;
    if (root) {
      this.observer = new MutationObserver(() => {
        this.dirty = true;
      });
      this.observer.observe(root, {
        childList: true,
        subtree: true,
      });
    }

    this.cleanupRouteListener = installRouteChangeListener(() => {
      this.dirty = true;
    });

    window.addEventListener('resize', this.markDirty);
    document.addEventListener('visibilitychange', this.markDirty);

    this.dirty = true;
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;

    if (this.cleanupRouteListener) {
      this.cleanupRouteListener();
      this.cleanupRouteListener = null;
    }

    window.removeEventListener('resize', this.markDirty);
    document.removeEventListener('visibilitychange', this.markDirty);
  }

  getSnapshot(forceRefresh = false): VideoDetectionSnapshot {
    if (forceRefresh || this.dirty) {
      const collected = collectVideosFromDocument(document, 0, this.maxIframeDepth);
      this.snapshot = {
        candidates: collected.candidates,
        activeVideo: pickActiveVideo(collected.candidates),
        inaccessibleIframeCount: collected.inaccessibleIframeCount,
      };
      this.dirty = false;
    }

    return this.snapshot;
  }

  private readonly markDirty = (): void => {
    this.dirty = true;
  };
}
