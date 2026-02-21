interface ThroughputSample {
  timestamp: number;
  bytes: number;
  durationSeconds: number;
}

const MEDIA_RESOURCE_PATTERN = /\.(m3u8|mpd|m4s|mp4|webm|ts|cmfa|cmfv)(\?|$)/i;
const SEGMENT_HINT_PATTERN = /(segment|chunk|frag|dash|hls|playlist|manifest|videoplayback)/i;

function isLikelyMediaResource(entry: PerformanceResourceTiming): boolean {
  const initiatorType = entry.initiatorType;
  if (initiatorType === 'video' || initiatorType === 'audio') {
    return true;
  }

  if (MEDIA_RESOURCE_PATTERN.test(entry.name)) {
    return true;
  }

  return SEGMENT_HINT_PATTERN.test(entry.name);
}

function readTransferSize(entry: PerformanceResourceTiming): number {
  if (entry.transferSize > 0) {
    return entry.transferSize;
  }
  if (entry.encodedBodySize > 0) {
    return entry.encodedBodySize;
  }
  if (entry.decodedBodySize > 0) {
    return entry.decodedBodySize;
  }
  return 0;
}

export class ThroughputEstimator {
  private readonly windowMs: number;

  private readonly samples: ThroughputSample[] = [];

  private observer: PerformanceObserver | null = null;

  private smoothedMbps: number | null = null;

  constructor(windowMs = 8_000) {
    this.windowMs = windowMs;
  }

  start(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    this.stop();

    this.observer = new PerformanceObserver((list) => {
      const entries = list
        .getEntries()
        .filter((entry): entry is PerformanceResourceTiming => entry.entryType === 'resource');
      this.addEntries(entries);
    });

    try {
      this.observer.observe({ type: 'resource', buffered: true });
    } catch {
      this.observer.observe({ entryTypes: ['resource'] });
    }
  }

  stop(): void {
    this.observer?.disconnect();
    this.observer = null;
    this.samples.length = 0;
    this.smoothedMbps = null;
  }

  getEstimateMbps(): number | null {
    this.pruneOldSamples();
    if (this.samples.length === 0) {
      return null;
    }

    let totalBits = 0;
    let totalDurationSeconds = 0;

    for (const sample of this.samples) {
      totalBits += sample.bytes * 8;
      totalDurationSeconds += sample.durationSeconds;
    }

    if (totalDurationSeconds <= 0 || totalBits <= 0) {
      return null;
    }

    const currentMbps = totalBits / totalDurationSeconds / 1_000_000;
    this.smoothedMbps =
      this.smoothedMbps === null ? currentMbps : this.smoothedMbps * 0.78 + currentMbps * 0.22;

    return this.smoothedMbps;
  }

  private addEntries(entries: PerformanceResourceTiming[]): void {
    const now = performance.now();

    for (const entry of entries) {
      if (!isLikelyMediaResource(entry)) {
        continue;
      }

      const bytes = readTransferSize(entry);
      const durationSeconds = Math.max((entry.responseEnd - entry.responseStart) / 1000, 0.001);

      if (bytes <= 0 || !Number.isFinite(durationSeconds)) {
        continue;
      }

      this.samples.push({
        timestamp: now,
        bytes,
        durationSeconds,
      });
    }

    this.pruneOldSamples();
  }

  private pruneOldSamples(): void {
    const cutoff = performance.now() - this.windowMs;
    while (this.samples.length > 0 && this.samples[0].timestamp < cutoff) {
      this.samples.shift();
    }
  }
}
