import { useEffect, useState, type ReactNode } from "react";
import { ADAPT_LABELS } from "../types";
import type { AdaptTrigger } from "../types";

export type ScreenId = "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s7" | "s8" | "s9";

/** Narration for the projector: the left rail says what is on screen, the right
 *  rail says why it is built that way. Both come straight from the strategy
 *  documents so the presenter never has to improvise the argument. */
const NARRATION: Record<
  string,
  { kicker: string; head: string; points: string[]; foot: string; whyHead: string; why: string[] }
> = {
  s0: {
    kicker: "現在畫面",
    head: "四個人，一起決定",
    points: [
      "不是一個人排好再問大家意見",
      "每位旅伴各自輸入限制，AI 才有東西可以協調",
      "行程規劃是入口，不是護城河",
    ],
    foot: "市場痛點分析：85%+ 台灣受訪者規劃一週團體旅行超過 10 小時，39% 超過 40 小時。",
    whyHead: "為什麼從人開始",
    why: [
      "現有工具都從「目的地」開始，所以只能排程",
      "從「人」開始，才有辦法談妥協",
    ],
  },
  s1: {
    kicker: "現在畫面",
    head: "先收限制，不收願望",
    points: [
      "必去標 🔒 —— AI 永遠不會把它刪掉",
      "預算、體力、作息都是硬限制，不是偏好",
      "每填完一個人，上方衝突數即時跳動",
    ],
    foot: "「AI 若只是再推薦更多景點，可能反而增加決策負擔。」",
    whyHead: "為什麼是限制不是喜好",
    why: [
      "喜好可以妥協，限制不行 —— 分清楚才算得出可行解",
      "衝突要在填的當下就看到，不是等生成完才說",
    ],
  },
  s2: {
    kicker: "現在畫面",
    head: "它在協調，不是在排程",
    points: [
      "先列出 4 個衝突，且指名是誰對誰",
      "127 種組合裡排除 119 種 —— 因為有人的不可妥協項被犧牲",
      "剩下的才拿出來給你選",
    ],
    foot: "現有 App 能回答「A 到 B 要 35 分鐘」，回答不了「四個人該怎麼妥協」。",
    whyHead: "為什麼要秀出被排除的",
    why: [
      "只給答案是黑箱，給了取捨才叫協調",
      "使用者要能反駁 AI，才會信任 AI",
    ],
  },
  s3: {
    kicker: "現在畫面",
    head: "這不是行程，是一份協議",
    points: [
      "四個人的滿足度分開算，不平均",
      "每張折衷卡都寫明：誰被滿足、誰付出代價",
      "按「換一個方案」，四個數字同時重算",
    ],
    foot: "「AI 需要能解釋為什麼這樣排、誰的需求被滿足、哪裡需要妥協。」",
    whyHead: "為什麼不做到 100%",
    why: [
      "共識度上限鎖在 92%，永遠有人讓步",
      "宣稱所有人都滿意的產品，沒有人會相信",
    ],
  },
  s4: {
    kicker: "現在畫面",
    head: "每一站都知道是為誰排的",
    points: [
      "景點卡上的色點 = 這站屬於誰",
      "D2 時間軸從中間分岔 —— 兩組人各走各的，18:30 會合",
      "拖動任何一站，立刻告訴你踩到誰的線",
    ],
    foot: "手動編輯與 AI 不是兩套系統：你改，它就重新算誰受影響。",
    whyHead: "為什麼要分頭行動",
    why: [
      "阿哲的迪士尼與小雨的不進樂園，是真正無解的衝突",
      "唯一的解就是分開走再會合 —— 沒有現有 App 排得出來",
    ],
  },
  s5: {
    kicker: "現在畫面",
    head: "兩條顏色，兩組人",
    points: [
      "地圖上的路線用旅伴色區分",
      "D2 會看到藍綠與紅紫兩條線分開又交會",
      "點任一站可跳回時間軸",
    ],
    foot: "地圖只是手段，旅程才是目的。",
    whyHead: "為什麼地圖不是重點",
    why: ["Google Maps 是絕對主場，正面打沒有勝算", "地圖在這裡只負責證明動線成立"],
  },
  s7: {
    kicker: "現在畫面",
    head: "既有資產，接在旅程裡",
    points: [
      "版型與現有 App 一致：插畫、播放器、創作者、留言區",
      "播放時字幕逐句高亮",
      "聽完自動接上對應的變現卡",
    ],
    foot: "空白在 Local Story → Local Commerce 的銜接，目前沒有產品串起來。",
    whyHead: "為什麼語音不是主角",
    why: [
      "競品報告：語音導覽帶不來下載，它是轉換放大器",
      "它的價值在旅程中被觸發，不在商店頁被下載",
    ],
  },
  s8: {
    kicker: "現在畫面",
    head: "交易接在需求節點",
    points: [
      "每張卡的理由都是真實摩擦，不是廣告詞",
      "記帳分帳直接回應阿凱的預算限制",
      "OTA 導購是 T0 唯一零前提的收入來源",
    ],
    foot: "商業模式 T0：OTA Affiliate Commission + Premium 訂閱。",
    whyHead: "為什麼不做商城",
    why: ["自建交易在 T0 是負債不是資產", "先驗證點擊與轉換，再談抽成"],
  },
  s9: {
    kicker: "現在畫面",
    head: "沒有行程規劃，收入公式鎖死為零",
    points: [
      "六個滑桿即時重算月收入",
      "把「行程建立率」歸零，整條公式歸零",
      "協調專屬指標：衝突數、共識度、換方案率、重排觸發率",
    ],
    foot: "「現在沒有行程規劃 = 行程建立率 0% = 行銷預算全打水漂。」",
    whyHead: "為什麼要追蹤協調",
    why: ["換方案率證明使用者真的在談判", "重排觸發率證明 Companion 有需求"],
  },
};

export function Shell({
  screen,
  children,
  onNav,
  onAdapt,
  onReset,
  adaptDisabled,
}: {
  screen: ScreenId;
  children: ReactNode;
  onNav: (s: ScreenId) => void;
  onAdapt: (t: AdaptTrigger) => void;
  onReset: () => void;
  adaptDisabled: boolean;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 130) / 852));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const n = NARRATION[screen] ?? NARRATION.s0;

  return (
    <div className="min-h-screen">
      <div className="flex items-start justify-center gap-11 px-7 pb-28 pt-7">
        <aside className="hidden w-[300px] shrink-0 pt-16 xl:block">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-orange">
            {n.kicker}
          </div>
          <h3 className="mt-3 font-serif text-[30px] leading-[1.25] text-ink">{n.head}</h3>
          <ul className="mt-4 space-y-2.5">
            {n.points.map((p) => (
              <li key={p} className="relative pl-4.5 text-[14.5px] leading-[1.65] text-ink-soft">
                <span className="absolute left-0 top-[9px] size-1.5 rounded-full bg-orange" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-3.5 text-xs leading-relaxed text-ink-mute">
            {n.foot}
          </p>
        </aside>

        <div style={{ height: 852 * scale }}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
            <div className="relative h-[852px] w-[393px] rounded-[52px] bg-[#0f0806] p-[11px] shadow-[0_26px_70px_rgba(28,13,10,.34)]">
              <div className="absolute left-1/2 top-3.5 z-50 h-[30px] w-[118px] -translate-x-1/2 rounded-full bg-[#0f0806]" />
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[42px] bg-white">
                {children}
              </div>
              <div className="absolute bottom-2 left-1/2 z-50 h-[5px] w-[132px] -translate-x-1/2 rounded-full bg-black/25" />
            </div>
          </div>
        </div>

        <aside className="hidden w-[300px] shrink-0 pt-16 xl:block">
          <div className="text-[13px] font-black uppercase tracking-[0.18em] text-ink-mute">
            {n.whyHead}
          </div>
          <ul className="mt-4 space-y-2.5">
            {n.why.map((p) => (
              <li key={p} className="relative pl-4.5 text-[14px] leading-[1.65] text-ink-mute">
                <span className="absolute left-0 top-[9px] size-1.5 rounded-full bg-ink/25" />
                {p}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <PresenterBar
        screen={screen}
        onNav={onNav}
        onAdapt={onAdapt}
        onReset={onReset}
        adaptDisabled={adaptDisabled}
      />
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 text-[10.5px] font-bold text-ink-mute">
        Demo 模式・資料與合作關係皆為示意，非實際商業合作
      </div>
    </div>
  );
}

const FLOW: ScreenId[] = ["s0", "s1", "s2", "s3", "s4", "s8", "s9"];

function PresenterBar({
  screen,
  onNav,
  onAdapt,
  onReset,
  adaptDisabled,
}: {
  screen: ScreenId;
  onNav: (s: ScreenId) => void;
  onAdapt: (t: AdaptTrigger) => void;
  onReset: () => void;
  adaptDisabled: boolean;
}) {
  const i = FLOW.indexOf(screen);
  const btn =
    "rounded-full px-3 py-2 text-[12.5px] font-bold text-white transition hover:bg-white/12";

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink/95 px-2.5 py-1.5 shadow-[0_10px_34px_rgba(28,13,10,.4)] backdrop-blur">
      <button className={btn} onClick={() => onNav(FLOW[Math.max(0, i - 1)])}>
        ←
      </button>
      <span className="px-2 text-[10.5px] font-bold uppercase text-white/50">
        {screen}
      </span>
      <button
        className={btn}
        onClick={() => onNav(FLOW[Math.min(FLOW.length - 1, i < 0 ? 0 : i + 1)])}
      >
        →
      </button>
      <span className="mx-1 h-5 w-px bg-white/20" />
      {(Object.keys(ADAPT_LABELS) as AdaptTrigger[]).map((t) => (
        <button
          key={t}
          className={`${btn} disabled:opacity-35`}
          disabled={adaptDisabled}
          onClick={() => onAdapt(t)}
          title={adaptDisabled ? "先進到行程頁再觸發" : ADAPT_LABELS[t].label}
        >
          {ADAPT_LABELS[t].icon} {ADAPT_LABELS[t].label}
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-white/20" />
      <button className={btn} onClick={() => onNav("s7")}>
        ▶ 語音
      </button>
      <button className={btn} onClick={() => onNav("s9")}>
        📊 後台
      </button>
      <button className={btn} onClick={onReset} title="重置 Demo 數據">
        ⟲
      </button>
    </div>
  );
}
