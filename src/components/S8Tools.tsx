import { COMMERCE, COMMERCE_BY_ID } from "../data/commerce";
import { TRAVELLERS } from "../data/people";
import { track } from "../lib/track";
import type { Trip } from "../types";
import { Avatar, SectionLabel } from "./bits";
import { StatusBar } from "./S0Start";

const GRID = [
  { id: "nex", icon: "✈️", label: "找機票" },
  { id: "hotel-asakusa", icon: "🛏", label: "飯店優惠" },
  { id: "nrt-transfer", icon: "🚐", label: "機場接送" },
  { id: "disney-1day", icon: "🎟", label: "門票 & 觀光行程" },
  { id: "esim", icon: "📶", label: "eSIM" },
  { id: "kimono", icon: "👘", label: "體驗活動" },
];

/** Four people, one budget-capped member: splitting the bill is not a nice-to-have
 *  here, it is the direct continuation of A-Kai's constraint from screen one. */
const LEDGER = [
  { id: "che" as const, paid: 28400, share: 21150 },
  { id: "yu" as const, paid: 12800, share: 21150 },
  { id: "kai" as const, paid: 19600, share: 21150 },
  { id: "ting" as const, paid: 23800, share: 21150 },
];

export function S8Tools({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex shrink-0 items-center gap-2 px-4 pb-2">
        <button
          onClick={onBack}
          className="grid size-8 place-items-center rounded-full bg-cream text-[14px] font-bold"
        >
          ‹
        </button>
        <span className="font-serif text-[18px] text-ink">行程工具</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 no-scrollbar">
        <div className="grid grid-cols-3 gap-2">
          {GRID.map((g) => (
            <button
              key={g.id}
              onClick={() => track("ota_click", { item: g.id, from: "tools" })}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-white py-3.5"
            >
              <span className="text-[22px]">{g.icon}</span>
              <span className="text-[11px] font-bold text-ink-soft">{g.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <SectionLabel>記帳分帳</SectionLabel>
            <span className="num text-[11px] font-bold text-ink-mute">
              共 ¥{LEDGER.reduce((a, l) => a + l.paid, 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {LEDGER.map((l) => {
              const delta = l.paid - l.share;
              return (
                <div key={l.id} className="flex items-center gap-2.5">
                  <Avatar id={l.id} size={26} />
                  <span className="text-[12.5px] font-bold text-ink">
                    {TRAVELLERS.find((t) => t.id === l.id)?.name}
                  </span>
                  <span className="num ml-auto text-[11.5px] text-ink-mute">
                    已付 ¥{l.paid.toLocaleString()}
                  </span>
                  <span
                    className={`num w-20 text-right text-[12px] font-black ${
                      delta >= 0 ? "text-good" : "text-bad"
                    }`}
                  >
                    {delta >= 0 ? "應收 " : "應付 "}¥{Math.abs(delta).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
          <button className="mt-3 w-full rounded-full bg-ink py-2.5 text-[12.5px] font-bold text-white">
            一鍵結算
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
          <span className="text-[20px]">⬇</span>
          <div className="flex-1">
            <div className="text-[13px] font-black text-ink">離線行程</div>
            <div className="text-[11px] text-ink-mute">
              地圖、語音、優惠券・15.4 MB
            </div>
          </div>
          <button className="rounded-full border-[1.4px] border-line-strong px-3 py-1.5 text-[11.5px] font-bold text-ink-soft">
            下載
          </button>
        </div>

        <div className="mt-4">
          <SectionLabel>這趟行程可觸發的交易</SectionLabel>
          <div className="mt-2 space-y-1.5">
            {COMMERCE.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2"
              >
                <span className="text-[10px] font-black text-orange">
                  {c.provider}
                </span>
                <span className="flex-1 truncate text-[12px] font-bold text-ink">
                  {c.title}
                </span>
                <span className="num text-[11.5px] font-bold text-ink-mute">
                  {c.currency === "JPY" ? "¥" : "NT$"}
                  {c.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-ink/5 p-3 text-[11px] leading-relaxed text-ink-mute">
          T0 只做 OTA 導購與 Premium 訂閱 —— 兩者都零商家前提。自建商城、商家後台與
          交易抽成留到 T1／T2，在 {trip.destination} 這個灘頭堡驗證轉換率之後再談。
        </p>
      </div>
    </div>
  );
}

export function commerceTitle(id: string) {
  return COMMERCE_BY_ID[id]?.title ?? id;
}
