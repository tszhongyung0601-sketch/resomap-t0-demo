import type { Dict, Locale, PlaceDict } from ".";
import { UI as zh_Hans, PLACES_DICT as zh_Hans_P } from "./zh-Hans";
import { UI as en, PLACES_DICT as en_P } from "./en";
import { UI as ms, PLACES_DICT as ms_P } from "./ms";
import { UI as id, PLACES_DICT as id_P } from "./id";
import { UI as ja, PLACES_DICT as ja_P } from "./ja";
import { UI as ko, PLACES_DICT as ko_P } from "./ko";
import { UI as vi, PLACES_DICT as vi_P } from "./vi";
import { UI as th, PLACES_DICT as th_P } from "./th";

/**
 * Where the eight catalogues are registered.
 *
 * Traditional Chinese has no entry and needs none — it is the key space, so a
 * lookup that finds nothing returns the source string, which is already correct.
 *
 * Every catalogue is partial by design. The navigation, section headings,
 * primary buttons, settings and all eighty place names are translated; sentences
 * the screens build from fragments (`停留 ${n} 分`) are not, because a fragment
 * translated on its own is grammatical nonsense in all eight. Those fall back to
 * Chinese, and the notice at the top of every translated screen is what makes
 * that honest rather than sloppy.
 */
export const DICTS: Partial<Record<Locale, Dict>> = {
  "zh-Hans": zh_Hans,
  "en": en,
  "ms": ms,
  "id": id,
  "ja": ja,
  "ko": ko,
  "vi": vi,
  "th": th,
};

export const PLACES: Partial<Record<Locale, PlaceDict>> = {
  "zh-Hans": zh_Hans_P,
  "en": en_P,
  "ms": ms_P,
  "id": id_P,
  "ja": ja_P,
  "ko": ko_P,
  "vi": vi_P,
  "th": th_P,
};
