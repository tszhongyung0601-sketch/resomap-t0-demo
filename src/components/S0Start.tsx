import { TRAVELLERS } from "../data/people";
import { Avatar, PrimaryButton } from "./bits";
import type { Preference, TravellerId } from "../types";

const INTENTS = [
  { id: "coordinate", icon: "🗺", label: "跟朋友一起決定行程", sub: "多人偏好協調" },
  { id: "inspire", icon: "🎈", label: "找旅遊靈感", sub: "主題探索" },
  { id: "deals", icon: "🎟", label: "找優惠套票", sub: "門票與交通" },
];

export function S0Start({
  prefs,
  onStart,
}: {
  prefs: Record<TravellerId, Preference>;
  onStart: () => void;
}) {
  const filled = TRAVELLERS.filter((t) => prefs[t.id].submitted).length;

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <StatusBar />
      <div className="flex flex-1 flex-col px-6 pb-7">
        <div className="mt-1 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-[10px] bg-orange text-[15px] font-black text-white">
            R
          </span>
          <b className="font-serif text-[19px] text-ink">ResoMap</b>
        </div>

        <h1 className="mt-9 font-serif text-[31px] leading-[1.22] text-ink">
          四個人的東京，
          <br />
          先把「去哪」決定好
        </h1>
        <p className="mt-3.5 text-[13.5px] leading-relaxed text-ink-mute">
          不是一個人排好再問大家意見。每位旅伴輸入自己的預算、必去與體力，
          ResoMap 找出最大公約數，並告訴你誰讓了什麼。
        </p>

        <div className="mt-7 rounded-2xl border border-line bg-cream-raise p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-black text-ink">東京</span>
            <span className="num text-[12px] font-bold text-ink-mute">
              11/14–11/16 · 3 天 2 夜
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {TRAVELLERS.map((t) => (
              <div key={t.id} className="relative">
                <Avatar id={t.id} size={34} dim={!prefs[t.id].submitted} />
                {prefs[t.id].submitted && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-good text-[8px] text-white">
                    ✓
                  </span>
                )}
              </div>
            ))}
            <button className="grid size-[34px] place-items-center rounded-full border border-dashed border-line-strong text-sm text-ink-mute">
              ＋
            </button>
          </div>
          <div className="num mt-2.5 text-[11.5px] font-bold text-ink-mute">
            4 人已加入 · {filled} 人已填偏好
          </div>
        </div>

        <div className="mt-6 text-[11px] font-black uppercase tracking-[0.14em] text-ink-mute">
          我想在 ResoMap…
        </div>
        <div className="mt-2.5 grid gap-2">
          {INTENTS.map((it, i) => (
            <div
              key={it.id}
              className={`flex items-center gap-3 rounded-2xl border-[1.5px] p-3.5 ${
                i === 0
                  ? "border-orange bg-orange-tint"
                  : "border-line bg-white opacity-60"
              }`}
            >
              <span className="text-[22px]">{it.icon}</span>
              <div>
                <div className="text-[14px] font-black text-ink">{it.label}</div>
                <div className="text-[11px] font-semibold text-ink-mute">{it.sub}</div>
              </div>
              {i === 0 && <span className="ml-auto text-orange">✓</span>}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-7">
          <PrimaryButton onClick={onStart}>開始協調</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`flex h-[46px] shrink-0 items-end justify-between px-6 pb-1 text-[12.5px] font-bold ${
        dark ? "text-white" : "text-ink"
      }`}
    >
      <span className="num">09:41</span>
      <span className="text-[11px] tracking-wider">▮▮▮ 5G ▓</span>
    </div>
  );
}
