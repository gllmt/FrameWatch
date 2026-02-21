import type { SiteAdapter } from '@/src/adapters/types';
import type { VideoDetectionSnapshot } from '@/src/core/video-detector';

interface YouTubePlayerApi {
  getPlaybackQualityLabel?: () => string;
}

function getYouTubePlayerApi(): YouTubePlayerApi | null {
  const player = document.getElementById('movie_player') as (HTMLElement & YouTubePlayerApi) | null;
  if (!player) {
    return null;
  }

  if (typeof player.getPlaybackQualityLabel === 'function') {
    return player;
  }

  return null;
}

function readQualityFromDom(): string | null {
  const selectedItem = document.querySelector(
    '.ytp-quality-menu .ytp-menuitem[aria-checked="true"] .ytp-menuitem-label',
  );
  const value = selectedItem?.textContent?.trim();
  return value || null;
}

export class YouTubeAdapter implements SiteAdapter {
  readonly id = 'youtube' as const;

  readonly siteLabelKey = 'siteYoutube';

  matches(location: Location): boolean {
    return location.hostname.includes('youtube.com') || location.hostname.includes('youtu.be');
  }

  pickVideo(snapshot: VideoDetectionSnapshot): HTMLVideoElement | null {
    const focused = document.querySelector('video.html5-main-video');
    if (focused instanceof HTMLVideoElement) {
      return focused;
    }

    return snapshot.activeVideo;
  }

  getQualityLabel(): string | null {
    const api = getYouTubePlayerApi();
    if (api?.getPlaybackQualityLabel) {
      const label = api.getPlaybackQualityLabel();
      if (label && label.trim().length > 0) {
        return label.trim();
      }
    }

    return readQualityFromDom();
  }
}
