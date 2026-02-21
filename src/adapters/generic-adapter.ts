import type { VideoDetectionSnapshot } from '@/src/core/video-detector';
import type { SiteAdapter } from '@/src/adapters/types';

export class GenericAdapter implements SiteAdapter {
  readonly id = 'generic' as const;

  readonly siteLabelKey = 'siteGeneric';

  matches(): boolean {
    return true;
  }

  pickVideo(snapshot: VideoDetectionSnapshot): HTMLVideoElement | null {
    return snapshot.activeVideo;
  }

  getQualityLabel(): string | null {
    return null;
  }
}
