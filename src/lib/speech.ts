/**
 * Sentence-driven speech for the voice guide.
 *
 * One long utterance is the obvious implementation and the wrong one: Chrome
 * truncates long speech, and `onboundary` is unreliable for Chinese, so a
 * progress bar driven by it drifts away from the audio. Speaking one sentence
 * at a time gives an honest per-sentence `onend`, which is what both the
 * progress bar and the subtitle highlight are derived from.
 */

export interface VoiceHandlers {
  onSentence?: (index: number) => void;
  onEnd?: () => void;
  onTick?: (elapsedSec: number) => void;
}

export interface VoicePlayer {
  readonly silent: boolean;
  readonly totalSeconds: number;
  play(): void;
  pause(): void;
  stop(): void;
  seekSentence(index: number): void;
  seekSeconds(delta: number): void;
  elapsed(): number;
}

export function splitSentences(body: string): string[] {
  return body
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

const CJK = /[　-鿿＀-￯]/;

/** Rough spoken duration, used only to size the progress bar. */
export function estimateSeconds(sentence: string): number {
  return CJK.test(sentence)
    ? Math.max(1.6, sentence.length * 0.235)
    : Math.max(1.6, sentence.split(/\s+/).length * 0.4);
}

export function supported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voices: SpeechSynthesisVoice[] = [];
if (supported()) {
  const load = () => {
    voices = window.speechSynthesis.getVoices();
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
  setTimeout(load, 400); // some builds never fire the event
}

export function pickVoice(lang = "zh-TW"): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const base = lang.split("-")[0].toLowerCase();
  const candidates = voices.filter((v) =>
    v.lang.toLowerCase().replace("_", "-").startsWith(base),
  );
  if (!candidates.length) return null;
  return (
    candidates.find(
      (v) =>
        v.lang.toLowerCase().replace("_", "-") === lang.toLowerCase() && v.localService,
    ) ??
    candidates.find((v) => v.localService) ??
    candidates[0]
  );
}

/**
 * `silent` is not a failure to hide: with no voice installed for this language
 * the guide still runs as subtitles, on the same clock, and the UI says why.
 */
export function createPlayer(
  sentences: string[],
  handlers: VoiceHandlers = {},
  lang = "zh-TW",
): VoicePlayer {
  const durations = sentences.map(estimateSeconds);
  const offsets: number[] = [];
  durations.reduce((acc, d) => {
    offsets.push(acc);
    return acc + d;
  }, 0);
  const total = durations.reduce((a, b) => a + b, 0);

  const voice = pickVoice(lang);
  const silent = !voice || !supported();

  let index = 0;
  let playing = false;
  let base = 0; // seconds completed before the current sentence started
  let startedAt = 0;
  let ticker: number | null = null;
  let silentTimer: number | null = null;

  const elapsed = () =>
    playing ? Math.min(total, base + (performance.now() - startedAt) / 1000) : base;

  function startTicker() {
    stopTicker();
    ticker = window.setInterval(() => handlers.onTick?.(elapsed()), 120);
  }
  function stopTicker() {
    if (ticker !== null) window.clearInterval(ticker);
    ticker = null;
  }
  function cancelSpeech() {
    if (supported()) window.speechSynthesis.cancel();
    if (silentTimer !== null) window.clearTimeout(silentTimer);
    silentTimer = null;
  }

  function speakCurrent() {
    if (index >= sentences.length) {
      playing = false;
      base = total;
      stopTicker();
      handlers.onTick?.(total);
      handlers.onEnd?.();
      return;
    }
    base = offsets[index];
    startedAt = performance.now();
    handlers.onSentence?.(index);

    if (silent) {
      silentTimer = window.setTimeout(
        () => {
          index += 1;
          if (playing) speakCurrent();
        },
        durations[index] * 1000,
      );
      return;
    }

    const u = new SpeechSynthesisUtterance(sentences[index]);
    u.voice = voice;
    u.lang = voice!.lang;
    u.rate = 1;
    const advance = () => {
      if (!playing) return;
      index += 1;
      speakCurrent();
    };
    u.onend = advance;
    u.onerror = advance;
    window.speechSynthesis.speak(u);
  }

  return {
    silent,
    totalSeconds: total,
    elapsed,
    play() {
      if (!sentences.length) return;
      if (index >= sentences.length) index = 0;
      playing = true;
      startedAt = performance.now();
      speakCurrent();
      startTicker();
    },
    pause() {
      base = elapsed();
      playing = false;
      cancelSpeech();
      stopTicker();
    },
    stop() {
      playing = false;
      index = 0;
      base = 0;
      cancelSpeech();
      stopTicker();
    },
    seekSentence(next: number) {
      index = Math.max(0, Math.min(sentences.length - 1, next));
      base = offsets[index];
      handlers.onSentence?.(index);
      if (playing) {
        cancelSpeech();
        startedAt = performance.now();
        speakCurrent();
      } else {
        handlers.onTick?.(base);
      }
    },
    /** ±10s buttons land on sentence boundaries — TTS cannot resume mid-sentence. */
    seekSeconds(delta: number) {
      const target = Math.max(0, Math.min(total - 0.1, elapsed() + delta));
      let i = 0;
      while (i < offsets.length - 1 && offsets[i + 1] <= target) i += 1;
      this.seekSentence(i);
    },
  };
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel();
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
