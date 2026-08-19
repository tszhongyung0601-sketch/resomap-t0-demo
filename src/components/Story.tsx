import { useEffect, useMemo, useRef, useState } from "react";
import { poi } from "../data";
import { story } from "../data/stories";
import { toggleStory, useSaved } from "../lib/saved";
import { createPlayer, formatClock, splitSentences, type VoicePlayer } from "../lib/speech";
import { track } from "../lib/track";
import { Button, Headphones, Segmented, Sheet, Tag, Thumb } from "./ui";
import type { StoryLength } from "../types";

/** The one language ResoMap has actually recorded. Everything else is text. */
const SPOKEN = "中文";

/**
 * Arrival prompt.
 *
 * This is the only place the voice guide announces itself unprompted, and it
 * only fires once you are standing in front of the thing. A story about 赤崁樓
 * is worth three minutes when you can see the banyan tree it describes; on the
 * home screen it is just another card asking for attention.
 *
 * It offers both edits rather than one 開始播放, because somebody who has just
 * arrived is usually still walking. Thirty seconds is an offer they can accept
 * mid-stride; three minutes is a decision, and burying it behind a play button
 * is how it turns into an abandonment.
 */
export function ArrivalSheet({
  poiId,
  onPlay,
  onLater,
}: {
  poiId: string;
  onPlay: (length: StoryLength) => void;
  onLater: () => void;
}) {
  const p = poi(poiId);
  const s = story(p?.storyId);
  /* This sheet does NOT record story_play. It used to, on mount — so showing
     the prompt counted as a play even when the traveller tapped 稍後, while the
     POI page's own 30 秒 / 完整故事 buttons went straight to the player and were
     never counted at all. The funnel that came out could report more finishes
     than plays. The event belongs at the one point every route converges on:
     audio actually starting, in StoryPlayer. */
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
          <div className="min-w-0 flex-1">
            {/* Title only. It already ends with the hook, and a sheet that
                says the same sentence twice reads like a rendering bug. */}
            <div className="truncate text-[14.5px] font-semibold text-ink">{s.title}</div>
            <div className="mt-0.5 truncate text-[12.5px] text-ink-3">{s.narrator}</div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onPlay("short")}
            className="num inline-flex h-13 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-surface px-3 text-[14px] font-bold text-ink active:bg-surface-2"
          >
            30 秒快速聽
          </button>
          <button
            onClick={() => onPlay("full")}
            className="num inline-flex h-13 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-brand px-3 text-[14px] font-bold text-white active:bg-brand-press"
          >
            聽 {s.minutes} 分鐘完整故事
          </button>
        </div>
        <div className="mt-1">
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
 *
 * Two things it does have to be honest about. The length toggle rebuilds the
 * whole player rather than skipping ahead, because the 30 秒 edit is a different
 * recording, not a truncation of the long one. And a language with no recording
 * says so rather than quietly speaking 中文 under a label that claims otherwise
 * — while naming the transcript underneath as the 中文 one, because that is the
 * only text there is and implying it is the 日本語 version is the same lie in a
 * different place.
 */
export function StoryPlayer({
  poiId,
  length = "full",
  onClose,
}: {
  poiId: string;
  length?: StoryLength;
  onClose: () => void;
}) {
  const p = poi(poiId);
  const s = story(p?.storyId);

  const [len, setLen] = useState<StoryLength>(length);
  /* Asked for a different edit while the player is already open — arriving at a
     second place, say. Without this the toggle keeps the previous choice and
     plays an edit nobody picked. */
  useEffect(() => setLen(length), [length, poiId]);

  const [lang, setLang] = useState(() => s?.languages[0] ?? SPOKEN);
  /* The same reset as `len` above, for the same reason. Somebody who switched to
     日本語 to read the transcript at one place arrived at the next one still on
     日本語: no autoplay, and a recording that does exist sitting behind a line
     saying it does not. `s` and `poiId` change together and story records are
     stable module objects, so this fires once per place and never fights
     cycleLang. */
  useEffect(() => {
    setLang(s?.languages[0] ?? SPOKEN);
  }, [poiId, s]);
  const spoken = lang === SPOKEN;
  /* Read inside the player-building effect, which must not re-run on a language
     change — rebuilding there would restart an edit the traveller is midway
     through just because they looked at the language list. */
  const spokenRef = useRef(spoken);
  spokenRef.current = spoken;

  /* One story_play per edit that actually produced audio, whether it started on
     its own or the traveller pressed ▶. Reset with each rebuilt player, so
     story_finish can never outrun the play it belongs to. */
  const countedRef = useRef(false);

  const sentences = useMemo(
    () => (s ? splitSentences(len === "short" ? s.short : s.body) : []),
    [s, len],
  );

  const [player, setPlayer] = useState<VoicePlayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  /* Shared and persisted, keyed by story id — 收藏 reads the same list. */
  /* Hook first, question after: putting useSaved() behind `s &&` makes it a
     conditional call, and the hook order changes the moment a story is
     missing. Read the list unconditionally, then ask about it. */
  const savedStories = useSaved().stories;
  const saved = Boolean(s && savedStories.includes(s.id));
  const [copied, setCopied] = useState(false);

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
    setLine(0);
    setElapsed(0);
    countedRef.current = false;
    // Autoplay: they already picked an edit to get here.
    if (spokenRef.current) {
      v.play();
      setPlaying(true);
      countedRef.current = true;
      track("story_play", { poiId });
    } else {
      setPlaying(false);
    }
    return () => {
      v.stop();
      setPlayer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences]);

  /* Selecting a language nobody has recorded stops the audio. Leaving 中文
     playing underneath would be the app lying about what you are hearing. */
  useEffect(() => {
    if (spoken || !player) return;
    player.pause();
    setPlaying(false);
  }, [spoken, player]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  if (!p || !s) return null;

  const total = player?.totalSeconds ?? 0;
  const pct = total ? Math.min(100, (elapsed / total) * 100) : 0;
  const lengthLabel = len === "short" ? "30 秒" : `${s.minutes} 分鐘`;
  const langs = s.languages.length ? s.languages : [SPOKEN];
  const title = s.title;
  const shareText = `${title}｜ResoMap 語音故事`;

  function cycleLang() {
    const at = langs.indexOf(lang);
    setLang(langs[(at + 1) % langs.length]);
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
      } catch {
        /* dismissed — not an error worth surfacing */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${url}`);
      setCopied(true);
    } catch {
      /* clipboard blocked; nothing useful to say about it */
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-bg">
      <div
        className="relative grid h-[34%] shrink-0 place-items-center text-[72px]"
        style={{ background: p.tint }}
      >
        {p.emoji}
        {/* 44px, matching the back button on the POI page. At size-10 this was
            40px — the one way out of a full-screen overlay, and the smallest
            target in the app. */}
        <button
          onClick={onClose}
          aria-label="關閉"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-bg/90 text-[17px] text-ink active:bg-bg"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-6 pb-8 pt-5">
        <div className="flex items-center gap-2">
          {/* Same trick as Chip: the pill stays small and the pseudo-element
              carries the target. The old comment claimed "34px pill" and copied
              Chip's -inset-y-[10px] — but this pill is py-1 at 11.5px, roughly
              23px, so 10px a side landed at ~43px. -inset-y-[13px] clears 44. */}
          <button
            onClick={cycleLang}
            disabled={langs.length < 2}
            aria-label="切換語言"
            className="relative inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-[11.5px] font-semibold text-ink-2 after:absolute after:inset-x-0 after:-inset-y-[13px] after:content-['']"
          >
            {lang}
            {langs.length > 1 && <span className="text-ink-3">▾</span>}
          </button>
          {spoken && player?.silent && (
            <span className="rounded-md bg-surface px-2 py-1 text-[11.5px] font-semibold text-ink-3">
              字幕模式
            </span>
          )}
        </div>

        {/* Naming the language the transcript is actually in is the whole point.
            "先看文字稿" next to a 日本語 label promises a Japanese transcript,
            and what renders underneath is `s.body` — 中文, every time. Offering
            the wrong-language text is fine; letting the label imply it is the
            right one is the same lie as speaking 中文 under a 日本語 heading. */}
        {!spoken && (
          <p className="mt-2 text-[12px] leading-relaxed text-ink-3">
            {lang}的錄音還在製作中，以下是{SPOKEN}文字稿。
          </p>
        )}

        <h1 className="mt-2.5 text-[19px] font-bold leading-snug text-ink">{s.title}</h1>

        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-ink-3">
          <span className="num shrink-0">{lengthLabel}</span>
          <span aria-hidden>·</span>
          <span className="truncate">{s.narrator}</span>
        </div>

        {/* Play counts are the one number in this app that could be mistaken
            for traction. There is none — so the label goes next to them. */}
        <div className="mt-1 flex items-center gap-2 text-[12.5px] text-ink-3">
          <span className="num shrink-0">{s.plays.toLocaleString()} 次播放</span>
          <Tag kind="demo" />
          <button
            onClick={() => s && toggleStory(s.id)}
            aria-pressed={saved}
            className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold ${
              saved ? "bg-surface-2 text-ink" : "bg-surface text-ink-2 active:bg-surface-2"
            }`}
          >
            <span aria-hidden>{saved ? "♥" : "♡"}</span>
            {saved ? "已收藏" : "收藏"}
          </button>
          <button
            onClick={share}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-surface px-2.5 text-[12px] font-semibold text-ink-2 active:bg-surface-2"
          >
            <span aria-hidden>↗</span>
            分享
          </button>
        </div>

        {/* Height reserved so the confirmation cannot shove the player about. */}
        <div className="mt-1 h-4 text-[11.5px] text-ink-3">
          {copied && <span className="rm-in">已複製連結</span>}
        </div>

        <div className="mt-2">
          <Segmented<StoryLength>
            items={[
              { id: "short", label: "快速聽" },
              { id: "full", label: "完整故事" },
            ]}
            value={len}
            onChange={setLen}
          />
        </div>

        {spoken ? (
          <>
            {/* A real button, not a div with an onClick: this was the only
                control on the screen with no keyboard path and nothing for a
                screen reader to announce. The padding is vertical only — the
                click maths reads this element's own rect, so any horizontal
                padding would offset every seek by its width. `py-5` around a
                4px bar buys the 44px target without the bar getting heavier. */}
            <button
              type="button"
              aria-label="跳到故事的某一句"
              className="mt-2 w-full cursor-pointer px-0 py-5"
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
            </button>
            <div className="num flex justify-between text-[11.5px] text-ink-3">
              <span>{formatClock(elapsed)}</span>
              <span>{formatClock(total)}</span>
            </div>

            {/* The two seek buttons were bare text — about 30×16px of tappable
                area each, sitting either side of a 64px play button. They are
                the controls you reach for one-handed with the phone at your
                side, so they get a real 44px target; `size-11` holds it without
                changing how they look. */}
            <div className="mt-4 flex items-center justify-center gap-8">
              <button
                onClick={() => player?.seekSeconds(-10)}
                aria-label="倒轉 10 秒"
                className="grid size-11 place-items-center rounded-full text-[13px] font-bold text-ink-2 active:bg-surface"
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
                    if (!countedRef.current) {
                      countedRef.current = true;
                      track("story_play", { poiId });
                    }
                  }
                }}
                aria-label={playing ? "暫停" : "播放"}
                className="grid size-16 place-items-center rounded-full bg-brand text-[22px] text-white active:bg-brand-press"
              >
                {playing ? "❚❚" : "▶"}
              </button>
              <button
                onClick={() => player?.seekSeconds(10)}
                aria-label="快轉 10 秒"
                className="grid size-11 place-items-center rounded-full text-[13px] font-bold text-ink-2 active:bg-surface"
              >
                10 ↻
              </button>
            </div>
          </>
        ) : (
          /* No transport controls for an edit that cannot play — a disabled
             play button is still a play button. */
          <div className="mt-4 flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Headphones size={13} />
            {SPOKEN}版本可以播放
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto no-scrollbar">
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
