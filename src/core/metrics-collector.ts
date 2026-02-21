import type { UniversalVideoMetrics } from '@/src/shared/types';

interface FrameQualitySnapshot {
  droppedFrames: number | null;
  totalFrames: number | null;
}

interface FpsEstimatorState {
  lastTotalFrames: number | null;
  lastTime: number;
  smoothedFps: number | null;
  rvfcFps: number | null;
  rvfcFrameCount: number;
  rvfcWindowStart: number;
  rvfcLoopRunning: boolean;
}

function getBufferAheadSeconds(video: HTMLVideoElement): number | null {
  const { buffered, currentTime } = video;
  if (buffered.length === 0) {
    return 0;
  }

  for (let index = 0; index < buffered.length; index += 1) {
    const start = buffered.start(index);
    const end = buffered.end(index);

    if (currentTime >= start && currentTime <= end) {
      return Math.max(0, end - currentTime);
    }

    if (currentTime < start) {
      return Math.max(0, start - currentTime);
    }
  }

  return 0;
}

function readFrameQuality(video: HTMLVideoElement): FrameQualitySnapshot {
  const withPlaybackQuality = video as HTMLVideoElement & {
    getVideoPlaybackQuality?: () => {
      droppedVideoFrames: number;
      totalVideoFrames: number;
    };
    webkitDroppedFrameCount?: number;
    webkitDecodedFrameCount?: number;
  };

  try {
    if (typeof withPlaybackQuality.getVideoPlaybackQuality === 'function') {
      const quality = withPlaybackQuality.getVideoPlaybackQuality();
      return {
        droppedFrames: Number.isFinite(quality.droppedVideoFrames)
          ? quality.droppedVideoFrames
          : null,
        totalFrames: Number.isFinite(quality.totalVideoFrames) ? quality.totalVideoFrames : null,
      };
    }
  } catch {
    // Ignore and fall back to vendor-prefixed properties.
  }

  const droppedFrames =
    typeof withPlaybackQuality.webkitDroppedFrameCount === 'number'
      ? withPlaybackQuality.webkitDroppedFrameCount
      : null;
  const totalFrames =
    typeof withPlaybackQuality.webkitDecodedFrameCount === 'number'
      ? withPlaybackQuality.webkitDecodedFrameCount
      : null;

  return { droppedFrames, totalFrames };
}

class FpsEstimator {
  private readonly stateByVideo = new WeakMap<HTMLVideoElement, FpsEstimatorState>();

  estimate(video: HTMLVideoElement, totalFrames: number | null): number | null {
    const now = performance.now();
    const state = this.getOrCreateState(video, now);

    let estimatedFps: number | null = null;

    if (
      totalFrames !== null &&
      state.lastTotalFrames !== null &&
      now > state.lastTime &&
      totalFrames >= state.lastTotalFrames
    ) {
      const frameDelta = totalFrames - state.lastTotalFrames;
      const timeDeltaSeconds = (now - state.lastTime) / 1000;
      if (timeDeltaSeconds > 0) {
        estimatedFps = frameDelta / timeDeltaSeconds;
      }
    }

    if ((estimatedFps === null || estimatedFps <= 0) && state.rvfcFps !== null) {
      estimatedFps = state.rvfcFps;
    }

    state.lastTotalFrames = totalFrames;
    state.lastTime = now;

    if (estimatedFps !== null && Number.isFinite(estimatedFps) && estimatedFps > 0) {
      const smoothed =
        state.smoothedFps === null ? estimatedFps : state.smoothedFps * 0.72 + estimatedFps * 0.28;
      state.smoothedFps = smoothed;
      return smoothed;
    }

    return state.smoothedFps;
  }

  private getOrCreateState(video: HTMLVideoElement, now: number): FpsEstimatorState {
    const existing = this.stateByVideo.get(video);
    if (existing) {
      if (!existing.rvfcLoopRunning) {
        this.startRvfcLoop(video, existing);
      }
      return existing;
    }

    const created: FpsEstimatorState = {
      lastTotalFrames: null,
      lastTime: now,
      smoothedFps: null,
      rvfcFps: null,
      rvfcFrameCount: 0,
      rvfcWindowStart: now,
      rvfcLoopRunning: false,
    };

    this.stateByVideo.set(video, created);
    this.startRvfcLoop(video, created);
    return created;
  }

  private startRvfcLoop(video: HTMLVideoElement, state: FpsEstimatorState): void {
    const withRvfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (
        callback: (now: DOMHighResTimeStamp, metadata: VideoFrameCallbackMetadata) => void,
      ) => number;
    };

    if (typeof withRvfc.requestVideoFrameCallback !== 'function' || state.rvfcLoopRunning) {
      return;
    }

    state.rvfcLoopRunning = true;

    const scheduleNext = () => {
      withRvfc.requestVideoFrameCallback?.((now) => {
        state.rvfcFrameCount += 1;

        const elapsed = now - state.rvfcWindowStart;
        if (elapsed >= 500) {
          state.rvfcFps = (state.rvfcFrameCount * 1000) / elapsed;
          state.rvfcFrameCount = 0;
          state.rvfcWindowStart = now;
        }

        scheduleNext();
      });
    };

    scheduleNext();
  }
}

export class VideoMetricsCollector {
  private readonly fpsEstimator = new FpsEstimator();

  collect(video: HTMLVideoElement): UniversalVideoMetrics {
    const { droppedFrames, totalFrames } = readFrameQuality(video);

    return {
      resolution:
        video.videoWidth > 0 && video.videoHeight > 0
          ? { width: video.videoWidth, height: video.videoHeight }
          : null,
      fps: this.fpsEstimator.estimate(video, totalFrames),
      droppedFrames,
      totalFrames,
      bufferAhead: getBufferAheadSeconds(video),
      playbackRate: video.playbackRate,
      readyState: video.readyState,
      networkState: video.networkState,
    };
  }
}
