import { useEffect, useMemo, useState } from 'react';

import { I18nRuntime } from '@/src/i18n/runtime';
import { FRAMEWATCH_MESSAGE } from '@/src/shared/messages';
import type { PopupStatus } from '@/src/shared/types';
import { getSettings, patchSettings } from '@/src/storage/settings';

interface PopupState {
  loading: boolean;
  unsupported: boolean;
  status: PopupStatus | null;
  hudEnabled: boolean;
}

interface BrowserTabLike {
  id?: number;
  url?: string;
  active?: boolean;
}

function isRestrictedUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  return (
    /^(about|brave|chrome|edge|vivaldi):/i.test(url) ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('moz-extension://') ||
    url.startsWith('safari-web-extension://')
  );
}

function uniqueTabs(input: BrowserTabLike[]): BrowserTabLike[] {
  const seen = new Set<number>();
  const output: BrowserTabLike[] = [];

  for (const tab of input) {
    if (!tab.id || seen.has(tab.id)) {
      continue;
    }
    seen.add(tab.id);
    output.push(tab);
  }

  return output;
}

async function getCandidateTabs(): Promise<BrowserTabLike[]> {
  const collected: BrowserTabLike[] = [];

  try {
    const lastFocused = (await browser.windows.getLastFocused({
      populate: true,
      windowTypes: ['normal'],
    } as Record<string, unknown>)) as { tabs?: BrowserTabLike[] };
    const tabs = (lastFocused.tabs ?? []).filter((tab) => tab.active);
    collected.push(...tabs);
  } catch {
    // Ignore and continue with other strategies.
  }

  const attempts = [
    () => browser.tabs.query({ active: true, lastFocusedWindow: true }),
    () => browser.tabs.query({ active: true, currentWindow: true }),
    () => browser.tabs.query({ active: true }),
  ];

  for (const query of attempts) {
    try {
      collected.push(...((await query()) as BrowserTabLike[]));
    } catch {
      // Ignore this strategy and continue.
    }
  }

  return uniqueTabs(collected).sort((a, b) => {
    const aScore = Number(!isRestrictedUrl(a.url)) * 2 + Number(Boolean(a.active));
    const bScore = Number(!isRestrictedUrl(b.url)) * 2 + Number(Boolean(b.active));
    return bScore - aScore;
  });
}

async function getBestTabForStatus(): Promise<BrowserTabLike | null> {
  const candidates = await getCandidateTabs();
  return candidates[0] ?? null;
}

async function getStatusFromTab(tabId: number): Promise<PopupStatus | null> {
  try {
    const status = (await browser.tabs.sendMessage(tabId, {
      type: FRAMEWATCH_MESSAGE.GET_STATUS,
    })) as PopupStatus;

    if (status && typeof status === 'object' && typeof status.siteLabelKey === 'string') {
      return status;
    }
  } catch {
    // Ignore and report no status.
  }

  return null;
}

export default function PopupApp() {
  const [i18n, setI18n] = useState<I18nRuntime | null>(null);
  const [state, setState] = useState<PopupState>({
    loading: true,
    unsupported: false,
    status: null,
    hudEnabled: true,
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const settings = await getSettings();
      const runtime = new I18nRuntime();
      await runtime.init(settings.language);

      let unsupported = false;
      let status: PopupStatus | null = null;

      const candidates = await getCandidateTabs();
      for (const tab of candidates) {
        if (!tab.id || isRestrictedUrl(tab.url)) {
          continue;
        }

        status = await getStatusFromTab(tab.id);
        if (status) {
          break;
        }
      }

      if (!status) {
        const fallbackTab = candidates[0] ?? null;
        unsupported = !fallbackTab || isRestrictedUrl(fallbackTab.url);
      }

      if (candidates.length === 0) {
        unsupported = true;
      }

      if (!alive) {
        return;
      }

      setI18n(runtime);
      setState({
        loading: false,
        unsupported,
        status,
        hudEnabled: status?.hudEnabled ?? settings.hudEnabled,
      });
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const t = useMemo(() => i18n?.t.bind(i18n) ?? ((key: string) => key), [i18n]);

  const onToggleHud = async (enabled: boolean) => {
    setState((prev) => ({ ...prev, hudEnabled: enabled }));
    await patchSettings({ hudEnabled: enabled });

    const tab = await getBestTabForStatus();
    if (!tab?.id || isRestrictedUrl(tab.url)) {
      return;
    }

    try {
      await browser.tabs.sendMessage(tab.id, {
        type: FRAMEWATCH_MESSAGE.SET_HUD_ENABLED,
        enabled,
      });
    } catch {
      // Ignore restricted pages.
    }
  };

  return (
    <main className="min-h-[260px] w-[330px] bg-slate-100 p-4 text-slate-900">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <header className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight">{t('popupTitle')}</h1>
        </header>

        {state.loading ? (
          <p className="text-sm text-slate-600">{t('popupLoading')}</p>
        ) : (
          <div className="space-y-3 text-sm">
            <label className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <span>{t('popupHudEnabled')}</span>
              <input
                type="checkbox"
                checked={state.hudEnabled}
                onChange={(event) => {
                  void onToggleHud(event.target.checked);
                }}
                className="h-4 w-4 accent-slate-900"
              />
            </label>

            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t('popupCurrentSite')}
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {state.status ? t(state.status.siteLabelKey) : t('popupStatusUnknown')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {t('popupVideoDetected')}
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {state.status?.hasVideo ? t('popupYes') : t('popupNo')}
              </p>
            </div>

            {state.unsupported && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {t('popupNoContentScript')}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                void browser.runtime.openOptionsPage();
              }}
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              {t('popupOpenOptions')}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
