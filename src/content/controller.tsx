import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { GenericAdapter } from '@/src/adapters/generic-adapter';
import { TwitchAdapter } from '@/src/adapters/twitch-adapter';
import type { SiteAdapter } from '@/src/adapters/types';
import { YouTubeAdapter } from '@/src/adapters/youtube-adapter';
import { FullscreenManager } from '@/src/core/fullscreen-manager';
import { VideoMetricsCollector } from '@/src/core/metrics-collector';
import { ThroughputEstimator } from '@/src/core/throughput-estimator';
import { VideoDetector } from '@/src/core/video-detector';
import { HudPanel } from '@/src/hud/HudPanel';
import hudStyles from '@/src/hud/hud.css?inline';
import { I18nRuntime } from '@/src/i18n/runtime';
import {
  FRAMEWATCH_MESSAGE,
  type FrameWatchIncomingMessage,
  type FrameWatchResponse,
} from '@/src/shared/messages';
import type { HudSnapshot, PopupStatus } from '@/src/shared/types';
import {
  DEFAULT_SETTINGS,
  type FrameWatchSettings,
  getSettings,
  patchSettings,
  subscribeSettings,
} from '@/src/storage/settings';

const GENERIC_ADAPTER = new GenericAdapter();
const ADAPTERS: SiteAdapter[] = [new YouTubeAdapter(), new TwitchAdapter(), GENERIC_ADAPTER];

function resolveAdapter(location: Location): SiteAdapter {
  return ADAPTERS.find((adapter) => adapter.matches(location)) ?? GENERIC_ADAPTER;
}

function getInitialSnapshot(): HudSnapshot {
  return {
    siteId: 'generic',
    siteLabelKey: 'siteGeneric',
    qualityLabel: null,
    metrics: null,
    bitrateMbps: null,
    hasVideo: false,
    inaccessibleIframeCount: 0,
    sampledAt: Date.now(),
  };
}

export class FrameWatchController {
  private settings: FrameWatchSettings = DEFAULT_SETTINGS;

  private readonly i18n = new I18nRuntime();

  private readonly detector = new VideoDetector();

  private readonly metricsCollector = new VideoMetricsCollector();

  private readonly throughputEstimator = new ThroughputEstimator();

  private readonly shadowHost: HTMLDivElement;

  private readonly root: Root;

  private readonly fullscreenManager: FullscreenManager;

  private pollerId: number | null = null;

  private unsubscribeSettings: (() => void) | null = null;

  private snapshot: HudSnapshot = getInitialSnapshot();

  private readonly runtimeMessageListener: Parameters<
    typeof browser.runtime.onMessage.addListener
  >[0] = (message, _sender, sendResponse) => {
    void this.handleMessage(message)
      .then((response) => {
        sendResponse(response);
      })
      .catch(() => {
        sendResponse(undefined);
      });

    return true;
  };

  constructor() {
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'framewatch-root';
    this.shadowHost.style.position = 'fixed';
    this.shadowHost.style.inset = '0';
    this.shadowHost.style.zIndex = '2147483647';
    this.shadowHost.style.pointerEvents = 'none';

    const shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });

    const styleTag = document.createElement('style');
    styleTag.textContent = hudStyles;
    shadowRoot.appendChild(styleTag);

    const mountNode = document.createElement('div');
    shadowRoot.appendChild(mountNode);

    this.root = createRoot(mountNode);
    this.fullscreenManager = new FullscreenManager(this.shadowHost, window.location.hostname);
  }

  async start(): Promise<void> {
    const existingRoot = document.getElementById(this.shadowHost.id);
    if (existingRoot && existingRoot !== this.shadowHost) {
      existingRoot.remove();
    }

    document.documentElement.appendChild(this.shadowHost);

    this.settings = await getSettings();
    await this.i18n.init(this.settings.language);

    this.detector.start();
    this.throughputEstimator.start();
    this.fullscreenManager.start();

    browser.runtime.onMessage.addListener(this.runtimeMessageListener);

    this.unsubscribeSettings = subscribeSettings((nextSettings) => {
      void this.applySettings(nextSettings);
    });

    this.restartPoller();
    this.tick();
  }

  stop(): void {
    this.detector.stop();
    this.throughputEstimator.stop();
    this.fullscreenManager.stop();

    browser.runtime.onMessage.removeListener(this.runtimeMessageListener);
    this.unsubscribeSettings?.();

    if (this.pollerId !== null) {
      window.clearInterval(this.pollerId);
      this.pollerId = null;
    }

    this.root.unmount();
    this.shadowHost.remove();
  }

  private restartPoller(): void {
    if (this.pollerId !== null) {
      window.clearInterval(this.pollerId);
    }

    this.pollerId = window.setInterval(() => {
      this.tick();
    }, this.settings.refreshInterval);
  }

  private tick(): void {
    const adapter = resolveAdapter(window.location);
    const detection = this.detector.getSnapshot(true);

    let activeVideo: HTMLVideoElement | null = null;
    let qualityLabel: string | null = null;

    try {
      activeVideo = adapter.pickVideo(detection);
      qualityLabel = activeVideo ? adapter.getQualityLabel(activeVideo) : null;
    } catch {
      activeVideo = GENERIC_ADAPTER.pickVideo(detection);
      qualityLabel = null;
    }

    if (!activeVideo) {
      activeVideo = GENERIC_ADAPTER.pickVideo(detection);
    }

    const metrics = activeVideo ? this.metricsCollector.collect(activeVideo) : null;
    const bitrateMbps = this.throughputEstimator.getEstimateMbps();

    this.snapshot = {
      siteId: adapter.id,
      siteLabelKey: adapter.siteLabelKey,
      qualityLabel,
      metrics,
      bitrateMbps,
      hasVideo: Boolean(activeVideo),
      inaccessibleIframeCount: detection.inaccessibleIframeCount,
      sampledAt: Date.now(),
    };

    this.render();
  }

  private render(): void {
    const fullscreenState = this.fullscreenManager.sync(this.settings.alwaysOnFullscreen);
    const visible = this.settings.hudEnabled && fullscreenState.shouldDisplay;

    this.root.render(
      createElement(HudPanel, {
        visible,
        settings: this.settings,
        snapshot: this.snapshot,
        locale: this.i18n.getLocale(),
        t: this.i18n.t.bind(this.i18n),
        onClose: this.closeHud,
      }),
    );
  }

  private async applySettings(nextSettings: FrameWatchSettings): Promise<void> {
    const previousRefresh = this.settings.refreshInterval;
    const previousLanguage = this.settings.language;

    this.settings = nextSettings;

    if (previousLanguage !== nextSettings.language) {
      await this.i18n.setLanguage(nextSettings.language);
    }

    if (previousRefresh !== nextSettings.refreshInterval) {
      this.restartPoller();
    }

    this.tick();
  }

  private readonly handleMessage = async (
    message: unknown,
  ): Promise<FrameWatchResponse | undefined> => {
    const payload = message as FrameWatchIncomingMessage;

    if (!payload || typeof payload !== 'object' || typeof payload.type !== 'string') {
      return undefined;
    }

    if (payload.type === FRAMEWATCH_MESSAGE.GET_STATUS) {
      return this.buildPopupStatus();
    }

    if (payload.type === FRAMEWATCH_MESSAGE.SET_HUD_ENABLED) {
      const nextSettings = await patchSettings({ hudEnabled: payload.enabled });
      await this.applySettings(nextSettings);
      return { hudEnabled: nextSettings.hudEnabled };
    }

    if (payload.type === FRAMEWATCH_MESSAGE.TOGGLE_HUD) {
      const nextSettings = await patchSettings({ hudEnabled: !this.settings.hudEnabled });
      await this.applySettings(nextSettings);
      return { hudEnabled: nextSettings.hudEnabled };
    }

    return undefined;
  };

  private readonly closeHud = (): void => {
    if (!this.settings.hudEnabled) {
      return;
    }

    void (async () => {
      const nextSettings = await patchSettings({ hudEnabled: false });
      await this.applySettings(nextSettings);
    })();
  };

  private buildPopupStatus(): PopupStatus {
    return {
      siteId: this.snapshot.siteId,
      siteLabelKey: this.snapshot.siteLabelKey,
      hasVideo: this.snapshot.hasVideo,
      hudEnabled: this.settings.hudEnabled,
    };
  }
}
