import { useMemo, useState } from "react";
import { BY_DEST, DESTINATIONS, STORIES, poi } from "../data";
import { BrandBar } from "../components/BrandBar";
import { PoiImage } from "../components/Cover";
import { Button, Chip, Empty, Headphones, Note, Sheet, Tag, Thumb } from "../components/ui";
import { playLabel, rating, storyRail } from "../lib/story";
import { focusTrip } from "../lib/trip";
import { useI18n } from "../i18n";
import { useNav } from "../nav";
import { POI_KIND_LABELS, type PoiKind, type Story, type Trip } from "../types";

/**
 * 導覽庫 — every guide ResoMap has recorded, in one place.
 *
 * The home rail answers "what should I listen to next"; this tab answers "what
 * else is there". So it shows all fifteen rather than a curated slice, and the
 * work it has to do is narrowing, not choosing. Two chip rows and a count is the
 * whole interface — the same shape as 搜尋, deliberately, because a traveller
 * who has learnt one filter row in this app should not have to learn a second.
 *
 * Order comes from `storyRail`, which is also what the home screen calls. A
 * story that is third on the home screen and eleventh here would be two answers
 * to the same question.
 */

const ALL = "all";

export function Library() {
  const nav = useNav();
  const { t } = useI18n();
  const [city, setCity] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);

  /* The one trip this screen can be about: it orders the rail, and it is the
     only thing 加入行程 could possibly add to. Read once here rather than
     fifteen times inside the cards. */
  const trip = focusTrip(nav.trips);
  const destId = trip?.destId;
  const rail = useMemo(() => storyRail(destId), [destId]);

  /* Both filter rows are read off the stories that exist. A hardcoded city list
     would eventually offer 高雄 after the last 高雄 guide was cut, and a chip
     whose only possible result is the empty state is a broken control. */
  const cities = useMemo(() => {
    const ids = new Set(STORIES.map((s) => poi(s.poiId).destId));
    return DESTINATIONS.filter((d) => ids.has(d.id));
  }, []);

  /* Theme is the POI's own kind, not a new taxonomy. The guides sit on places
     that are already classified, and inventing a parallel set of themes would
     mean a place could be 景點 on one screen and 歷史 on the next. Ordered by
     POI_KIND_LABELS so the row does not reshuffle when a guide is added. */
  const kinds = useMemo(() => {
    const present = new Set(STORIES.map((s) => poi(s.poiId).kind));
    return (Object.keys(POI_KIND_LABELS) as PoiKind[]).filter((k) => present.has(k));
  }, []);

  const shown = useMemo(
    () =>
      rail.filter((s) => {
        const p = poi(s.poiId);
        return (city === ALL || p.destId === city) && (kind === ALL || p.kind === kind);
      }),
    [rail, city, kind],
  );

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* t() rather than the literal: AppShell's tab bar already translates
          「導覽庫」, so on English the tab at the bottom read "Guides" while the
          orange bar at the top of the same screen still said 導覽庫. The string
          is in i18n/source.ts and all eight catalogues — it was translated and
          then thrown away here. */}
      <BrandBar title={t("導覽庫")} />

      {/* Pinned, not scrolled away. Fifteen cards is a long page, and a filter
          you have to scroll back up to reach stops being used by card four. */}
      <div className="shrink-0 border-b border-line bg-bg pb-2 pt-2.5">
        <div className="flex gap-2 overflow-x-auto px-5 py-1.5 no-scrollbar">
          {/* 全部 stays `active` at rest, matching Search.tsx. A chip row that
              highlights the resting option on one screen and not on another
              teaches two rules for one control, which costs more than the
              slightly loud default it saves. */}
          <Chip active={city === ALL} onClick={() => setCity(ALL)}>
            {t("全部城市")}
          </Chip>
          {cities.map((d) => (
            <Chip key={d.id} active={city === d.id} onClick={() => setCity(d.id)}>
              {d.name}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto px-5 py-1.5 no-scrollbar">
          <Chip active={kind === ALL} onClick={() => setKind(ALL)}>
            {t("全部主題")}
          </Chip>
          {kinds.map((k) => (
            <Chip key={k} active={kind === k} onClick={() => setKind(k)}>
              {POI_KIND_LABELS[k]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
        {shown.length === 0 ? (
          <Empty
            icon="🎧"
            text="這個城市還沒有這個主題的故事"
            /* This screen is the only caller of 清除篩選 in the app, and it was
               passing the literal — the eight translations of it in the
               catalogues were unreachable. The sentence above it is not in
               source.ts, so it stays Chinese and falls back cleanly. */
            action={t("清除篩選")}
            onAction={() => {
              setCity(ALL);
              setKind(ALL);
            }}
          />
        ) : (
          <>
            {/* The count is the filtered array's own length, and the Demo tag
                sits here once — at the head of the list, where it covers every
                rating and play count below it. One per card would turn a
                disclosure into wallpaper and stop being read by card three. */}
            <div className="flex items-center gap-2 px-5 pb-2.5 pt-3.5">
              <span className="num text-[13px] font-semibold text-ink-2">
                {shown.length} 篇故事
              </span>
              <span className="text-[12.5px] text-ink-3">· {t("免費收聽")}</span>
              <span className="ml-auto shrink-0">
                <Tag kind="demo" />
              </span>
            </div>

            <div className="space-y-3 px-5">
              {shown.map((s) => (
                <GuideCard key={s.id} story={s} trip={trip} />
              ))}
            </div>

            <Note>
              評分不是使用者評價，是由這則故事的喜歡數與播放次數推算出來的；兩個數字都是 Demo
              資料。
            </Note>
          </>
        )}

        {/* shrink-0 is habit rather than need here, but this list has been a
            flex column twice already. */}
        <div className="h-24 shrink-0" />
      </div>
    </div>
  );
}

/**
 * The home rail's card, stood up and given room.
 *
 * Same reading order — cover, place, hook, then the small print — so somebody
 * who tapped one of these on the home screen recognises it here. What the extra
 * width buys is the two figures the rail has no space for, and a 試聽 that
 * plays the 30 秒 edit without leaving the list.
 *
 * The title line is the place, not `story.title`: the story titles already end
 * with their own hook ("赤崁樓・荷蘭人蓋的，鄭成功接手的"), so printing both
 * would say the same thing twice on every card.
 */
function GuideCard({ story: s, trip }: { story: Story; trip?: Trip }) {
  const nav = useNav();
  const { t, placeName } = useI18n();
  const [adding, setAdding] = useState(false);
  const p = poi(s.poiId);
  const cityName = BY_DEST[p.destId]?.name;

  /* 加入行程 needs somewhere to add to. With no trip — or a trip that has no
     days yet — the picker would open on an empty row, so the control is not
     rendered at all. A button whose only outcome is a dead end is worse than
     an absent one. */
  const canAdd = Boolean(trip && trip.days.length > 0);

  /* Sibling buttons rather than a Card with an onClick: each action has to be
     its own tap target, and a button inside a button is neither valid markup
     nor tappable in the way anyone expects. */
  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <button
        onClick={() => nav.go({ k: "poi", id: s.poiId })}
        className="block w-full text-left transition active:bg-surface-2"
      >
        <PoiImage poi={p} height={128} radius={0} />
        <div className="px-4 pt-3">
          <div className="truncate text-[15.5px] font-bold text-ink">
            {placeName(p.id, p.name)}
          </div>
          <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-3">
            {s.hook}
          </div>
          <div className="mt-1.5 truncate text-[12px] text-ink-3">
            {cityName ? `${cityName} · ` : ""}
            {POI_KIND_LABELS[p.kind]}
          </div>
        </div>
      </button>

      <div className="px-4 pb-4 pt-2.5">
        <div className="num flex items-center gap-1 text-[12px] text-ink-3">
          <span aria-hidden>★</span>
          <span>{rating(s).toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span className="min-w-0 truncate">{playLabel(s.plays)}</span>
          <span aria-hidden>·</span>
          <Headphones size={11} />
          <span className="shrink-0">{s.minutes} 分鐘</span>
        </div>

        {/* The actions took their own row when the second one arrived. Beside
            the figures, two pills left about 110px for ★, plays and length —
            the numbers this card exists to add would have been the thing that
            truncated. Full-width halves also give each action a real target
            rather than a 44px minimum met on a technicality.

            bg-bg on both, not bg-brand. The orange bar at the top of this
            screen is already the loudest thing on it, and thirty orange
            buttons would make every card shout the same two words. */}
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => nav.play(s.poiId, "short")}
            className="num inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-bg px-4 text-[13.5px] font-bold text-ink transition active:bg-surface-2"
          >
            {t("試聽 30 秒")}
          </button>
          {canAdd && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-bg px-4 text-[13.5px] font-bold text-ink transition active:bg-surface-2"
            >
              {t("加入行程")}
            </button>
          )}
        </div>
      </div>

      {/* Mounted only while open, so the fifteen closed cards cost nothing and
          the picker's day state is fresh every time. Sheet portals out of this
          card, which is `overflow-hidden`.

          The day test is repeated here rather than trusted from `canAdd`:
          AddToTripSheet reads `trip.days[0].n` to seed its picker, and the one
          thing standing between that and a crash should be the condition that
          actually mounts it. */}
      {adding && trip && trip.days.length > 0 && (
        <AddToTripSheet poiId={p.id} trip={trip} onClose={() => setAdding(false)} />
      )}
    </div>
  );
}

/**
 * Which day of the trip this place lands on.
 *
 * The same shape as AddPoi.tsx's PasteLink, deliberately — preview, one chip
 * per day the trip actually has, and a confirm that goes flat when that day
 * already holds the place. A traveller who has picked a day once in this app
 * should not have to read a second control to do it again.
 *
 * Committing calls `nav.addPoi`, which is the app's only add path: it owns the
 * appended stop, the poi_add event and the 已加入 Day N toast. Firing a second
 * confirmation here would tell the traveller twice about one tap.
 */
function AddToTripSheet({
  poiId,
  trip,
  onClose,
}: {
  poiId: string;
  trip: Trip;
  onClose: () => void;
}) {
  const nav = useNav();
  const { t, placeName } = useI18n();
  const p = poi(poiId);

  /* Open on the day the traveller is on — but only if the trip has that day.
     `today` is free to run past the last one, and a default that matches no
     chip would leave the row looking unselected while the button named a day
     nobody had tapped. */
  const [pick, setPick] = useState(() =>
    trip.days.some((d) => d.n === trip.today) ? trip.today : trip.days[0].n,
  );

  const already = useMemo(() => {
    const onDay = trip.days.find((d) => d.n === pick);
    return Boolean(
      onDay?.tracks.some((tr) => tr.stops.some((st) => st.poiId === poiId)),
    );
  }, [trip, pick, poiId]);

  return (
    <Sheet open onClose={onClose} title={t("加入行程")}>
      <div className="px-5 pb-5 pt-1">
        <div className="rounded-2xl bg-surface p-3.5">
          <div className="flex items-center gap-3">
            <Thumb emoji={p.emoji} tint={p.tint} size={44} radius={12} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-ink">
                {placeName(p.id, p.name)}
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                {p.area} · {POI_KIND_LABELS[p.kind]} · 建議停留 {p.stayMin} 分
              </div>
            </div>
          </div>

          {/* The trip is named because nobody chose it here — focusTrip did.
              Without the title, 加入 Day 2 means "day 2 of something". */}
          <div className="mt-3.5 flex items-baseline gap-2">
            <span className="shrink-0 text-[13px] font-semibold text-ink-2">
              {t("要加到哪一天？")}
            </span>
            <span className="ml-auto truncate text-[12px] text-ink-3">{trip.title}</span>
          </div>

          {/* One chip per day the trip actually has — never a fixed seven. */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {trip.days.map((d) => (
              <button
                key={d.n}
                onClick={() => setPick(d.n)}
                className={`min-h-11 rounded-full px-3 text-[13px] font-semibold transition ${
                  d.n === pick ? "bg-brand text-white" : "bg-bg text-ink-2 active:bg-surface-2"
                }`}
              >
                Day {d.n}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <Button
              variant="onCard"
              disabled={already}
              onClick={() => {
                nav.addPoi(trip.id, pick, poiId);
                onClose();
              }}
            >
              {already ? `Day ${pick} 已經有這個地點` : `加入 Day ${pick}`}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
