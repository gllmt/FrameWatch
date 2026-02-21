export type LanguagePreference = 'auto' | 'fr' | 'en';
export type HudPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
export type RefreshInterval = 250 | 500 | 1000;

export interface FrameWatchSettings {
  hudEnabled: boolean;
  language: LanguagePreference;
  hudPosition: HudPosition;
  showBitrate: boolean;
  showBuffer: boolean;
  showFrames: boolean;
  showStates: boolean;
  refreshInterval: RefreshInterval;
  alwaysOnFullscreen: boolean;
}

export const DEFAULT_SETTINGS: FrameWatchSettings = {
  hudEnabled: true,
  language: 'auto',
  hudPosition: 'top-right',
  showBitrate: true,
  showBuffer: true,
  showFrames: true,
  showStates: false,
  refreshInterval: 500,
  alwaysOnFullscreen: true,
};

function sanitizeSettings(raw: Partial<FrameWatchSettings>): FrameWatchSettings {
  const next: FrameWatchSettings = { ...DEFAULT_SETTINGS, ...raw };

  if (!['auto', 'fr', 'en'].includes(next.language)) {
    next.language = DEFAULT_SETTINGS.language;
  }

  if (!['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(next.hudPosition)) {
    next.hudPosition = DEFAULT_SETTINGS.hudPosition;
  }

  if (![250, 500, 1000].includes(next.refreshInterval)) {
    next.refreshInterval = DEFAULT_SETTINGS.refreshInterval;
  }

  return next;
}

export async function getSettings(): Promise<FrameWatchSettings> {
  const stored = await browser.storage.local.get(
    DEFAULT_SETTINGS as unknown as Record<string, unknown>,
  );
  return sanitizeSettings(stored as Partial<FrameWatchSettings>);
}

export async function patchSettings(
  patch: Partial<FrameWatchSettings>,
): Promise<FrameWatchSettings> {
  const current = await getSettings();
  const next = sanitizeSettings({ ...current, ...patch });
  await browser.storage.local.set(next);
  return next;
}

export function subscribeSettings(
  callback: (settings: FrameWatchSettings) => void,
): () => void {
  const listener = (
    changes: Record<string, unknown>,
    areaName: string,
  ) => {
    if (areaName !== 'local') {
      return;
    }

    const changedKeys = Object.keys(changes);
    const intersectsSettings = changedKeys.some((key) => key in DEFAULT_SETTINGS);
    if (!intersectsSettings) {
      return;
    }

    getSettings().then(callback).catch(() => undefined);
  };

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
