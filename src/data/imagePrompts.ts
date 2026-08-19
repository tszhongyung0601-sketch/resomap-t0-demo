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
  {
    poiId: "hualien-cultural",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "花蓮文創園區的兩層木造與洗石子建築，前景草地與檳榔樹，藍天。",
    status: "done",
    src: "photos/hualien-cultural-card.webp",
    srcLarge: "photos/hualien-cultural-hero.webp",
    credit: {
      author: "lienyuan lee",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E8%8A%B1%E8%93%AE%E6%96%87%E5%89%B5%E7%94%A2%E6%A5%AD%E5%9C%92%E5%8D%80%20Hualian%20Cultural%20and%20Creative%20Industries%20Park%20-%20panoramio.jpg",
    },
  },
  {
    poiId: "dongdamen",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "東大門夜市熱炒攤門面，菜單牌、攤商與客人。",
    status: "done",
    src: "photos/dongdamen-card.webp",
    srcLarge: "photos/dongdamen-hero.webp",
    credit: {
      author: "Sinchen.Lin",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A39-%E8%8A%B1%E8%93%AE%E6%9D%B1%E5%A4%A7%E9%96%80%E5%A4%9C%E5%B8%82%EF%BC%8C%E6%88%91%E6%9C%80%E5%A4%AF%E7%86%B1%E7%82%92%20(28896724823).jpg",
    },
  },
  {
    poiId: "shakadang",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "砂卡礑步道的大理岩溪床與切在崖壁上的步道，兩側綠壁。",
    status: "done",
    src: "photos/shakadang-card.webp",
    srcLarge: "photos/shakadang-hero.webp",
    credit: {
      author: "lienyuan lee",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E7%A0%82%E5%8D%A1%E7%A4%91%E6%AD%A5%E9%81%93%20Shakadang%20Trail%20-%20panoramio%20(2).jpg",
    },
  },
  {
    poiId: "hualien-sugar",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "光復糖廠保存的黑色糖鐵貨車廂，後方山稜與藍天。",
    status: "done",
    src: "photos/hualien-sugar-card.webp",
    srcLarge: "photos/hualien-sugar-hero.webp",
    credit: {
      author: "Fred Hsu",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATaiwan%202009%20GuangFu%20Sugar%20Factory%20Historical%20Train%20Exhibition%20FRD%206170.jpg",
    },
  },
  {
    poiId: "taipei-101",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "黃昏時從山邊俯瞰信義區，台北101整支塔身完整入鏡，前景是象山系的樹林，遠處觀音山稜線。",
    status: "done",
    src: "photos/taipei-101-card.webp",
    srcLarge: "photos/taipei-101-hero.webp",
    credit: {
      author: "CEphoto, Uwe Aranas",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATaipei%20Taiwan%20Taipei-101-Tower-01.jpg",
    },
  },
  {
    poiId: "cks-memorial",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "從自由廣場正對中正紀念堂的全景：白色主體、藍色八角攢尖頂、正面大階梯與兩側白石欄杆，晴天。",
    status: "done",
    src: "photos/cks-memorial-card.webp",
    srcLarge: "photos/cks-memorial-hero.webp",
    credit: {
      author: "Benlisquare",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AChiang%20Kai-shek%20Memorial%20Hall%20viewed%20from%20Liberty%20Square.jpg",
    },
  },
  {
    poiId: "npm",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "故宮正館正面：米黃牆體與綠琉璃瓦歇山頂、白石欄杆雙向階梯與一樓入口，背後是士林的樹林山坡，藍天。",
    status: "done",
    src: "photos/npm-card.webp",
    srcLarge: "photos/npm-hero.webp",
    credit: {
      author: "Jason Zhang",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://commons.wikimedia.org/wiki/File%3ANational%20Palace%20Museum%2C%20Taipei.jpg",
    },
  },
  {
    poiId: "raohe",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "饒河街夜市街心夜景，遠端是亮著燈泡的「饒河街觀光夜市」牌樓，兩側攤棚、霓虹招牌與逛街人潮。",
    status: "done",
    src: "photos/raohe-card.webp",
    srcLarge: "photos/raohe-hero.webp",
    credit: {
      author: "Ji Soo Song",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ARaohe%20Night%20Market%202022.jpg",
    },
  },
  {
    poiId: "yongkang",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "永康街口的黃色芒果冰名店「思慕昔」轉角店面，招牌掛滿雪花冰照片，門口排著一長列人。",
    status: "done",
    src: "photos/yongkang-card.webp",
    srcLarge: "photos/yongkang-hero.webp",
    credit: {
      author: "Sun Taro",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2015-05-02%20a%20baobing%20restaurant%20at%20Yongkang%20Street%2C%20Taipei.jpg",
    },
  },
  {
    poiId: "beitou",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "北投溫泉博物館：紅磚配深色木造的日治時期公共浴場，二樓拱廊掛紅燈籠，前方草坪與行人，藍天。",
    status: "done",
    src: "photos/beitou-card.webp",
    srcLarge: "photos/beitou-hero.webp",
    credit: {
      author: "小三可",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E5%8F%B0%E5%8C%97%E5%8C%97%E6%8A%95%E6%BA%AB%E6%B3%89%E5%8D%9A%E7%89%A9%E9%A4%A8.jpg",
    },
  },
  {
    poiId: "maokong",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "貓空纜車一整排車廂懸在纜索上跨過翠綠山谷，左側可見支撐塔柱，晴天白雲。",
    status: "done",
    src: "photos/maokong-card.webp",
    srcLarge: "photos/maokong-hero.webp",
    credit: {
      author: "玄史生",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AMaokong%20Gondola%20between%20Taipei%20Zoo%20South%20and%20Zhinan%20Temple%2020131002.jpg",
    },
  },
  {
    poiId: "elephant-mtn",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "象山六巨石上坐滿等日落的人與攝影者，剪影後方是台北101與整片市區，太陽壓在天際線上。",
    status: "done",
    src: "photos/elephant-mtn-card.webp",
    srcLarge: "photos/elephant-mtn-hero.webp",
    credit: {
      author: "Felix Filnkoessl",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2017-07-16%20View%20of%20Taipei%20101%2C%20taken%20from%20Elephant%20Mountain.jpg",
    },
  },
  {
    poiId: "tamsui",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "淡水老街中正路的行人街景，兩側店家招牌（阿英海石花、淡水阿給、炸蝦捲）與遮雨棚，街上滿是逛街人潮。",
    status: "done",
    src: "photos/tamsui-card.webp",
    srcLarge: "photos/tamsui-hero.webp",
    credit: {
      author: "susan curry",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATamsui%20%E6%B7%A1%E6%B0%B4%E8%80%81%E8%A1%97%20-%20panoramio%20(36).jpg",
    },
  },
  {
    poiId: "yehliu",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "野柳地質公園蕈狀岩區的高處全景，黃色岩層上散布數十顆蕈狀岩、遊客與木棧道，後方是海岸與野柳岬防波堤。",
    status: "done",
    src: "photos/yehliu-card.webp",
    srcLarge: "photos/yehliu-hero.webp",
    credit: {
      author: "Ding Kezhong",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ADSC09559%E9%87%8E%E6%9F%B3%E6%99%AF%E8%A7%82%E4%B8%80%E8%A7%92.jpg",
    },
  },
  {
    poiId: "shifen",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "十分老街的平溪線鐵軌上，一對遊客攤開橘色天燈準備施放，鐵軌兩側是老街店家與圍觀人群。",
    status: "done",
    src: "photos/shifen-card.webp",
    srcLarge: "photos/shifen-hero.webp",
    credit: {
      author: "Chainwit.",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ANew%20Taipei%20-%20Shifen%20Old%20Street%20%E5%8D%81%E5%88%86%E8%80%81%E8%A1%97%20(2025)%20-%20IMG%2006.jpg",
    },
  },
  {
    poiId: "fort-domingo",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "紅毛城朱紅色方形主堡與屋頂旗桿上的國旗，右側接英國領事官邸紅磚拱廊，牆下掛著九面歷代管理國旗幟，遊客沿石階上行。",
    status: "done",
    src: "photos/fort-domingo-card.webp",
    srcLarge: "photos/fort-domingo-hero.webp",
    credit: {
      author: "Adam Jones",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AFort%20Santo%20Domingo%20with%20ROC%20national%20flag%2020190518.jpg",
    },
  },
  {
    poiId: "shenji",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "審計新村兩層樓日式宿舍改造的文創聚落，紅瓦屋頂、掛在牆上的自行車、三角旗與白色market傘下的市集攤位與人潮。",
    status: "done",
    src: "photos/shenji-card.webp",
    srcLarge: "photos/shenji-hero.webp",
    credit: {
      author: "Fcuk1203",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E5%AF%A9%E8%A8%88%E6%96%B0%E6%9D%91%E6%96%87%E5%89%B5%E8%81%9A%E8%90%BD.jpg",
    },
  },
  {
    poiId: "gaomei",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "高美濕地的弧形木棧道在夕陽下延伸入潮間帶，棧道上遊客剪影，天空整片橘紅雲彩並倒映在泥灘水面。",
    status: "done",
    src: "photos/gaomei-card.webp",
    srcLarge: "photos/gaomei-hero.webp",
    credit: {
      author: "潘麗峰",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AGaomei%20Wetland%20sunset%20DSC%205441-2.jpg",
    },
  },
  {
    poiId: "rainbow-village",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "彩虹眷村一棟畫滿彩繪的老平房山牆，藍底與紅底上寫著「知足」「保庇」「忠義肝膽」，貓、鴨與人物圖案，屋簷下掛彩繪燈籠，藍天白雲。",
    status: "done",
    src: "photos/rainbow-village-card.webp",
    srcLarge: "photos/rainbow-village-hero.webp",
    credit: {
      author: "allanlau2000",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://commons.wikimedia.org/wiki/File%3ARainbow%20village%20Taichung.jpg",
    },
  },
  {
    poiId: "fengjia",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "逢甲夜市入口的「逢甲國際觀光夜市 Feng Chia Night Market」燈飾拱門，兩側整排霓虹招牌，夜間街道擠滿人潮。",
    status: "done",
    src: "photos/fengjia-card.webp",
    srcLarge: "photos/fengjia-hero.webp",
    credit: {
      author: "Chensiyuan",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A1%20fengjia%20night%20market%202019.jpg",
    },
  },
  {
    poiId: "tainan-confucius",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "大成殿正面全景，重簷歇山頂與屋脊青龍剪黏完整入鏡，前方紅色欄杆與磚砌庭院，藍天白雲。",
    status: "done",
    src: "photos/tainan-confucius-card.webp",
    srcLarge: "photos/tainan-confucius-hero.webp",
    credit: {
      author: "Felix Filnkoessl",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATainan%20Confucius%20Temple%20in%20the%20afternoon%20on%208th%20August%202019.jpg",
    },
  },
  {
    poiId: "fuzhong",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "泮宮石坊整座石牌坊，穿過拱門可見府中街石板路兩側店家與遮陽棚。",
    status: "done",
    src: "photos/fuzhong-card.webp",
    srcLarge: "photos/fuzhong-hero.webp",
    credit: {
      author: "Chainwit.",
      licence: "CC BY 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AP%C3%A0n%20G%C5%8Dng%20Sh%C3%AD%20F%C4%81ng%20Tainan%20%E6%B3%AE%E5%AE%AE%E7%9F%B3%E5%9D%8A%20(2026)%20-%20IMG%2001.jpg",
    },
  },
  {
    poiId: "guohua",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "國華街街景，左側連棟騎樓小吃攤與招牌、右側水果攤與紅色矮凳，路面往前延伸。",
    status: "done",
    src: "photos/guohua-card.webp",
    srcLarge: "photos/guohua-hero.webp",
    credit: {
      author: "Andrzej Otrębski",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATainan%20Guohua%20St%201.jpg",
    },
  },
  {
    poiId: "hayashi",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "林百貨白天外觀全景，轉角圓弧塔樓、圓窗與頂樓旗桿完整入鏡，路口斑馬線與車流。",
    status: "done",
    src: "photos/hayashi-card.webp",
    srcLarge: "photos/hayashi-hero.webp",
    credit: {
      author: "WEI, WAN-CHEN（魏琬臻）",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E5%8E%9F%E6%9E%97%E7%99%BE%E8%B2%A8%E5%BA%97-1.jpg",
    },
  },
  {
    poiId: "anping-tree",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "安平樹屋的榕樹氣根像瀑布一樣覆蓋磚牆與門洞，遊客正從門口進出。",
    status: "done",
    src: "photos/anping-tree-card.webp",
    srcLarge: "photos/anping-tree-hero.webp",
    credit: {
      author: "Sun Taro",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2015-05-01%20Anping%20Tree%20House.jpg",
    },
  },
  {
    poiId: "chimei",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "奇美博物館主館正面，圓頂與希臘式列柱完整入鏡，前方大草坪與遊客。",
    status: "done",
    src: "photos/chimei-card.webp",
    srcLarge: "photos/chimei-hero.webp",
    credit: {
      author: "lienyuan lee",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E5%A5%87%E7%BE%8E%E5%8D%9A%E7%89%A9%E9%A4%A8%20Qimei%20Museum%20-%20panoramio.jpg",
    },
  },
  {
    poiId: "tainan-art",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "臺南市美術館 2 館白色量體與碎形金屬屋頂全景，入口與斜立展覽旗幟入鏡。",
    status: "done",
    src: "photos/tainan-art-card.webp",
    srcLarge: "photos/tainan-art-hero.webp",
    credit: {
      author: "Adece033090",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E8%87%BA%E5%8D%97%E5%B8%82%E7%BE%8E%E8%A1%93%E9%A4%A82%E9%A4%A8%E5%BB%BA%E7%AF%89.jpg",
    },
  },
  {
    poiId: "blueprint",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "藍晒圖文創園區入口的白線鋼構屋架，後方藍色打光牆面浮出白色房間線稿，左側老榕樹被藍光打亮。",
    status: "done",
    src: "photos/blueprint-card.webp",
    srcLarge: "photos/blueprint-hero.webp",
    credit: {
      author: "YU, CHIA-LII",
      licence: "Public domain",
      licenceUrl: "https://commons.wikimedia.org/wiki/Template:PD-self",
      source:
        "https://commons.wikimedia.org/wiki/File%3AFrontalansicht.JPG",
    },
  },
  {
    poiId: "cijin",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "旗津海水浴場的黑沙灘全景，沙灘上人群與遮陽傘、右側浪花，遠處是高雄港天際線。",
    status: "done",
    src: "photos/cijin-card.webp",
    srcLarge: "photos/cijin-hero.webp",
    credit: {
      author: "ironypoisoning",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ACijin%20Beach%2020150725.jpg",
    },
  },
  {
    poiId: "lotus-pond",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "蓮池潭龍虎塔的兩座七層寶塔，前景是潭面荷葉與拱橋，魚鱗狀藍天。",
    status: "done",
    src: "photos/lotus-pond-card.webp",
    srcLarge: "photos/lotus-pond-hero.webp",
    credit: {
      author: "CEphoto, Uwe Aranas",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AKaohsiung%20Taiwan%20Dragon-and-Tiger-Pagodas-01.jpg",
    },
  },
  {
    poiId: "weiwuying",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "衛武營戶外劇場：白色曲面量體與覆草屋頂、階梯看台，藍天。",
    status: "done",
    src: "photos/weiwuying-card.webp",
    srcLarge: "photos/weiwuying-hero.webp",
    credit: {
      author: "yunlin2003",
      licence: "CC BY-SA 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E6%88%B6%E5%A4%96%E5%8A%87%E5%A0%B4%20Outdoor%20Theater%20(46812104541).jpg",
    },
  },
  {
    poiId: "liuhe",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "六合夜市入夜後的霓虹街廓，兩側招牌（六合觀光夜市、九福 HOTEL）與滿街人潮。",
    status: "done",
    src: "photos/liuhe-card.webp",
    srcLarge: "photos/liuhe-hero.webp",
    credit: {
      author: "Zairon",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3AKaohsiung%20Liuhe%20Night%20Street%20Market%204.jpg",
    },
  },
  {
    poiId: "jiaoxi",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "礁溪湯圍溝溫泉公園的木棧道與溫泉水道，遊客沿池邊站，背後是礁溪的山稜與黃昏天色。",
    status: "done",
    src: "photos/jiaoxi-card.webp",
    srcLarge: "photos/jiaoxi-hero.webp",
    credit: {
      author: "Yu tptw",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E6%B9%AF%E5%9C%8D%E6%BA%9D%E6%99%AF%E8%A7%80%E6%B1%A0.jpg",
    },
  },
  {
    poiId: "luodong-night",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "羅東夜市傍晚的攤販街，兩側亮起的招牌與棚架、街中人潮。",
    status: "done",
    src: "photos/luodong-night-card.webp",
    srcLarge: "photos/luodong-night-hero.webp",
    credit: {
      author: "tomscoffin",
      licence: "CC BY 2.0",
      licenceUrl: "https://creativecommons.org/licenses/by/2.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A2014-01-29%20Luodong%20Night%20Market%2001.jpg",
    },
  },
  {
    poiId: "wufengchi",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "五峰旗瀑布主瀑：高崖上兩段落差的白色水流，兩側是長滿蕨類與苔的岩壁，底下青苔巨石。",
    status: "done",
    src: "photos/wufengchi-card.webp",
    srcLarge: "photos/wufengchi-hero.webp",
    credit: {
      author: "Wl02460852",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://commons.wikimedia.org/wiki/File%3AYilan%20Wufengqi%20Waterfall-%E5%AE%9C%E8%98%AD-%E4%BA%94%E5%B3%B0%E6%97%97%E7%80%91%E5%B8%83.jpg",
    },
  },
  {
    poiId: "sanxiantai",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "跨海八拱橋整條橫過畫面，橋上有遊客，左側是三仙台島的三塊礁岩，前景翻白的湧浪打上礁岩海岸，白天藍天多雲。",
    status: "done",
    src: "photos/sanxiantai-card.webp",
    srcLarge: "photos/sanxiantai-hero.webp",
    credit: {
      author: "CEphoto, Uwe Aranas",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3ATaitung-County%20Taiwan%20Sansiantai-Bridge-01.jpg",
    },
  },
  {
    poiId: "brown-blvd",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "站在路面中央拍的伯朗大道：筆直柏油路帶著黃色分向線直伸到地平線，兩側整片無電線桿的稻田，正前方是中央山脈，深藍天。",
    status: "done",
    src: "photos/brown-blvd-card.webp",
    srcLarge: "photos/brown-blvd-hero.webp",
    credit: {
      author: "lienyuan lee",
      licence: "CC BY 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by/3.0",
      source:
        "https://commons.wikimedia.org/wiki/File%3A%E4%BC%AF%E6%9C%97%E5%A4%A7%E9%81%93%20Mr%20Brown%20Coffee%20Avenue%20-%20panoramio.jpg",
    },
  },
  {
    poiId: "taitung-forest",
    kind: "photo",
    aspectRatio: "4:3",
    minLongEdge: 1400,
    prompt: "台東森林公園的琵琶湖，無風湖面把木麻黃防風林與藍天白雲整片倒映出來，右後方看得到沿湖的木棧橋與步道。",
    status: "done",
    src: "photos/taitung-forest-card.webp",
    srcLarge: "photos/taitung-forest-hero.webp",
    credit: {
      author: "Moran Tsai",
      licence: "CC0",
      licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
      source:
        "https://commons.wikimedia.org/wiki/File%3ASky%20above%20Pipa%20Lake.jpg",
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
