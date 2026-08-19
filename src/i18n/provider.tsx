import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  I18nContext,
  readLocale,
  writeLocale,
  type Dict,
  type Locale,
  type PlaceDict,
} from ".";
import { DICTS, PLACES } from "./catalogues";

/**
 * The language the whole app reads from.
 *
 * Catalogues are imported eagerly rather than lazily. Nine partial dictionaries
 * are tens of kilobytes, and a language switch that shows a loading state — or
 * worse, one frame of the old language — is a worse trade than the bytes.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);

  /* On mount as well as on change. setLocale only fires when somebody picks a
     language, so a reader who chose 日本語 yesterday came back to a document
     still declaring zh-Hant — screen readers and the browser's own translation
     prompt both read this attribute. */
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    writeLocale(l);
  }, []);

  const value = useMemo(() => {
    const dict: Dict = DICTS[locale] ?? {};
    const places: PlaceDict = PLACES[locale] ?? {};
    const translated = locale !== DEFAULT_LOCALE;

    return {
      locale,
      setLocale,
      t: (zh: string) => dict[zh] ?? zh,
      placeName: (poiId: string, zh: string) => places[poiId]?.name ?? zh,
      placeAbout: (poiId: string, zh: string | undefined) => places[poiId]?.about ?? zh,
      translated,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * The line that has to appear on every non-Chinese screen.
 *
 * Nobody reviewed these nine catalogues. A reader who hits an odd sentence
 * deserves to know it came out of a machine rather than concluding the product
 * is careless — and the app has spent every other screen marking what is
 * fabricated, so unreviewed translation is not the place to start hiding things.
 */
export function TranslationNotice({ translated }: { translated: boolean }) {
  if (!translated) return null;
  return (
    <p className="shrink-0 bg-surface-2 px-4 py-1.5 text-center text-[11px] leading-relaxed text-ink-3">
      Machine translation, not reviewed by a human.
    </p>
  );
}
