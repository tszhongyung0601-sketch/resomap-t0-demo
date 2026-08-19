import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BY_POI, BY_TRAVELLER, ME } from "../data";
import {
  REVEAL_FIRST_MS,
  REVEAL_GAP_MS,
  applyCoEdit,
  coEditScript,
  coEditors,
  dayPlan,
} from "../data/coedit";
import type { CoEditEvent, DayPlan } from "../data/coedit";
import { useI18n } from "../i18n";
import { useNav } from "../nav";
import { Avatar, Button, Empty, Screen, Tag, TopBar } from "../components/ui";
import { POI_KIND_LABELS } from "../types";
import type { TravellerId } from "../types";

/**
 * 一起編輯 — the shared-itinerary idea, shown honestly.
 *
 * There is no server. Nothing on this screen is synced, and the first card says
 * exactly that in one sentence before anything that could be mistaken for live
 * data appears. That ordering is the whole design: a feed of edits with the
 * disclaimer at the bottom is a claim followed by a footnote, and people read
 * the claim.
 *
 * What it does show is real: the people are this trip's own travellers, the
 * places are POIs from the dataset, and the itinerary underneath is the trip's
 * own days. The script in data/coedit.ts only rearranges them — which is why
 * the list visibly changes as the feed fills in. A feed announcing moves above
 * an itinerary that never moves is the version that teaches the reader to
 * distrust both.
 *
 * The rearranged list lives in this component and nowhere else. It never
 * touches nav.trips, and the section says so, because a simulation that quietly
 * edits the traveller's real itinerary is a much worse lie than the one this
 * screen is careful not to tell.
 */
export function CoEdit({ tripId }: { tripId: string }) {
  const nav = useNav();
  const { t, placeName } = useI18n();
  const trip = nav.trips.find((x) => x.id === tripId);

  /* Read once, at mount. A listener would let the setting change mid-demo,
     which is not a thing that happens and is not worth the subscription. */
  const [reduced] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );

  /* Frozen for the life of the mount. Both are derived from the trip, and a
     `useMemo` over an array prop would rebuild — and restart the timer — every
     time App re-rendered for an unrelated reason. */
  const [script] = useState<CoEditEvent[]>(() => (trip ? coEditScript(trip) : []));
  const [base] = useState<DayPlan[]>(() => (trip ? dayPlan(trip) : []));

  /* One timestamp per revealed event, so 剛剛 / N 分鐘前 is measured elapsed
     time in this session rather than a number somebody made up. Reduced motion
     gets the whole list at once — the point is the content, not the reveal. */
  const [reveals, setReveals] = useState<number[]>(() =>
    reduced ? script.map(() => Date.now()) : [],
  );
  const [now, setNow] = useState(() => Date.now());
  const shown = reveals.length;

  useEffect(() => {
    if (reduced || shown >= script.length) return;
    const id = window.setTimeout(
      () => {
        setNow(Date.now());
        setReveals((r) => (r.length >= script.length ? r : [...r, Date.now()]));
      },
      shown === 0 ? REVEAL_FIRST_MS : REVEAL_GAP_MS,
    );
    return () => window.clearTimeout(id);
  }, [shown, reduced, script]);

  /* Ages the labels while somebody leaves the screen open. Cheap, and it stops
     a five-minute-old line from still claiming 剛剛. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20000);
    return () => window.clearInterval(id);
  }, []);

  const plan = useMemo(
    () => script.slice(0, shown).reduce(applyCoEdit, base),
    [script, shown, base],
  );

  /* The row the last edit touched, so the eye can jump from the sentence to the
     place it is about.
     Keyed on the day as well as the place, because several POIs sit on two days
     of the same trip — 國華街 is on 台南 Day 1 and Day 2 — and matching on the id
     alone lights both, pointing the reader at a row the sentence never mentioned.
     A note carries no day: it is about the place wherever it appears, so it
     lights every instance, which is the honest answer for that one kind. */
  const last = shown > 0 ? script[shown - 1] : null;
  const touched = last ? { poiId: last.poiId, day: last.day } : null;

  if (!trip) {
    return (
      <Screen>
        <TopBar title={t("一起編輯")} onBack={nav.back} />
        <Empty icon="🗂️" text={t("找不到這趟行程。")} />
      </Screen>
    );
  }

  const people = coEditors(trip);
  const done = shown >= script.length && script.length > 0;

  return (
    <Screen>
      <TopBar title={t("一起編輯")} onBack={nav.back} />

      {/* The disclaimer comes first, before anything that looks live. */}
      <div className="px-5 pt-1">
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-ink">{t("雲端同步（模擬）")}</h2>
            <Tag kind="demo" />
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">
            {t("這是同一台裝置上的模擬，ResoMap 目前沒有真實的雲端同步。")}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
            {t("下面的變更只留在這個畫面，不會存進行程，也不會送到任何人手上。")}
          </p>
        </div>
      </div>

      <div className="mt-5 px-5">
        <div className="text-[19px] font-bold text-ink">{trip.title}</div>
        <div className="num mt-0.5 text-[12.5px] text-ink-3">{trip.dates}</div>
      </div>

      {/* ------------------------------------------------------------ people */}

      <Block title={t("這趟的旅伴")} demo>
        {people.length === 0 ? (
          <p className="px-5 text-[13px] leading-relaxed text-ink-3">
            {t("這趟行程還沒有旅伴，所以沒有人可以一起編輯。")}
          </p>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar">
              <Person id={ME.id} me />
              {people.map((id) => (
                <Person key={id} id={id} />
              ))}
            </div>
            {/* Not 輪流: the scripted trips assign each edit to whoever it makes
                sense for (台南 is Amy, Susan, John, John), and only the derived
                fallback rotates. Copy that describes a rotation the code does
                not perform is a small invented claim in the same screen that
                exists to avoid making one. */}
            <p className="mt-3 px-5 text-[11.5px] leading-relaxed text-ink-3">
              {t("模擬裡的變更都掛在這幾個人名下。沒有人真的連線，也沒有人會收到通知。")}
            </p>
          </>
        )}
      </Block>

      {/* -------------------------------------------------------------- feed */}

      {script.length > 0 && (
        <Block title={t("剛剛的變更")} demo>
          <div className="space-y-2 px-5">
            {shown === 0 && (
              <p className="text-[13px] text-ink-3">{t("模擬還沒開始……")}</p>
            )}
            {script.slice(0, shown).map((e, i) => (
              <Line
                key={e.id}
                event={e}
                at={reveals[i]}
                now={now}
                animate={!reduced}
                t={t}
                placeName={placeName}
              />
            ))}
          </div>

          {done && (
            <div className="mt-3 flex items-center gap-3 px-5">
              <span className="text-[12px] text-ink-3">{t("模擬到這裡結束。")}</span>
              {/* Hidden under reduced motion: there is no reveal to replay, and
                  a button that visibly does nothing is worse than no button. */}
              {!reduced && (
                <button
                  onClick={() => {
                    setReveals([]);
                    setNow(Date.now());
                  }}
                  className="ml-auto inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-[13px] font-semibold text-ink transition active:bg-surface-2"
                >
                  {t("重播")}
                </button>
              )}
            </div>
          )}
        </Block>
      )}

      {/* --------------------------------------------------------- itinerary */}

      {/* Named for what it is, and marked for what it is. With a script running
          this list has been rearranged by invented edits, so it carries the same
          Demo mark as the feed that moved it. With no simulation running it is
          simply the trip's own days, and both the title and the mark come off —
          putting a warning on data that came straight out of the repo teaches the
          reader that the mark means nothing. */}
      <Block
        title={script.length > 0 ? t("模擬中的行程") : t("目前的行程")}
        demo={script.length > 0}
      >
        {script.length > 0 && (
          <p className="mb-3 px-5 text-[11.5px] leading-relaxed text-ink-3">
            {t("這份清單只跟著上面的模擬變更，離開畫面就回到原本的行程。")}
          </p>
        )}

        <div className="space-y-4 px-5">
          {plan.map((d) => (
            <div key={d.n}>
              <div className="flex items-baseline gap-2">
                <span className="text-[14px] font-bold text-ink">Day {d.n}</span>
                <span className="text-[12px] text-ink-3">{d.date}</span>
                <span className="num ml-auto text-[12px] text-ink-3">
                  {d.poiIds.length} 個地點
                </span>
              </div>

              <div className="mt-1.5 space-y-1">
                {d.poiIds.length === 0 ? (
                  <p className="text-[12.5px] text-ink-3">{t("這天還沒有安排。")}</p>
                ) : (
                  d.poiIds.map((id, i) => (
                    <PlaceRow
                      key={`${id}-${i}`}
                      poiId={id}
                      lit={
                        touched !== null &&
                        id === touched.poiId &&
                        (touched.day === undefined || d.n === touched.day)
                      }
                      onClick={() => nav.go({ k: "poi", id })}
                      placeName={placeName}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <div className="mt-7 px-5">
        <Button onClick={() => nav.go({ k: "trip", id: trip.id })}>
          {t("查看完整行程")}
        </Button>
      </div>

      <div className="h-24 shrink-0" />
    </Screen>
  );
}

/* --------------------------------------------------------------- the feed */

/**
 * One edit, in a sentence.
 *
 * Built from pieces rather than translated whole: every one of these contains a
 * name, a place and a day number, and src/i18n/source.ts is explicit that
 * sentences assembled around numbers stay Chinese and fall back cleanly instead
 * of being cut into fragments a translator cannot reassemble.
 */
function Line({
  event: e,
  at,
  now,
  animate,
  t,
  placeName,
}: {
  event: CoEditEvent;
  at: number;
  now: number;
  animate: boolean;
  t: (zh: string) => string;
  placeName: (poiId: string, zh: string) => string;
}) {
  const who = BY_TRAVELLER[e.who];
  const p = BY_POI[e.poiId];
  const place = p ? placeName(p.id, p.name) : e.poiId;

  const body: ReactNode = (() => {
    switch (e.kind) {
      case "move":
        return (
          <>
            把 <B>{place}</B> 移到 Day {e.day}
          </>
        );
      case "add":
        return (
          <>
            加入了 <B>{place}</B>，放在 Day {e.day}
          </>
        );
      case "remove":
        return (
          <>
            把 Day {e.day} 的 <B>{place}</B> 拿掉了
          </>
        );
      case "note":
        return (
          <>
            在 <B>{place}</B> 留了一句：「{who.note}」
          </>
        );
    }
  })();

  return (
    <div className={`flex gap-2.5 ${animate ? "rm-in" : ""}`}>
      <Avatar name={who.name} color={who.color} initial={who.initial} size={28} />
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] leading-snug text-ink">
          <B>{who.name}</B> {body}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-3">{ago(at, now, t)}</p>
      </div>
    </div>
  );
}

function B({ children }: { children: ReactNode }) {
  return <span className="font-semibold">{children}</span>;
}

/**
 * How long ago, measured — not decorated.
 *
 * `at` is when the line actually appeared in this session, so the label is a
 * real elapsed time rather than another invented number on a screen that
 * already has enough of those.
 */
function ago(at: number, now: number, t: (zh: string) => string): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 45) return t("剛剛");
  /* Built around a number, so it stays Chinese and falls back — the rule
     src/i18n/source.ts sets out for every sentence of this shape. */
  return `${Math.round(s / 60)} 分鐘前`;
}

/* ------------------------------------------------------------------ parts */

function Person({ id, me }: { id: TravellerId; me?: boolean }) {
  const tr = BY_TRAVELLER[id];
  return (
    <div className="w-14 shrink-0 text-center">
      <Avatar name={tr.name} color={tr.color} initial={tr.initial} size={44} />
      <div className="mt-1.5 truncate text-[12px] font-semibold text-ink">{tr.name}</div>
      {me && <div className="text-[11px] text-ink-3">你</div>}
    </div>
  );
}

function PlaceRow({
  poiId,
  lit,
  onClick,
  placeName,
}: {
  poiId: string;
  lit: boolean;
  onClick: () => void;
  placeName: (id: string, zh: string) => string;
}) {
  const p = BY_POI[poiId];
  if (!p) return null;
  return (
    <button
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left transition ${
        lit ? "bg-brand-wash" : "bg-surface active:bg-surface-2"
      }`}
    >
      <span className="text-[15px]">{p.emoji}</span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
        {placeName(p.id, p.name)}
      </span>
      <span className="shrink-0 text-[11.5px] text-ink-3">
        {POI_KIND_LABELS[p.kind]}
      </span>
    </button>
  );
}

/** A titled section. `demo` marks the ones whose content is a simulation. */
function Block({
  title,
  demo,
  children,
}: {
  title: string;
  demo?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center gap-2 px-5">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        {demo && <Tag kind="demo" />}
      </div>
      {children}
    </section>
  );
}
