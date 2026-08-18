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

/**
 * Who took it and under what licence.
 *
 * Not a nicety: every CC licence except CC0 *requires* attribution, so a photo
 * shipped without this is a licence breach rather than an untidy caption. The
 * POI page prints it under the image.
 */
export interface Credit {
  /** The photographer, as Commons names them. */
  author: string;
  /** "CC BY-SA 4.0" — printed verbatim, never paraphrased. */
  licence: string;
  /** The licence deed, so the claim is checkable. */
  licenceUrl: string;
  /** The file's Commons page, which carries the full provenance. */
  source: string;
}

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
  /**
   * The card-size file (600x450). Small on purpose: the home rail shows it at
   * ~184px and 導覽庫 at ~128px, and shipping a 1600px file into a 184px slot is
   * most of the payload for none of the sharpness.
   */
  src?: string;
  /** The POI hero (1600x900). Only the screen that fills the width asks for it. */
  srcLarge?: string;
  credit?: Credit;
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
    status: "done",
    src: "photos/chihkan-card.webp",
    srcLarge: "photos/chihkan-hero.webp",
    credit: {
      author: "arurakufuyuki",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AFort%20Provintia%2004.jpg",
    },
  },
  {
    poiId: "anping-fort",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt: "安平古堡外側被榕樹根抓住的紅磚殘牆，牆面質地清楚可辨，不要只拍白色瞭望塔。",
    status: "done",
    src: "photos/anping-fort-card.webp",
    srcLarge: "photos/anping-fort-hero.webp",
    credit: {
      author: "Mk2010",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AFort%20Zeelandia%2C%20Anping%20District%2C%20Tainan%20City%20(Taiwan).jpg",
    },
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

  {
    poiId: "jiufen",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1600,
    prompt:
      "九份老街覆蓋式巷道，兩側紅燈籠與店家招牌，有人潮、有縱深。",
    status: "done",
    src: "photos/jiufen-card.webp",
    srcLarge: "photos/jiufen-hero.webp",
    credit: {
      author: "bizmac",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2008-03-08%20Jiufen%20Old%20Street%2003.jpg",
    },
  },
  {
    poiId: "taroko",
    kind: "photo",
    aspectRatio: "16:9",
    minLongEdge: 1920,
    prompt:
      "太魯閣峽谷大理岩峭壁夾出的 V 形，霧氣纏在稜線上。",
    status: "done",
    src: "photos/taroko-card.webp",
    srcLarge: "photos/taroko-hero.webp",
    credit: {
      author: "Balon Greyjoy",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://commons.wikimedia.org/wiki/File%3A20190417%20Taroko%20Gorge-13.jpg",
    },
  },
  {
    poiId: "shennong",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "神農街白天街景，兩側木造街屋二樓立面清楚，燈籠與盆栽，街道有縱深。",
    status: "done",
    src: "photos/shennong-card.webp",
    srcLarge: "photos/shennong-hero.webp",
    credit: {
      author: "Andrzej Otrębski",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATainan%20Shennong%20St%201.jpg",
    },
  },
  {
    poiId: "longshan",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "龍山寺前殿正面全貌，飛簷剪黏、紅燈籠、廟前石階，藍天。",
    status: "done",
    src: "photos/longshan-card.webp",
    srcLarge: "photos/longshan-hero.webp",
    credit: {
      author: "Ray Terrill",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2012-07-04%20Bangka%20Lungshan%20Temple.jpg",
    },
  },
  {
    poiId: "dadaocheng",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "迪化街連續街屋立面，一個畫面裡看得到三種年代的門面。",
    status: "done",
    src: "photos/dadaocheng-card.webp",
    srcLarge: "photos/dadaocheng-hero.webp",
    credit: {
      author: "Peellden",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ABuildings%20along%20Dihua%20Street%2007.23%20(10).jpg",
    },
  },
  {
    poiId: "opera-house",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "臺中國家歌劇院全棟外觀，曲面洞口與玻璃反射，藍天。",
    status: "done",
    src: "photos/opera-house-card.webp",
    srcLarge: "photos/opera-house-hero.webp",
    credit: {
      author: "Ralff Nestor Nacor",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ANational%20Taichung%20Theater%2C%20Nov%202024%20(5).jpg",
    },
  },
  {
    poiId: "pier2",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "駁二倉庫本體，裸露紅磚與 LIVE WAREHOUSE 字樣。",
    status: "done",
    src: "photos/pier2-card.webp",
    srcLarge: "photos/pier2-hero.webp",
    credit: {
      author: "ABOVE THE SKY",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ALiveWarehouse%20Kaohsiung.jpg",
    },
  },
  {
    poiId: "qixingtan",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "七星潭礫石灘與turquoise海面，後方中央山脈與棕櫚。",
    status: "done",
    src: "photos/qixingtan-card.webp",
    srcLarge: "photos/qixingtan-hero.webp",
    credit: {
      author: "Artemas Liu",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AQixingtan%20Beach%2C%20Taiwan.jpg",
    },
  },
  {
    poiId: "pine-garden",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "松園別館爬藤拱廊二層建築，前景老松與草地。",
    status: "done",
    src: "photos/pine-garden-card.webp",
    srcLarge: "photos/pine-garden-hero.webp",
    credit: {
      author: "王嘉新",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E8%8A%B1%E8%93%AE%E6%9D%BE%E5%9C%92%E5%88%A5%E9%A4%A8.jpg",
    },
  },
  {
    poiId: "traditional-arts",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "傳藝中心文昌街，紅磚街屋兩側掛紅燈籠。",
    status: "done",
    src: "photos/traditional-arts-card.webp",
    srcLarge: "photos/traditional-arts-hero.webp",
    credit: {
      author: "徐月春",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A268%2C%20Taiwan%2C%20%E5%AE%9C%E8%98%AD%E7%B8%A3%E4%BA%94%E7%B5%90%E9%84%89%E5%AD%A3%E6%96%B0%E6%9D%91%20-%20panoramio%20(12).jpg",
    },
  },
  {
    poiId: "tiehua",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "鐵花村木造建築前的街頭藝人表演，紅色遮陽傘。",
    status: "done",
    src: "photos/tiehua-card.webp",
    srcLarge: "photos/tiehua-hero.webp",
    credit: {
      author: "總統府",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A06.30%20%E7%B8%BD%E7%B5%B1%E5%8F%83%E8%A8%AA%E9%90%B5%E8%8A%B1%E6%9D%91%20(48160081556).jpg",
    },
  },
  {
    poiId: "sensoji",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "淺草寺雷門正面，大紅燈籠與金龍山匾額。",
    status: "done",
    src: "photos/sensoji-card.webp",
    srcLarge: "photos/sensoji-hero.webp",
    credit: {
      author: "Dick Thomas Johnson",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ASensoji%20(52480540067).jpg",
    },
  },
  {
    poiId: "meiji",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "明治神宮正殿，兩側大樟樹framing，前庭廣場。",
    status: "done",
    src: "photos/meiji-card.webp",
    srcLarge: "photos/meiji-hero.webp",
    credit: {
      author: "Zairon",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AMeiji-jingu%20Haupthalle%202.jpg",
    },
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
