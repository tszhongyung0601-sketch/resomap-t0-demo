import { useEffect, useMemo, useState } from "react";
import { poi } from "../data";
import { story } from "../data/stories";
import { createPlayer, formatClock, splitSentences, type VoicePlayer } from "../lib/speech";
import { track } from "../lib/track";
import { Button, Sheet, Tag, Thumb } from "./ui";

/**
 * Arrival prompt.
 *
 * This is the only place the voice guide announces itself unprompted, and it
 * only fires once you are standing in front of the thing. A story about 赤崁樓
 * is worth three minutes when you can see the banyan tree it describes; on the
 * home screen it is just another card asking for attention.
 */
export function ArrivalSheet({
  poiId,
  onPlay,
  onLater,
}: {
  poiId: string;
  onPlay: () => void;
  onLater: () => void;
}) {
  const p = poi(poiId);
  const s = story(p?.storyId);
  useEffect(() => {
    if (s) track("story_play", { poiId });
  }, [s, poiId]);
  if (!p || !s) return null;

  return (
    <Sheet open onClose={onLater}>
      <div className="px-5 pb-2 pt-2">
        <div className="flex items-center gap-3">
          <Thumb emoji={p.emoji} tint={p.tint} size={56} />
          <div>
            <div className="text-[13px] text-ink-3">你到了</div>
            <div className="text-[19px] font-bold text-ink">{p.name}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-surface p-4">
          <span className="text-[20px]">🎧</span>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold text-ink">聽這裡的故事</div>
            <div className="num text-[12.5px] text-ink-3">{s.minutes} 分鐘</div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button onClick={onPlay}>開始播放</Button>
          <Button variant="ghost" onClick={onLater}>
            稍後
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/**
 * The player keeps ResoMap's own identity — the illustration, the language, who
 * recorded it, how many people have heard it, one way to say it was good — and
 * nothing else. No queue, no speed control, no comment thread. It is a
 * three-minute story you listen to standing up, not a podcast app.
 */
export function StoryPlayer({
  poiId,
  onClose,
}: {
  poiId: string;
  onClose: () => void;
}) {
  const p = poi(poiId);
  const s = story(p?.storyId);
  const sentences = useMemo(() => (s ? splitSentences(s.body) : []), [s]);

  const [player, setPlayer] = useState<VoicePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!sentences.length) return;
    const v = createPlayer(
      sentences,
      {
        onSentence: setLine,
        onTick: setElapsed,
        onEnd: () => {
          setPlaying(false);
          track("story_finish", { poiId });
        },
      },
      "zh-TW",
    );
    setPlayer(v);
    // Autoplay: they already tapped 開始播放 to get here.
    v.play();
    setPlaying(true);
    return () => {
      v.stop();
      setPlayer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences]);

  if (!p || !s) return null;
  const total = player?.totalSeconds ?? 0;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg">
      <div
        className="relative grid h-[38%] shrink-0 place-items-center text-[72px]"
        style={{ background: p.tint }}
      >
        {p.emoji}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-bg/90 text-[17px]"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-5">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-surface px-2 py-1 text-[11.5px] font-semibold text-ink-2">
            中文
          </span>
          {player?.silent && (
            <span className="rounded-md bg-surface px-2 py-1 text-[11.5px] font-semibold text-ink-3">
              字幕模式
            </span>
          )}
        </div>

        <h1 className="mt-2.5 text-[19px] font-bold leading-snug text-ink">{s.title}</h1>

        {/* Play counts are the one number in this app that could be mistaken
            for traction. There is none — so the label goes next to them. */}
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-3">
          <span className="truncate">{s.narrator}</span>
          <span>·</span>
          <span className="num shrink-0">{s.plays.toLocaleString()} 次播放</span>
          <Tag kind="demo" />
          <button
            onClick={() => setLiked((v) => !v)}
            aria-label="喜歡"
            className={`num ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 ${
              liked ? "bg-brand-wash text-brand" : "bg-surface text-ink-3"
            }`}
          >
            ♥ {(s.likes + (liked ? 1 : 0)).toLocaleString()}
          </button>
        </div>

        <div
          className="mt-5 cursor-pointer py-2"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            player?.seekSentence(
              Math.floor(((e.clientX - r.left) / r.width) * sentences.length),
            );
          }}
        >
          <div className="relative h-1 rounded-full bg-surface-2">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-brand"
              style={{ width: `${pct}%`, transition: "width .12s linear" }}
            />
          </div>
        </div>
        <div className="num flex justify-between text-[11.5px] text-ink-3">
          <span>{formatClock(elapsed)}</span>
          <span>{formatClock(total)}</span>
        </div>

        <div className="mt-4 flex items-center justify-center gap-8">
          <button
            onClick={() => player?.seekSeconds(-10)}
            className="text-[13px] font-bold text-ink-2"
          >
            ↺ 10
          </button>
          <button
            onClick={() => {
              if (!player) return;
              if (playing) {
                player.pause();
                setPlaying(false);
              } else {
                player.play();
                setPlaying(true);
              }
            }}
            className="grid size-16 place-items-center rounded-full bg-brand text-[22px] text-white active:bg-brand-press"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            onClick={() => player?.seekSeconds(10)}
            className="text-[13px] font-bold text-ink-2"
          >
            10 ↻
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto no-scrollbar">
          {sentences.map((t, i) => (
            <p
              key={i}
              className={`mb-2 text-[14.5px] leading-[1.8] transition ${
                i === line && playing ? "font-semibold text-ink" : "text-ink-3"
              }`}
            >
              {t}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
