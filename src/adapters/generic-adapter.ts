/**
 * FrameWatch
 * Copyright (c) 2026 Pierre Guillemot
 * Licensed under AGPL-3.0
 */

import type { SiteAdapter } from '@/src/adapters/types';
import type { VideoDetectionSnapshot } from '@/src/core/video-detector';

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
