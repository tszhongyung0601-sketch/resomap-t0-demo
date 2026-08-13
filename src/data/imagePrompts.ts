import type { Poi } from "../types";

/**
 * The image manifest.
 *
 * ResoMap ships no photography. That is a licensing decision, not an oversight:
 * a stock photo of the wrong temple is worse than an honest graphic, and an AI
 * image of a real place presented as a photograph is worse than both. So the
 * app draws generated covers, and this file is the queue of what should replace
 * them and with what.
 *
 * Two kinds of slot, and the distinction is the whole point:
 *
 *   "photo"  — what the place looks like now. Must be a real photograph. AI is
 *              not an acceptable substitute here at any quality, because a
 *              traveller uses this image to recognise the building when they
 *              arrive.
 *   "scene"  — what the place looked like in a period nobody photographed.
 *              Generated imagery is the only way to have this at all, and it
 *              always renders under the ✨ AI 情境重現 label.
 */

export type ImageKind = "photo" | "scene";
export type ImageStatus = "todo" | "queued" | "done";

export interface ImageSlot {
  poiId: string;
  kind: ImageKind;
  /** 16:9 for heroes and destinations, 4:3 for POI and story cards. */
  aspectRatio: "16:9" | "4:3" | "1:1";
  /** Long edge, in px, before compression. Sized for 2x on a 430px phone. */
  minLongEdge: number;
  /** For "scene": the generation prompt. For "photo": what the shot must show. */
  prompt: string;
  status: ImageStatus;
  /** Where the file will live once it exists. */
  src?: string;
}

/**
 * Tainan first, because it is the demo city. Eight photo slots and four scene
 * slots is roughly one afternoon of shooting and one batch of generation — a
 * deliberately finishable list rather than eighty aspirational ones.
 */
export const IMAGE_SLOTS: ImageSlot[] = [
  /* ---------------------------------------------------------- 台南 photos */
  {
    poiId: "chihkan",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt:
      "赤崁樓正面全景，文昌閣與海神廟的紅瓦飛簷完整入鏡，前景可見蓬壺書院。午後斜光，不要遊客入鏡。",
    status: "todo",
  },
  {
    poiId: "shennong",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "神農街街景，兩側木造街屋二樓立面清楚，傍晚燈籠亮起後拍攝，街道縱深感。",
    status: "todo",
  },
  {
    poiId: "anping-fort",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "安平古堡外側被榕樹根抓住的紅磚殘牆，牆面質地清楚可辨，不要只拍白色瞭望塔。",
    status: "todo",
  },
  {
    poiId: "guohua",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "國華街小吃攤前的排隊人潮，招牌與蒸氣入鏡，白天自然光。",
    status: "todo",
  },
  {
    poiId: "hayashi",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "林百貨建築外觀全景，轉角圓弧與頂樓神社可見，藍天。",
    status: "todo",
  },
  {
    poiId: "chimei",
    kind: "photo",
    aspectRatio: "16:9",
    minLongEdge: 1920,
    prompt: "奇美博物館主館與前方橋樑、噴泉全景，對稱構圖，晴天。",
    status: "todo",
  },
  {
    poiId: "tainan-art",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "臺南市美術館 2 館碎形屋頂，從中庭往上拍，光斑落在地面。",
    status: "todo",
  },
  {
    poiId: "anping-tree",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "安平樹屋榕樹氣根穿過磚牆與屋頂，木棧道入鏡。",
    status: "todo",
  },

  /* ------------------------------------------------- AI historical scenes */
  {
    poiId: "chihkan",
    kind: "scene",
    aspectRatio: "4:3",
    minLongEdge: 1536,
    prompt:
      "Photorealistic historical reconstruction, 1650s Dutch Formosa. Fort Provintia: " +
      "a compact two-storey Dutch colonial brick fort on flat coastal ground, red brick " +
      "walls, small shuttered windows, low outer rampart. Han Chinese settlers and Dutch " +
      "VOC officials in period dress in the middle distance. Natural overcast daylight, " +
      "muted earth palette, documentary lens, no text, no watermark, no fantasy elements, " +
      "no modern buildings.",
    status: "todo",
  },
  {
    poiId: "anping-fort",
    kind: "scene",
    aspectRatio: "4:3",
    minLongEdge: 1536,
    prompt:
      "Photorealistic historical reconstruction, Fort Zeelandia circa 1660, Taiwan. " +
      "Large Dutch brick fortress on a sandbank overlooking a harbour, bastions at the " +
      "corners, wooden sailing ships at anchor. Late afternoon light, natural colour, " +
      "documentary photography style, no text, no watermark, no fantasy.",
    status: "todo",
  },
  {
    poiId: "shennong",
    kind: "scene",
    aspectRatio: "4:3",
    minLongEdge: 1536,
    prompt:
      "Photorealistic historical reconstruction, Qing dynasty Tainan, the 五條港 canal " +
      "district. A narrow waterway running where a street is today, wooden cargo boats " +
      "unloading at the back doors of two-storey timber shophouses, goods hoisted to " +
      "upper floors by rope. Morning light, natural colour, no text, no watermark.",
    status: "todo",
  },
  {
    poiId: "jiufen",
    kind: "scene",
    aspectRatio: "4:3",
    minLongEdge: 1536,
    prompt:
      "Photorealistic historical reconstruction, Jiufen gold mining town in the 1930s. " +
      "Steep stone stairways lined with timber buildings clinging to a hillside, miners " +
      "and shopkeepers, the sea visible below through mist. Overcast natural light, " +
      "muted palette, documentary style, no text, no watermark.",
    status: "todo",
  },
];

export const slotsFor = (poiId: string) => IMAGE_SLOTS.filter((s) => s.poiId === poiId);

export const photoFor = (poi: Poi): ImageSlot | undefined =>
  IMAGE_SLOTS.find((s) => s.poiId === poi.id && s.kind === "photo" && s.status === "done");

export const sceneFor = (poiId: string): ImageSlot | undefined =>
  IMAGE_SLOTS.find((s) => s.poiId === poiId && s.kind === "scene" && s.status === "done");

/** How much of the manifest is actually shot. Shown on the business demo. */
export const imageProgress = () => ({
  total: IMAGE_SLOTS.length,
  done: IMAGE_SLOTS.filter((s) => s.status === "done").length,
});
