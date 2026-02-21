import type { SiteAdapter } from '@/src/adapters/types';
import type { VideoDetectionSnapshot } from '@/src/core/video-detector';

interface TwitchQualityItem {
  name?: string;
  group?: string;
  quality?: string;
}

interface TwitchPlayerApi {
  getQuality?: () => string;
  getQualities?: () => TwitchQualityItem[];
}

function isTwitchPlayerApi(value: unknown): value is TwitchPlayerApi {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as TwitchPlayerApi;
  return typeof candidate.getQuality === 'function' || typeof candidate.getQualities === 'function';
}

export class TwitchAdapter implements SiteAdapter {
  readonly id = 'twitch' as const;

  readonly siteLabelKey = 'siteTwitch';

  private cachedApi: TwitchPlayerApi | null = null;

  private lastLookupAt = 0;

  matches(location: Location): boolean {
    return location.hostname.includes('twitch.tv');
  }

  pickVideo(snapshot: VideoDetectionSnapshot): HTMLVideoElement | null {
    const focused = document.querySelector('video');
    if (focused instanceof HTMLVideoElement && !focused.paused) {
      return focused;
    }

    return snapshot.activeVideo;
  }

  getQualityLabel(): string | null {
    const api = this.findPlayerApi();
    if (!api) {
      return null;
    }

    const quality = api.getQuality?.();
    if (quality && quality.trim().length > 0) {
      return quality.trim();
    }

    const qualities = api.getQualities?.();
    if (!Array.isArray(qualities) || qualities.length === 0) {
      return null;
    }

    const firstNamed = qualities.find(
      (item) => typeof item.name === 'string' && item.name.trim().length > 0,
    );
    if (firstNamed?.name) {
      return firstNamed.name;
    }

    const firstQuality = qualities.find(
      (item) => typeof item.quality === 'string' && item.quality.trim().length > 0,
    );

    return firstQuality?.quality ?? null;
  }

  private findPlayerApi(): TwitchPlayerApi | null {
    const now = Date.now();
    if (this.cachedApi && now - this.lastLookupAt < 5_000) {
      return this.cachedApi;
    }

    this.lastLookupAt = now;

    const directKeys = [
      'twitchPlayer',
      '__twitchPlayer',
      '__PLAYER__',
      '__player',
      'player',
    ] as const;

    const pageWindow = window as unknown as Record<string, unknown>;

    for (const key of directKeys) {
      const value = pageWindow[key];
      if (isTwitchPlayerApi(value)) {
        this.cachedApi = value;
        return value;
      }
    }

    const twitchNamespace = pageWindow.Twitch as Record<string, unknown> | undefined;
    if (twitchNamespace) {
      for (const value of Object.values(twitchNamespace)) {
        if (isTwitchPlayerApi(value)) {
          this.cachedApi = value;
          return value;
        }
      }
    }

    this.cachedApi = null;
    return null;
  }
}
