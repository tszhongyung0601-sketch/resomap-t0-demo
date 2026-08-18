import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { INTEREST_LABELS, PACE_LABELS, VOTE_LABELS } from "../types";
import type { InterestId, Pace, Preference, TravellerId, VoteValue } from "../types";
import { BY_TRAVELLER, ME, dest, poi } from "../data";
import { ROOM } from "../data/room";
import { consensus, pct, tallies } from "../lib/consensus";
import type { Tally } from "../lib/consensus";
import { track } from "../lib/track";
import { BrandBar } from "../components/BrandBar";
import { useNav } from "../nav";
import { Cover } from "../components/Cover";
import { Avatar, Button, Chip, Row, Screen, Section, Tag, TopBar } from "../components/ui";

/**
 * 一起規劃 — four screens for the same problem.
 *
 * Four friends put fourteen links in a LINE group and nobody decides. The room
 * is not a chat and not a dashboard: it collects one preference per person, one
 * vote per place, and then makes exactly one proposal. Everything numeric on
 * these screens is computed from `ROOM` through `lib/consensus`, because a
 * consensus figure that cannot be checked against the list printed underneath it
 * is worse than no figure at all.
 */

/** The demo share link. It goes nowhere and is never presented as if it did. */
const INVITE_LINK = "resomap.app/r/tainan-weekend";

/** The trip the accepted suggestion lands on — the one already in the data. */
/* The room's own trip, not the ongoing demo one — see ROOM_TRIP in
   data/trips.ts for why accepting must not drop you into a trip that started
   last week. */
const ROOM_TRIP_ID = "trip-tainan-room";

const PACES: Pace[] = ["easy", "normal", "packed"];
const BUDGETS: { id: Preference["budget"]; label: string }[] = [
  { id: 1, label: "$" },
  { id: 2, label: "$$" },
  { id: 3, label: "$$$" },
];
const VOTES: VoteValue[] = ["yes", "maybe", "no"];
const VOTE_EMOJI: Record<VoteValue, string> = { yes: "❤️", maybe: "🤔", no: "👎" };

/** Mickey is the person holding the phone. */
const MINE = ROOM.members.find((m) => m.id === ME.id)?.preference;

const MY_VOTES: Record<string, VoteValue> = Object.fromEntries(
  ROOM.votes.filter((v) => v.who === ME.id).map((v) => [v.poiId, v.value]),
);

/**
 * Order is settled once, from the votes already in the room — most 想去 first.
 *
 * Re-sorting on every tap would be more literally correct and much worse to use:
 * the row you just voted on jumps under your finger and the next tap lands on a
 * different place. The counts stay live; only the order is frozen.
 */
const POOL = [...tallies(ROOM)].sort((a, b) => b.yes - a.yes || b.maybe - a.maybe);

/**
 * The denominator behind 共識.
 *
 * `lib/consensus` scores against the places the room has actually voted on, not
 * against the whole shortlist — an untouched place is not evidence of agreement
 * or of disagreement. The screen has to count the same way, or the fraction it
 * prints will not match the list printed underneath it.
 */
const VOTED = POOL.filter((t) => t.yes + t.maybe + t.no > 0);

/**
 * Who asked for an interest. The same predicate `lib/consensus` counts with, so
 * the faces and the count can never disagree — which is the point of showing
 * faces instead of a bar: the reader can check it.
 */
const wantedBy = (id: InterestId): TravellerId[] =>
  ROOM.members.filter((m) => m.preference?.interests.includes(id)).map((m) => m.id);

const names = (ids: TravellerId[]) => ids.map((i) => BY_TRAVELLER[i].name).join("、");

/** Overlapping avatars, for the people behind a count. */
function Faces({
  who,
  size = 20,
  ring = "ring-bg",
}: {
  who: TravellerId[];
  size?: number;
  /** Has to match whatever sits behind them, or the ring cuts a hole in the card. */
  ring?: string;
}) {
  return (
    <div className="flex -space-x-1.5">
      {who.map((w) => (
        <span key={w} className={`rounded-full ring-2 ${ring}`}>
          <Avatar {...BY_TRAVELLER[w]} size={size} />
        </span>
      ))}
    </div>
  );
}

/** Three-across picker. Used for pace and budget, nowhere else. */
function Choice<T extends string | number>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {items.map((i) => {
        const on = i.id === value;
        return (
          <button
            key={String(i.id)}
            onClick={() => onChange(i.id)}
            className={`h-12 flex-1 rounded-xl text-[14.5px] font-semibold transition active:scale-[.985] ${
              on ? "bg-brand text-white" : "bg-surface text-ink-2 active:bg-surface-2"
            }`}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-7 first:mt-0">
      <div className="mb-2.5 text-[13px] font-semibold text-ink-2">{label}</div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ room */

export function Together() {
  const nav = useNav();
  const [invite, setInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    track("room_view");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const c = useMemo(() => consensus(ROOM), []);
  const d = dest(ROOM.destId);
  const mineFilled = Boolean(MINE);

  const copy = () => {
    /* 已複製 has to mean it. Over plain http `navigator.clipboard` is undefined
       and the optional chain short-circuits, so setting the flag unconditionally
       claims a copy that never happened — and the traveller pastes whatever was
       on their clipboard before into the group chat. The link is printed above
       either way, so failing quietly costs them nothing. */
    navigator.clipboard
      ?.writeText(`https://${INVITE_LINK}`)
      .then(() => setCopied(true))
      .catch(() => {
        /* denied permission is not worth an error state in a demo */
      });
  };

  return (
    <Screen>
      <BrandBar title="一起規劃" />

      <div className="px-5">
        <div className="rounded-2xl bg-surface p-4">
          <div className="text-[19px] font-bold text-ink">{ROOM.title}</div>
          <div className="num mt-1 text-[13px] text-ink-3">
            {ROOM.dates}
            {d && ` · ${d.name}`}
          </div>

          <div className="mt-4 flex gap-4">
            {ROOM.members.map((m) => {
              const t = BY_TRAVELLER[m.id];
              const ready = Boolean(m.preference);
              return (
                <div key={m.id} className="w-12 text-center">
                  <span className={ready ? "" : "opacity-35"}>
                    <Avatar {...t} size={44} />
                  </span>
                  <div className="mt-1.5 truncate text-[12px] font-semibold text-ink">
                    {t.name}
                  </div>
                  {!ready && <div className="text-[11px] text-ink-3">還沒填</div>}
                </div>
              );
            })}
          </div>

          <div className="num mt-4 text-[12.5px] text-ink-3">
            {c.filled} / {c.total} 位已經填好偏好
          </div>
        </div>
      </div>

      <div className="mt-4 px-5">
        <Button onClick={() => setInvite((v) => !v)}>邀請朋友</Button>
      </div>

      {invite && (
        <div className="rm-in mt-3 px-5">
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              把連結傳給朋友，他們填完偏好就會出現在上面。
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-xl bg-bg px-3 py-3.5 text-[13px] text-ink-2">
                {INVITE_LINK}
              </div>
              <button
                onClick={copy}
                className="h-12 shrink-0 rounded-xl bg-bg px-4 text-[13px] font-bold text-ink active:bg-surface-2"
              >
                {copied ? "已複製" : "複製連結"}
              </button>
            </div>

            <div className="mt-3 space-y-0.5">
              {["用 LINE 傳給朋友", "用 WhatsApp 傳給朋友"].map((label) => (
                <div key={label} className="flex h-11 items-center gap-2">
                  <span className="flex-1 text-[14px] text-ink-3">{label}</span>
                  <Tag kind="later" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Section tight>
        <Row
          icon="🙋"
          label="我的偏好"
          value={mineFilled ? "已填寫" : "還沒填"}
          onClick={() => nav.go({ k: "prefs" })}
        />
        <Row
          icon="📍"
          label="大家想去的地方"
          value={`${ROOM.poiIds.length} 個地點 · ${ROOM.votes.length} 票`}
          onClick={() => nav.go({ k: "pool" })}
        />
        <Row
          icon="✨"
          label="AI 幫大家排行程"
          value={`共識 ${pct(c.score)}`}
          onClick={() => nav.go({ k: "consensus2" })}
        />
      </Section>

      <div className="pb-24" />
    </Screen>
  );
}

/* ----------------------------------------------------------------- prefs */

export function Prefs() {
  const nav = useNav();
  const [interests, setInterests] = useState<InterestId[]>(MINE?.interests ?? []);
  const [pace, setPace] = useState<Pace>(MINE?.pace ?? "normal");
  const [budget, setBudget] = useState<Preference["budget"]>(MINE?.budget ?? 2);
  const [mustGo, setMustGo] = useState(MINE?.mustGo ?? "");
  const [avoid, setAvoid] = useState(MINE?.avoid ?? "");

  const toggle = (id: InterestId) =>
    setInterests((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  const save = () => {
    track("pref_saved");
    nav.back();
  };

  const input =
    "h-13 w-full rounded-2xl bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-ink-3";

  return (
    <Screen>
      <TopBar title="這趟旅行你想怎麼玩？" onBack={nav.back} />

      <div className="px-5 pt-2">
        <Field label="興趣">
          <div className="flex flex-wrap gap-2 gap-y-3.5">
            {(Object.keys(INTEREST_LABELS) as InterestId[]).map((id) => (
              <Chip key={id} active={interests.includes(id)} onClick={() => toggle(id)}>
                {INTEREST_LABELS[id]}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="旅行節奏">
          <Choice
            items={PACES.map((p) => ({ id: p, label: PACE_LABELS[p] }))}
            value={pace}
            onChange={setPace}
          />
        </Field>

        <Field label="預算">
          <Choice items={BUDGETS} value={budget} onChange={setBudget} />
        </Field>

        <Field label="我一定要去">
          <input
            className={input}
            value={mustGo}
            onChange={(e) => setMustGo(e.target.value)}
            placeholder="一個地方就好"
          />
        </Field>

        <Field label="我不想去">
          <input
            className={input}
            value={avoid}
            onChange={(e) => setAvoid(e.target.value)}
            placeholder="沒有的話留空"
          />
        </Field>
      </div>

      <div className="mt-auto px-5 pb-24 pt-9">
        <Button onClick={save}>儲存偏好</Button>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ pool */

/** Re-tally one place with the current user's vote replaced by their new one. */
function withMyVote(t: Tally, now: VoteValue | null): Tally {
  const before = MY_VOTES[t.poiId] ?? null;
  if (now === before) return t;
  const by: Record<VoteValue, TravellerId[]> = {
    yes: t.by.yes.filter((w) => w !== ME.id),
    maybe: t.by.maybe.filter((w) => w !== ME.id),
    no: t.by.no.filter((w) => w !== ME.id),
  };
  if (now) by[now] = [...by[now], ME.id];
  return {
    poiId: t.poiId,
    yes: by.yes.length,
    maybe: by.maybe.length,
    no: by.no.length,
    by,
  };
}

export function Pool() {
  const nav = useNav();
  const [mine, setMine] = useState<Record<string, VoteValue>>(MY_VOTES);

  const rows = useMemo(() => POOL.map((t) => withMyVote(t, mine[t.poiId] ?? null)), [mine]);

  const cast = (poiId: string, value: VoteValue) => {
    setMine((m) => ({ ...m, [poiId]: value }));
    track("vote_cast", { poiId });
  };

  return (
    <Screen>
      <TopBar title="大家想去的地方" onBack={nav.back} />

      <div>
        {rows.map((t) => {
          const p = poi(t.poiId);
          const voted = t.yes + t.maybe + t.no > 0;
          return (
            <div key={t.poiId} className="border-b border-line px-5 py-4">
              <div className="flex gap-3">
                <Cover poi={p} height={64} radius={12} emoji={false} className="w-[72px]" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">{p.name}</div>
                  <div className="mt-0.5 truncate text-[12.5px] text-ink-3">{p.area}</div>

                  {voted ? (
                    <div className="mt-2 flex items-center gap-3">
                      {/* Zeros are not information. "🤔 0 👎 0" on every row turns
                          a list of places into a table of counters. */}
                      {VOTES.filter((v) => t[v] > 0).map((v) => (
                        <span key={v} className="num text-[12.5px] text-ink-2">
                          {VOTE_EMOJI[v]} {t[v]}
                        </span>
                      ))}
                      {t.by.yes.length > 0 && (
                        <div className="ml-auto">
                          <Faces who={t.by.yes} size={19} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-[12.5px] text-ink-3">還沒有人投票</div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {VOTES.map((v) => {
                  const on = mine[t.poiId] === v;
                  return (
                    <button
                      key={v}
                      onClick={() => cast(t.poiId, v)}
                      className={`h-11 flex-1 rounded-xl text-[13.5px] font-semibold transition active:scale-[.985] ${
                        on ? "bg-brand text-white" : "bg-surface text-ink-2 active:bg-surface-2"
                      }`}
                    >
                      {VOTE_LABELS[v]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* No chevron, because there is nothing behind it yet. */}
      <Row icon="＋" label="加入其他地方" />

      <div className="pb-24" />
    </Screen>
  );
}

/* ------------------------------------------------------------- consensus */

export function ConsensusView() {
  const nav = useNav();
  const c = useMemo(() => consensus(ROOM), []);

  useEffect(() => {
    track("consensus_view");
  }, []);

  const accept = () => {
    track("consensus_accept", { tripId: ROOM_TRIP_ID });
    /* adoptTrip, not go: the itinerary the group just agreed to has to exist in
       live state before it can be opened. Navigating straight to its id landed
       on a blank screen — at the exact moment the feature is supposed to pay
       off. */
    nav.adoptTrip(ROOM_TRIP_ID);
  };

  const s = c.suggestion;

  return (
    <Screen>
      <TopBar title="AI 幫大家排行程" onBack={nav.back} />

      {/* No 40px score tile, no distribution bars.
          A group arguing about 奇美博物館 does not want a KPI — it wants to know
          what is settled, what is not, and who is on which side. The percentage
          survives because the previous screen advertises it, but it sits under
          the sentence that derives it rather than above a chart: 共識 80% means
          nothing on its own, and "投過票的 10 個地點裡有 8 個沒有人反對" can be
          checked against the list immediately below it. */}
      <div className="px-5 pt-2">
        <p className="text-[17px] font-semibold leading-relaxed text-ink">
          投過票的 {VOTED.length} 個地點裡，有 {c.agreed.length} 個沒有人反對。
        </p>
        <p className="num mt-1.5 text-[13px] text-ink-3">共識 {pct(c.score)}</p>
      </div>

      <Section title="大家想做的事">
        <div className="space-y-2.5 px-5">
          {c.interests.map((b) => (
            <div key={b.id} className="flex items-center gap-3">
              <span className="text-[14.5px] text-ink">{b.label}</span>
              <div className="ml-auto">
                <Faces who={wantedBy(b.id)} size={19} />
              </div>
            </div>
          ))}
        </div>
        {/* The caveat belongs here and nowhere else: a missing preference moves
            these rows, not the score — Susan voted on everything. Parked under
            the percentage it implied the opposite. */}
        <p className="num px-5 pt-3.5 text-[12.5px] text-ink-3">
          {c.filled} / {c.total} 位旅伴已經填好偏好
        </p>
      </Section>

      <Section title="大家都想去">
        <div className="space-y-2 px-5">
          {c.agreed.map((t) => (
            <div key={t.poiId} className="flex items-center gap-2.5">
              <span className="text-[15px] text-ok">✓</span>
              <span className="truncate text-[14.5px] font-semibold text-ink">
                {poi(t.poiId).name}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="還要一起決定">
        <div className="space-y-3 px-5">
          {c.contested.map((t) => (
            <div key={t.poiId} className="rounded-2xl bg-surface p-4">
              <div className="text-[15px] font-bold text-ink">{poi(t.poiId).name}</div>
              {/* Names and faces instead of "2 想去 · 1 不想去". The counts were
                  the same information with the useful half removed: you cannot
                  go and talk to a 2. */}
              <div className="mt-2 space-y-1.5">
                {t.by.yes.length > 0 && (
                  <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
                    <Faces who={t.by.yes} size={20} ring="ring-surface" />
                    <span>{names(t.by.yes)} 想去</span>
                  </div>
                )}
                {t.by.no.length > 0 && (
                  <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
                    <Faces who={t.by.no} size={20} ring="ring-surface" />
                    <span>{names(t.by.no)} 不想去</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {s && (
        <div className="mt-7 px-5">
          {/* The wash is the AI highlight, on its own. An orange hairline round
              it is a third orange thing on a screen that already ends in an
              orange CTA — same call Group.tsx made. */}
          <div className="rounded-2xl bg-brand-wash p-4">
            <div className="text-[12px] font-bold tracking-wide text-brand">AI 建議</div>
            <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{s.reason}</p>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-bg p-3">
              <span className="truncate text-[14px] text-ink-3 line-through">
                {poi(s.dropPoiId).name}
              </span>
              <span className="shrink-0 text-[14px] text-ink-3">→</span>
              <span className="truncate text-[14.5px] font-bold text-ink">
                {poi(s.addPoiId).name}
              </span>
            </div>

            {s.savedMin > 0 && (
              <div className="num mt-2.5 text-[12.5px] text-ink-3">
                可以少走約 {s.savedMin} 分鐘
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto space-y-2 px-5 pb-24 pt-8">
        <Button onClick={accept}>接受 AI 建議</Button>
        <Button variant="ghost" onClick={nav.back}>
          再看看
        </Button>
      </div>
    </Screen>
  );
}
