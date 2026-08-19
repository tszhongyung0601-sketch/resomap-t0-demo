import type { Dict, Locale, PlaceDict } from ".";

/**
 * Where the nine catalogues are registered.
 *
 * Every one is partial on purpose. A missing entry falls back to the Traditional
 * Chinese source string, which is why the source text is the key — see the note
 * in ./index.ts. Adding a language means adding a file and one line here; it
 * never means touching a screen.
 *
 * Coverage is deliberately uneven and the app says so on screen: the navigation,
 * section headings, primary buttons and the settings screen are translated for
 * all nine, and so is every place name. Long-form copy — the fifteen guide
 * scripts especially — stays Chinese, because a three-minute narration run
 * through a machine and then through speech synthesis is worse than an honest
 * "this guide is only in Chinese".
 */

/* Placeholder registries. Each locale's file is added as it lands, so the app
   builds and runs from the first commit rather than after the last one. */
export const DICTS: Partial<Record<Locale, Dict>> = {};

export const PLACES: Partial<Record<Locale, PlaceDict>> = {};
