import type { Poi, PoiKind } from "../types";

/**
 * A place's picture, without a picture.
 *
 * The demo has eighty POIs and no licensed photography, and the honest answer
 * to that is not a stock image of the wrong temple — it is not pretending to
 * have a photo at all. So each place gets a small generated landscape built
 * from layered gradients: a horizon, a ground, a light source. It reads as an
 * illustrated cover rather than a photograph, which is exactly what it is.
 *
 * Every value is derived from the POI's id, so a place looks the same on the
 * home screen, in search, and in its own header. Randomising per render would
 * be the same amount of code and would make the app feel like it was still
 * loading.
 */

type Scene = {
  sky: [string, string];
  land: [string, string];
  /** Where the horizon sits, as a percentage from the top. */
  horizon: number;
  sun: string | null;
};

const SCENES: Record<PoiKind, Scene> = {
  nature: {
    sky: ["#BFD9E8", "#E3EFF4"],
    land: ["#7FA88E", "#4F7A63"],
    horizon: 58,
    sun: "rgba(255,241,214,.85)",
  },
  attraction: {
    sky: ["#F2E3CB", "#EFD9BA"],
    land: ["#C9A177", "#9E7449"],
    horizon: 62,
    sun: "rgba(255,236,200,.7)",
  },
  food: {
    sky: ["#F6DFD2", "#F2CDBB"],
    land: ["#C97F5E", "#9E5638"],
    horizon: 66,
    sun: null,
  },
  shopping: {
    sky: ["#E8DFEE", "#DED2E8"],
    land: ["#9C8AAE", "#6F5E85"],
    horizon: 60,
    sun: "rgba(255,230,240,.6)",
  },
  activity: {
    sky: ["#D8E7EE", "#C6DCE8"],
    land: ["#6F9BAE", "#456F84"],
    horizon: 64,
    sun: null,
  },
  stay: {
    sky: ["#E6E7EC", "#D9DBE3"],
    land: ["#8E90A0", "#63677A"],
    horizon: 60,
    sun: null,
  },
  transit: {
    sky: ["#E3E7EC", "#D4DAE1"],
    land: ["#8A929C", "#5F676F"],
    horizon: 68,
    sun: null,
  },
};

/** Stable per-id jitter, so two temples in the same city do not look identical. */
function seed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Cover({
  poi,
  height = 120,
  radius = 14,
  emoji = true,
  className = "",
}: {
  poi: Poi;
  height?: number | string;
  radius?: number;
  /** Off where the name alone carries it — a dense list, a small thumbnail. */
  emoji?: boolean;
  className?: string;
}) {
  const s = SCENES[poi.kind] ?? SCENES.attraction;
  const n = seed(poi.id);
  /* ±6% on the horizon and a wandering sun: enough that a row of cards reads as
     a set of places rather than one asset repeated. */
  const horizon = s.horizon + ((n % 13) - 6);
  const sunX = 18 + (n % 64);
  const hills = 34 + (n % 30);

  const layers = [
    s.sun && `radial-gradient(52% 60% at ${sunX}% ${horizon - 20}%, ${s.sun} 0%, transparent 70%)`,
    /* Two soft mounds on the horizon line, offset from each other. */
    `radial-gradient(64% 30% at ${hills}% ${horizon}%, ${s.land[0]} 0%, transparent 72%)`,
    `radial-gradient(56% 24% at ${100 - hills}% ${horizon + 2}%, ${s.land[0]} 0%, transparent 74%)`,
    `linear-gradient(180deg, transparent ${horizon}%, ${s.land[0]} ${horizon}%, ${s.land[1]} 100%)`,
    `linear-gradient(180deg, ${s.sky[0]} 0%, ${s.sky[1]} ${horizon}%)`,
  ]
    .filter(Boolean)
    .join(",");

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ height, borderRadius: radius, background: layers }}
      aria-hidden
    >
      {emoji && (
        <span
          className="absolute inset-0 grid place-items-center"
          style={{ fontSize: typeof height === "number" ? height * 0.34 : 34 }}
        >
          {poi.emoji}
        </span>
      )}
    </div>
  );
}

/**
 * The label that has to sit on any generated historical scene.
 *
 * An illustration of what a place looked like three centuries ago is the one
 * image type a traveller cannot check for themselves, which is precisely why it
 * says so on the image rather than in a footnote nobody scrolls to.
 */
export function AiSceneNote() {
  return (
    <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
      ✨ AI 情境重現
    </span>
  );
}
