/**
 * FrameWatch
 * Copyright (c) 2026 Pierre Guillemot
 * Licensed under AGPL-3.0
 */

export type SiteId = 'generic' | 'youtube' | 'twitch';

export interface UniversalVideoMetrics {
  resolution: {
    width: number;
    height: number;
  } | null;
  fps: number | null;
  droppedFrames: number | null;
  totalFrames: number | null;
  bufferAhead: number | null;
  playbackRate: number;
  readyState: number;
  networkState: number;
}

export interface HudSnapshot {
  siteId: SiteId;
  siteLabelKey: string;
  qualityLabel: string | null;
  metrics: UniversalVideoMetrics | null;
  bitrateMbps: number | null;
  hasVideo: boolean;
  inaccessibleIframeCount: number;
  sampledAt: number;
}

export interface PopupStatus {
  siteId: SiteId;
  siteLabelKey: string;
  hasVideo: boolean;
  hudEnabled: boolean;
}
