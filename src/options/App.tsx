import { useEffect, useMemo, useState } from 'react';

import { I18nRuntime } from '@/src/i18n/runtime';
import {
  DEFAULT_SETTINGS,
  type FrameWatchSettings,
  getSettings,
  type HudPosition,
  type LanguagePreference,
  patchSettings,
  type RefreshInterval,
} from '@/src/storage/settings';

export default function OptionsApp() {
  const [i18n, setI18n] = useState<I18nRuntime | null>(null);
  const [settings, setSettings] = useState<FrameWatchSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const nextSettings = await getSettings();
      const runtime = new I18nRuntime();
      await runtime.init(nextSettings.language);

      if (!alive) {
        return;
      }

      setSettings(nextSettings);
      setI18n(runtime);
    };

    void load();

    return () => {
      alive = false;
    };
  }, []);

  const t = useMemo(() => i18n?.t.bind(i18n) ?? ((key: string) => key), [i18n]);

  const update = async (patch: Partial<FrameWatchSettings>) => {
    setSaving(true);
    const next = await patchSettings(patch);
    setSettings(next);

    if (patch.language) {
      const refreshed = new I18nRuntime();
      await refreshed.init(next.language);
      setI18n(refreshed);
    }

    setSaving(false);
  };

  if (i18n === null) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 text-slate-900">
        <p className="text-sm text-slate-600">{t('optionsLoading')}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-8">
      <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{t('optionsTitle')}</h1>
          <p className="mt-1 text-sm text-slate-600">{t('optionsSubtitle')}</p>
        </header>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('optionsLanguage')}</span>
            <select
              value={settings.language}
              onChange={(event) => {
                void update({ language: event.target.value as LanguagePreference });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="auto">{t('optionsLangAuto')}</option>
              <option value="fr">{t('optionsLangFrench')}</option>
              <option value="en">{t('optionsLangEnglish')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('optionsHudPosition')}</span>
            <select
              value={settings.hudPosition}
              onChange={(event) => {
                void update({ hudPosition: event.target.value as HudPosition });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value="top-right">{t('optionsPosTopRight')}</option>
              <option value="top-left">{t('optionsPosTopLeft')}</option>
              <option value="bottom-right">{t('optionsPosBottomRight')}</option>
              <option value="bottom-left">{t('optionsPosBottomLeft')}</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">{t('optionsRefreshRate')}</span>
            <select
              value={settings.refreshInterval}
              onChange={(event) => {
                void update({ refreshInterval: Number(event.target.value) as RefreshInterval });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              <option value={250}>{t('optionsRefresh250')}</option>
              <option value={500}>{t('optionsRefresh500')}</option>
              <option value={1000}>{t('optionsRefresh1000')}</option>
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleCard
              label={t('optionsShowBitrate')}
              checked={settings.showBitrate}
              onChange={(checked) => {
                void update({ showBitrate: checked });
              }}
            />
            <ToggleCard
              label={t('optionsShowBuffer')}
              checked={settings.showBuffer}
              onChange={(checked) => {
                void update({ showBuffer: checked });
              }}
            />
            <ToggleCard
              label={t('optionsShowFrames')}
              checked={settings.showFrames}
              onChange={(checked) => {
                void update({ showFrames: checked });
              }}
            />
            <ToggleCard
              label={t('optionsShowStates')}
              checked={settings.showStates}
              onChange={(checked) => {
                void update({ showStates: checked });
              }}
            />
          </div>

          <ToggleCard
            label={t('optionsAlwaysOnFullscreen')}
            checked={settings.alwaysOnFullscreen}
            onChange={(checked) => {
              void update({ alwaysOnFullscreen: checked });
            }}
          />

          <ToggleCard
            label={t('popupHudEnabled')}
            checked={settings.hudEnabled}
            onChange={(checked) => {
              void update({ hudEnabled: checked });
            }}
          />

          <p className="text-xs text-slate-500">
            {saving ? t('optionsSaving') : t('optionsSaved')}
          </p>
        </div>
      </section>
    </main>
  );
}

interface ToggleCardProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

function ToggleCard({ checked, label, onChange }: ToggleCardProps) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-sm text-slate-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
        className="h-4 w-4 accent-slate-900"
      />
    </label>
  );
}
