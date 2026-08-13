import { useEffect, useMemo, useState } from "react";
import { COMMERCE_BY_ID } from "../data/commerce";
import { SPOT_BY_ID } from "../data/spots";
import {
  createPlayer,
  formatClock,
  splitSentences,
  type VoicePlayer,
} from "../lib/speech";
import { track } from "../lib/track";
import { StatusBar } from "./S0Start";

/**
 * The layout here matches the live ResoMap place page one-for-one — watercolour
 * hero, language chip, player, creator, play count, like/dislike, comments,
 * report. It is the one part of the product that already exists and works, so
 * it should look untouched.
 *
 * Two things are added without disturbing that layout: the subtitle highlights
 * sentence by sentence while speaking, and finishing the guide surfaces the
 * commerce card for whatever the listener just heard about. That second one is
 * the Local Story → Local Commerce join the competitive report says nobody has
 * built.
 */
export function S7Voice({
  spotId,
  onBack,
}: {
  spotId: string;
  onBack: () => void;
}) {
  const spot = SPOT_BY_ID[spotId];
  const voice = spot?.voice;
  const sentences = useMemo(() => (voice ? splitSentences(voice.body) : []), [voice]);

  // Held in state, not a ref: `totalSeconds` and `silent` are read during
  // render, and a ref assignment would not schedule the re-render that puts
  // them on screen.
  const [player, setPlayer] = useState<VoicePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!sentences.length) return;
    const p = createPlayer(
      sentences,
      {
        onSentence: setCurrent,
        onTick: setElapsed,
        onEnd: () => {
          setPlaying(false);
          setDone(true);
          track("voice_complete", { spot: spotId });
        },
      },
      "zh-TW",
    );
    setPlayer(p);
    setPlaying(false);
    setDone(false);
    setElapsed(0);
    setCurrent(0);
    track("voice_open", { spot: spotId });
    return () => {
      p.stop();
      setPlayer(null);
    };
  }, [sentences, spotId]);

  const total = player?.totalSeconds ?? 0;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  if (!spot || !voice) {
    return (
      <div className="flex h-full flex-col">
        <StatusBar />
        <div className="grid flex-1 place-items-center px-8 text-center">
          <div>
            <div className="text-4xl">🎧</div>
            <p className="mt-3 text-[14px] font-bold text-ink">
              這個地點目前還沒有語音導覽唷！
            </p>
            <button
              onClick={onBack}
              className="mt-5 rounded-full bg-orange px-5 py-2.5 text-[13px] font-black text-white"
            >
              回到行程
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cta = voice.ctaCommerceId ? COMMERCE_BY_ID[voice.ctaCommerceId] : null;

  return (
    <div className="flex h-full flex-col">
      <StatusBar />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Hero spotId={spot.id} emoji={spot.emoji} onBack={onBack} />

        <div className="px-5">
          <h1 className="mt-3.5 font-serif text-[23px] leading-tight text-ink">
            {spot.name}
          </h1>
          <div className="mt-1 text-[11.5px] text-ink-mute">
            {spot.area}・東京都
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-blue px-2 py-1 text-[10.5px] font-black text-white">
              {voice.lang}
            </span>
            <span className="rounded-md bg-orange px-2 py-1 text-[10.5px] font-black text-white">
              {voice.creator.name === "ResoMap AI" ? "✨ AI 生成" : "👤 創作者錄製"}
            </span>
            {player?.silent && (
              <span className="rounded-md bg-ink/8 px-2 py-1 text-[10.5px] font-black text-ink-soft">
                字幕模式
              </span>
            )}
          </div>

          <div className="mt-3.5 text-[14px] font-black leading-snug text-blue">
            {voice.title}
          </div>

          {/* player ------------------------------------------------- */}
          <div
            className="mt-2.5 cursor-pointer py-1.5"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - r.left) / r.width;
              const i = Math.floor(ratio * sentences.length);
              player?.seekSentence(i);
            }}
          >
            <div className="relative h-[5px] rounded-full bg-ink/12">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-blue"
                style={{ width: `${pct}%`, transition: "width .12s linear" }}
              />
              <div
                className="absolute top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue"
                style={{ left: `${pct}%`, transition: "left .12s linear" }}
              />
            </div>
          </div>
          <div className="num flex justify-between text-[11px] font-bold text-ink-mute">
            <span>{formatClock(elapsed)}</span>
            <span>{formatClock(total)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between px-1">
            <Ctl onClick={() => player?.seekSeconds(-10)} small>
              ↺10
            </Ctl>
            <Ctl onClick={() => player?.seekSentence(current - 1)}>◀◀</Ctl>
            <button
              onClick={() => {
                if (!player) return;
                if (playing) {
                  player.pause();
                  setPlaying(false);
                } else {
                  player.play();
                  setPlaying(true);
                  setDone(false);
                  track("voice_play", { spot: spotId });
                }
              }}
              className="grid size-14 place-items-center rounded-full bg-blue text-2xl text-white shadow-[0_6px_16px_rgba(44,107,212,.34)]"
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <Ctl onClick={() => player?.seekSentence(current + 1)}>▶▶</Ctl>
            <Ctl onClick={() => player?.seekSeconds(10)} small>
              10↻
            </Ctl>
          </div>

          <div className="mt-3 max-h-[150px] overflow-y-auto rounded-xl bg-cream p-3.5 no-scrollbar">
            {sentences.map((s, i) => (
              <p
                key={i}
                className={`mb-1.5 text-[13px] leading-[1.75] transition ${
                  i === current && playing
                    ? "font-black text-ink"
                    : "text-ink-mute"
                }`}
              >
                {s}
              </p>
            ))}
          </div>

          {player?.silent && (
            <div className="mt-2.5 rounded-lg border-[1.4px] border-orange/30 bg-[#FFF4E8] px-3 py-2 text-[11.5px] leading-relaxed text-[#8a5122]">
              這台裝置沒有安裝繁體中文語音，已切換為字幕模式。正式版改用雲端合成的音檔，不受裝置限制。
            </div>
          )}

          {/* creator ------------------------------------------------ */}
          <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange text-[13px] font-black text-white">
              {voice.creator.initial}
            </span>
            <div>
              <div className="text-[13px] font-black text-ink">{voice.creator.name}</div>
              <div className="text-[10.5px] font-bold text-ink-mute">
                上傳於 {voice.creator.uploaded}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[12px] font-bold text-ink-mute">
            <span className="num">播放次數 {voice.plays + (done ? 1 : 0)}</span>
            <span className="flex gap-3">
              <button
                onClick={() => setLiked((v) => !v)}
                className={`num font-bold ${liked ? "text-orange" : "text-ink-mute"}`}
              >
                ♥ {voice.likes + (liked ? 1 : 0)}
              </button>
              <span className="num">👎 0</span>
            </span>
          </div>

          {done && cta && (
            <div className="rm-rise mt-4">
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-black text-orange">
                ✓ 聽完了？這是最順的下一步
              </div>
              <div className="relative overflow-hidden rounded-2xl border-[1.6px] border-orange/35 bg-gradient-to-br from-[#FFF6EE] to-orange-tint p-3">
                <span className="absolute inset-y-0 left-0 w-1 bg-orange" />
                <span className="inline-block rounded-full bg-orange px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-white">
                  💰 {cta.provider}
                </span>
                <div className="mt-1.5 text-[13.5px] font-black text-ink">{cta.title}</div>
                <div className="mt-1 text-[11.5px] leading-snug text-[#6d4a34]">
                  {cta.reason}
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <span className="num font-serif text-[20px] font-bold text-orange">
                    {cta.currency === "JPY" ? "¥" : "NT$"}
                    {cta.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => track("voice_cta_click", { spot: spotId, item: cta.id })}
                    className="rounded-full bg-orange px-4 py-2 text-[12.5px] font-black text-white"
                  >
                    查看
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-line pt-3.5">
            <div className="text-[11px] font-black uppercase tracking-[0.1em] text-ink-mute">
              留言區
            </div>
            {voice.comments.map((c, i) => (
              <div key={i} className="mt-2.5 flex gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink/10 text-[11px] font-black text-ink-soft">
                  {c.initial}
                </span>
                <div className="text-[12.5px] leading-snug">
                  <b className="block text-[11.5px] text-ink">{c.name}</b>
                  <span className="text-ink-soft">{c.text}</span>
                </div>
              </div>
            ))}
            <div className="mt-3.5 flex gap-2">
              <input
                placeholder="輸入留言……"
                className="flex-1 rounded-full border-[1.4px] border-line px-3.5 py-2 text-[12.5px] outline-none"
              />
              <button className="rounded-full bg-blue px-4 py-2 text-[12.5px] font-bold text-white">
                送出
              </button>
            </div>
          </div>

          <div className="py-5 text-center text-[10.5px] text-ink-mute">檢舉語音</div>
        </div>
      </div>
    </div>
  );
}

function Ctl({
  children,
  onClick,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`grid place-items-center rounded-full text-ink-soft transition active:bg-cream ${
        small ? "size-10 text-[12px] font-black" : "size-11 text-[18px]"
      }`}
    >
      {children}
    </button>
  );
}

/** Vector "watercolour" scene: no external image, so nothing to load or break. */
function Hero({ spotId, emoji, onBack }: { spotId: string; emoji: string; onBack: () => void }) {
  const palettes: Record<string, { sky: string; hill: string; acc: string }> = {
    sensoji: { sky: "#F3DDD0", hill: "#9A6E5C", acc: "#C0392B" },
    uenopark: { sky: "#E2EDDC", hill: "#7F9A74", acc: "#8A6A3A" },
    meiji: { sky: "#DFEADF", hill: "#6F8B70", acc: "#3E6B4A" },
    shibuya: { sky: "#DCE4EE", hill: "#6E7A8C", acc: "#2C6BD4" },
    daibutsu: { sky: "#EDE3D2", hill: "#8A7A64", acc: "#7A6242" },
  };
  const p = palettes[spotId] ?? { sky: "#EFE3D2", hill: "#8A7A64", acc: "#C0742E" };
  const seed = spotId.length * 7;

  return (
    <div className="relative h-[196px] overflow-hidden bg-cream">
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="size-full">
        <defs>
          <filter id={`wc${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed={seed} />
            <feDisplacementMap in="SourceGraphic" scale="9" />
          </filter>
        </defs>
        <rect width="400" height="240" fill={p.sky} />
        <g filter={`url(#wc${seed})`}>
          <path
            d="M0,132 C70,96 120,120 190,92 C250,68 320,104 400,84 L400,240 L0,240 Z"
            fill={p.hill}
            opacity="0.28"
          />
          <path
            d="M0,168 C80,140 140,158 210,132 C280,108 340,140 400,124 L400,240 L0,240 Z"
            fill={p.hill}
            opacity="0.42"
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle
              key={i}
              cx={86 + i * 58}
              cy={108 + ((i * 37) % 18)}
              r={9 + ((i * 13) % 5)}
              fill={p.acc}
              opacity="0.75"
            />
          ))}
          <path
            d="M0,214 C90,200 180,220 270,206 C330,196 370,208 400,202 L400,240 L0,240 Z"
            fill={p.hill}
            opacity="0.55"
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[52px] opacity-70">
        {emoji}
      </div>
      <button
        onClick={onBack}
        className="absolute left-3.5 top-3.5 z-10 grid size-9 place-items-center rounded-full bg-white/92 text-[15px] font-bold shadow-[0_2px_10px_rgba(28,13,10,.15)]"
      >
        ‹
      </button>
      <div className="absolute right-3.5 top-3.5 z-10 flex gap-1.5">
        {["↗", "🔗"].map((i) => (
          <span
            key={i}
            className="grid size-9 place-items-center rounded-full bg-white/92 text-[13px] shadow-[0_2px_10px_rgba(28,13,10,.15)]"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
