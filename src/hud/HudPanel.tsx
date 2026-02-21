import { useMemo } from 'react';

import type { HudSnapshot } from '@/src/shared/types';
import type { FrameWatchSettings } from '@/src/storage/settings';

interface HudPanelProps {
  visible: boolean;
  settings: FrameWatchSettings;
  snapshot: HudSnapshot;
  locale: string;
  t: (key: string, substitutions?: string | number | Array<string | number>) => string;
  onClose: () => void;
}

const POSITION_CLASS: Record<FrameWatchSettings['hudPosition'], string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

function formatNullable(
  value: number | null,
  formatter: Intl.NumberFormat,
  fallback: string,
  suffix = '',
): string {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }
  return `${formatter.format(value)}${suffix}`;
}

export function HudPanel({ visible, settings, snapshot, locale, t, onClose }: HudPanelProps) {
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    [locale],
  );

  const frameFormatter = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );

  const na = t('valueNa');
  const rootClasses = `${POSITION_CLASS[settings.hudPosition]} pointer-events-none fixed z-[2147483647]`;

  if (!visible) {
    return null;
  }

  return (
    <div className={rootClasses}>
      <section className="pointer-events-auto w-72 rounded-2xl border border-white/20 bg-hud-bg text-white shadow-hud backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <h1 className="text-[13px] font-semibold tracking-wide">{t('hudTitle')}</h1>
          <div className="flex items-center gap-2">
            <div className="text-[11px] text-hud-muted">
              {t(snapshot.siteLabelKey)}
              {snapshot.qualityLabel ? ` · ${snapshot.qualityLabel}` : ''}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('hudClose')}
              title={t('hudClose')}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[11px] leading-none text-slate-100 transition hover:bg-white/10"
            >
              ×
            </button>
          </div>
        </header>

        {!snapshot.hasVideo || !snapshot.metrics ? (
          <div className="px-3 py-3 text-[12px] text-slate-100">{t('hudNoVideo')}</div>
        ) : (
          <dl className="space-y-1 px-3 py-2 text-[12px]">
            <div className="flex items-center justify-between">
              <dt className="text-hud-muted">{t('hudResolution')}</dt>
              <dd className="font-medium">
                {snapshot.metrics.resolution
                  ? `${snapshot.metrics.resolution.width}×${snapshot.metrics.resolution.height}`
                  : na}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-hud-muted">{t('hudFps')}</dt>
              <dd className="font-medium">
                {formatNullable(snapshot.metrics.fps, numberFormatter, na, ` ${t('unitFps')}`)}
              </dd>
            </div>

            {settings.showFrames && (
              <>
                <div className="flex items-center justify-between">
                  <dt className="text-hud-muted">{t('hudDropped')}</dt>
                  <dd className="font-medium">
                    {formatNullable(snapshot.metrics.droppedFrames, frameFormatter, na)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-hud-muted">{t('hudTotal')}</dt>
                  <dd className="font-medium">
                    {formatNullable(snapshot.metrics.totalFrames, frameFormatter, na)}
                  </dd>
                </div>
              </>
            )}

            {settings.showBuffer && (
              <div className="flex items-center justify-between">
                <dt className="text-hud-muted">{t('hudBuffer')}</dt>
                <dd className="font-medium">
                  {formatNullable(snapshot.metrics.bufferAhead, numberFormatter, na, ` ${t('unitSeconds')}`)}
                </dd>
              </div>
            )}

            {settings.showBitrate && (
              <div className="flex items-center justify-between">
                <dt className="text-hud-muted">{t('hudBitrate')}</dt>
                <dd className="font-medium">
                  {formatNullable(snapshot.bitrateMbps, numberFormatter, na, ` ${t('unitMbps')}`)}
                </dd>
              </div>
            )}

            <div className="flex items-center justify-between">
              <dt className="text-hud-muted">{t('hudPlaybackRate')}</dt>
              <dd className="font-medium">
                {formatNullable(snapshot.metrics.playbackRate, numberFormatter, na)}
              </dd>
            </div>

            {settings.showStates && (
              <>
                <div className="flex items-center justify-between">
                  <dt className="text-hud-muted">{t('hudReadyState')}</dt>
                  <dd className="font-medium">{snapshot.metrics.readyState}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-hud-muted">{t('hudNetworkState')}</dt>
                  <dd className="font-medium">{snapshot.metrics.networkState}</dd>
                </div>
              </>
            )}
          </dl>
        )}

        {snapshot.inaccessibleIframeCount > 0 && (
          <footer className="border-t border-white/10 px-3 py-2 text-[10px] text-hud-muted">
            {t('hudIframesBlocked', snapshot.inaccessibleIframeCount)}
          </footer>
        )}
      </section>
    </div>
  );
}
