import type { VideoDetectionSnapshot } from '@/src/core/video-detector';
import type { SiteId } from '@/src/shared/types';

export interface SiteAdapter {
  id: SiteId;
  siteLabelKey: string;
  matches(location: Location): boolean;
  pickVideo(snapshot: VideoDetectionSnapshot): HTMLVideoElement | null;
  getQualityLabel(video: HTMLVideoElement): string | null;
}
