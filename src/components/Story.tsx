import { useEffect, useMemo, useState } from "react";
import { spot } from "../data/demo";
import {
  createPlayer,
  formatClock,
  splitSentences,
  type VoicePlayer,
} from "../lib/speech";
import { Button, Sheet, Thumb } from "./ui";

/**
 * Arrival prompt. This is the only place the voice guide announces itself —
 * it belongs to standing in front of the temple, not to the home screen.
 */
export function ArrivalSheet({
  spotId,
  open,
  onPlay,
  onLater,
}: {
  spotId: string;
  open: boolean;
  onPlay: () => void;
  onLater: () => void;
}) {
  const s = spot(spotId);
  if (!s?.story) return null;
  return (
    <Sheet open={open} onClose={onLater}>
      <div className="px-5 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <Thumb emoji={s.emoji} tint={s.tint} size={56} />
          <div>
            <div className="text-[13px] text-ink-3">你到了</div>
            <div className="text-[19px] font-bold text-ink">{s.name}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-surface p-4">
          <span className="text-[20px]">🎧</span>
          <div className="flex-1">
            <div className="text-[14.5px] font-semibold text-ink">聽這裡的故事</div>
            <div className="num text-[12.5px] text-ink-3">{s.story.minutes} 分鐘</div>
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
 * The player stays deliberately plain: art, title, one transport control, a
 * progress bar, language, transcript. No queue, no speed control, no social
 * row — this is a three-minute story, not a podcast app.
 */
export function StoryPlayer({
  spotId,
  onClose,
  onFinish,
}: {
  spotId: string;
  onClose: () => void;
  onFinish?: () => void;
}) {
  const s = spot(spotId);
  const story = s?.story;
  const sentences = useMemo(
    () => (story ? splitSentences(story.body) : []),
    [story],
  );

  const [player, setPlayer] = useState<VoicePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!sentences.length) return;
    const p = createPlayer(
      sentences,
      {
        onSentence: setLine,
        onTick: setElapsed,
        onEnd: () => {
          setPlaying(false);
          onFinish?.();
        },
      },
      "zh-TW",
    );
    setPlayer(p);
    // Autoplay: the traveller already tapped "開始播放" to get here.
    p.play();
    setPlaying(true);
    return () => {
      p.stop();
      setPlayer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences]);

  if (!s || !story) return null;
  const total = player?.totalSeconds ?? 0;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg">
      <div
        className="relative grid h-[42%] place-items-center text-[72px]"
        style={{ background: s.tint }}
      >
        {s.emoji}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-bg/90 text-[17px]"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-8 pt-5">
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

        <h1 className="mt-2.5 text-[19px] font-bold leading-snug text-ink">
          {story.title}
        </h1>

        {/* ResoMap's own guide identity — who recorded it, how many people have
            heard it, and one way to say it was good. Kept to a single line;
            comments and reporting live behind the app's existing screens. */}
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-3">
          <span className="truncate">{story.narrator}</span>
          <span>·</span>
          <span className="num">{story.plays.toLocaleString()} 次播放</span>
          <button
            onClick={() => setLiked((v) => !v)}
            aria-label="喜歡"
            className={`num ml-auto flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 ${
              liked ? "bg-brand-wash text-brand" : "bg-surface text-ink-3"
            }`}
          >
            ♥ {story.likes + (liked ? 1 : 0)}
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
