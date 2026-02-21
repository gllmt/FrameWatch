/**
 * FrameWatch
 * Copyright (c) 2026 Pierre Guillemot
 * Licensed under AGPL-3.0
 */

import enMessagesRaw from '@/public/_locales/en/messages.json';
import frMessagesRaw from '@/public/_locales/fr/messages.json';
import type { LanguagePreference } from '@/src/storage/settings';

type SupportedLocale = 'en' | 'fr';
type RawMessages = Record<string, { message: string }>;

type Substitutions = string | number | Array<string | number>;

function normalizeLocale(input: string | undefined): SupportedLocale {
  if (!input) {
    return 'en';
  }
  return input.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function toSubstitutionArray(substitutions?: Substitutions): Array<string | number> {
  if (substitutions === undefined) {
    return [];
  }
  return Array.isArray(substitutions) ? substitutions : [substitutions];
}

function applySubstitutions(template: string, substitutions?: Substitutions): string {
  const values = toSubstitutionArray(substitutions);
  if (values.length === 0) {
    return template;
  }

  return template.replace(/\$(\d+)/g, (_, match: string) => {
    const index = Number.parseInt(match, 10) - 1;
    const value = values[index];
    return value === undefined ? '' : String(value);
  });
}

function flattenMessages(raw: RawMessages): Record<string, string> {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.message]));
}

const STATIC_MESSAGES: Record<SupportedLocale, Record<string, string>> = {
  en: flattenMessages(enMessagesRaw as RawMessages),
  fr: flattenMessages(frMessagesRaw as RawMessages),
};

export async function resolveLocale(preference: LanguagePreference): Promise<SupportedLocale> {
  if (preference === 'auto') {
    return normalizeLocale(browser.i18n.getUILanguage());
  }
  return normalizeLocale(preference);
}

export class I18nRuntime {
  private locale: SupportedLocale = 'en';

  private messages: Record<string, string> = STATIC_MESSAGES.en;

  async init(preference: LanguagePreference): Promise<void> {
    this.locale = await resolveLocale(preference);
    this.messages = STATIC_MESSAGES[this.locale];
  }

  async setLanguage(preference: LanguagePreference): Promise<void> {
    const nextLocale = await resolveLocale(preference);
    this.locale = nextLocale;
    this.messages = STATIC_MESSAGES[this.locale];
  }

  t(key: string, substitutions?: Substitutions): string {
    const message = this.messages[key];
    if (message) {
      return applySubstitutions(message, substitutions);
    }

    const getMessage = browser.i18n.getMessage as unknown as (
      keyName: string,
      substitutions?: string | string[],
    ) => string;

    const fallback = getMessage(key, toSubstitutionArray(substitutions).map(String));
    return fallback || key;
  }

  getLocale(): SupportedLocale {
    return this.locale;
  }
}
