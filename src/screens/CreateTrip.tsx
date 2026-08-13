import { useState } from "react";
import { useNav } from "../nav";
import {
  OVERSEAS_DESTINATIONS,
  TW_DESTINATIONS,
  dest,
} from "../data/destinations";
import { ME, TRAVELLERS } from "../data/travellers";
import {
  INTEREST_LABELS,
  type Destination,
  type InterestId,
  type TravellerId,
} from "../types";
import { Avatar, Button, Chip, Screen, TopBar } from "../components/ui";
import { track } from "../lib/track";

type Who = "solo" | "partner" | "friends" | "family";

const WHO: { id: Who; label: string; emoji: string }[] = [
  { id: "solo", label: "自己", emoji: "🙋" },
  { id: "partner", label: "伴侶", emoji: "💑" },
  { id: "friends", label: "朋友", emoji: "🧑‍🤝‍🧑" },
  { id: "family", label: "家人", emoji: "👨‍👩‍👧" },
];

/** 樂園 is left out on purpose: it is a Tokyo-specific answer, not a taste. */
const INTERESTS: InterestId[] = [
  "food",
  "culture",
  "nature",
  "shopping",
  "photo",
  "family",
  "nightlife",
];

const QUESTIONS = ["去哪裡？", "什麼時候？", "誰一起？", "想做什麼？", "確認一下"];

/**
 * You cannot invite yourself. `TRAVELLERS` includes the person holding the
 * phone, so the invite list is everyone else.
 */
const INVITABLE = TRAVELLERS.filter((t) => t.id !== ME.id);

/* August 2026: the 1st is a Saturday, so the grid opens with six blanks and
   20–24 runs Thursday to Monday. The calendar is an illustration of one fixed
   demo window, not a picker — so every label is derived from the four numbers
   below and the drawing and the words cannot drift apart. */
const MONTH = 8;
const BLANKS = 6;
const DAYS_IN_MONTH = 31;
const FROM = 20;
const TO = 24;
const DATE_LABEL = `${MONTH} 月 ${FROM} 日 – ${MONTH} 月 ${TO} 日`;
const LENGTH_LABEL = `${TO - FROM + 1} 天 ${TO - FROM} 夜`;

/**
 * Five questions, one per screen.
 *
 * Nothing here asks a solo traveller about companions beyond a single tap, and
 * nothing here mentions disagreement: reconciling four people's wishes is a job
 * for a trip that already exists, not a toll gate in front of creating one.
 */
export function CreateTrip({ destId }: { destId?: string }) {
  const nav = useNav();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(destId ?? "");
  const [who, setWho] = useState<Who | null>(null);
  const [likes, setLikes] = useState<InterestId[]>([]);
  const [inviting, setInviting] = useState(false);
  const [invitees, setInvitees] = useState<TravellerId[]>([]);

  function create() {
    track("trip_created", { destId: selected });
    nav.createTrip(selected);
  }

  if (inviting) {
    const names = INVITABLE.filter((t) => invitees.includes(t.id))
      .map((t) => t.name)
      .join("、");

    return (
      <Screen>
        <TopBar onBack={() => setInviting(false)} />
        <div className="flex flex-1 flex-col px-5 pt-4">
          <h1 className="text-[24px] font-bold leading-snug text-ink">
            要邀請旅伴一起規劃嗎？
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-3">
            他們可以各自標記想去和不想去的地方。也可以先自己排，之後再邀請。
          </p>

          <div className="mt-7 text-[12.5px] text-ink-3">點選要邀請的旅伴</div>
          <div className="mt-2.5 flex flex-wrap items-start gap-2">
            {INVITABLE.map((t) => {
              const on = invitees.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() =>
                    setInvitees((v) =>
                      v.includes(t.id) ? v.filter((x) => x !== t.id) : [...v, t.id],
                    )
                  }
                  aria-pressed={on}
                  className="flex w-[68px] flex-col items-center gap-1 pb-1"
                >
                  <span
                    className={`grid size-14 place-items-center rounded-full transition ${
                      on ? "bg-brand-wash ring-2 ring-brand" : ""
                    }`}
                  >
                    <Avatar
                      name={t.name}
                      color={t.color}
                      initial={t.initial}
                      size={44}
                    />
                  </span>
                  <span
                    className={`text-[12px] ${
                      on ? "font-semibold text-ink" : "text-ink-3"
                    }`}
                  >
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
            {names ? `將邀請 ${names}` : "不選也可以，行程建立後隨時能加人。"}
          </p>

          <div className="mt-7 space-y-2.5">
            {[
              { icon: "💬", label: "用 LINE 邀請" },
              { icon: "🟢", label: "用 WhatsApp 邀請" },
              { icon: "🔗", label: "複製邀請連結" },
            ].map((o) => (
              <button
                key={o.label}
                onClick={create}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 py-4 text-left active:bg-surface-2"
              >
                <span className="text-[19px]">{o.icon}</span>
                <span className="text-[15px] font-semibold text-ink">
                  {o.label}
                </span>
                <span className="ml-auto text-[15px] text-ink-3">›</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
            這是 Demo，不會真的送出邀請；選任一項都會直接建立旅程。
          </p>

          <div className="mt-auto pb-6 pt-8">
            <Button variant="ghost" onClick={create}>
              之後再說
            </Button>
          </div>
        </div>
      </Screen>
    );
  }

  const canNext =
    (step !== 0 || selected !== "") &&
    (step !== 2 || who !== null) &&
    (step !== 3 || likes.length > 0);

  return (
    <Screen>
      <TopBar onBack={() => (step === 0 ? nav.back() : setStep(step - 1))} />

      <div className="px-5">
        <div
          className="flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={QUESTIONS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`第 ${step + 1} 步，共 ${QUESTIONS.length} 步`}
        >
          {QUESTIONS.map((q, i) => (
            <span
              key={q}
              className={`h-1 flex-1 rounded-full ${
                i <= step ? "bg-brand" : "bg-surface-2"
              }`}
            />
          ))}
        </div>
        <h1 className="mt-6 text-[26px] font-bold text-ink">{QUESTIONS[step]}</h1>
      </div>

      <div className="flex-1 px-5 pb-6 pt-6">
        {step === 0 && (
          <>
            <h2 className="mb-3 text-[13px] font-semibold text-ink-3">台灣</h2>
            <div className="grid grid-cols-2 gap-3">
              {TW_DESTINATIONS.map((d) => (
                <DestTile
                  key={d.id}
                  d={d}
                  on={selected === d.id}
                  onPick={() => setSelected(d.id)}
                />
              ))}
            </div>
            <h2 className="mb-3 mt-8 text-[13px] font-semibold text-ink-3">海外</h2>
            <div className="grid grid-cols-2 gap-3">
              {OVERSEAS_DESTINATIONS.map((d) => (
                <DestTile
                  key={d.id}
                  d={d}
                  on={selected === d.id}
                  onPick={() => setSelected(d.id)}
                />
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="rounded-2xl bg-surface p-5 text-center">
              <div className="num text-[21px] font-bold text-ink">{DATE_LABEL}</div>
              <div className="mt-1 text-[13px] text-ink-3">{LENGTH_LABEL}</div>
            </div>

            {/* Illustration, not a picker: the dates are announced by the card
                above, so the grid is hidden from assistive tech rather than
                offering 31 cells that do nothing when tapped. */}
            <div aria-hidden="true">
              <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[12px] text-ink-3">
                {["日", "一", "二", "三", "四", "五", "六"].map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {Array.from({ length: BLANKS }, (_, i) => <div key={`b${i}`} />)}
                {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((d) => {
                  const edge = d === FROM || d === TO;
                  const inside = d > FROM && d < TO;
                  return (
                    <div
                      key={d}
                      className={`num grid h-10 place-items-center rounded-lg text-[13px] ${
                        edge
                          ? "bg-brand font-bold text-white"
                          : inside
                            ? "bg-brand-wash font-semibold text-brand"
                            : "text-ink-3"
                      }`}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-3">
              這個 Demo 固定使用 2026 年 8 月的這五天，日曆僅供示意，不能點選。
            </p>
          </>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-3">
            {WHO.map((w) => (
              <button
                key={w.id}
                onClick={() => setWho(w.id)}
                aria-pressed={who === w.id}
                className={`flex flex-col items-start gap-2 rounded-2xl p-5 text-left transition ${
                  who === w.id
                    ? "bg-brand-wash ring-2 ring-brand"
                    : "bg-surface active:bg-surface-2"
                }`}
              >
                <span className="text-[26px]">{w.emoji}</span>
                <span className="text-[15px] font-bold text-ink">{w.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <>
            <p className="text-[13.5px] leading-relaxed text-ink-3">
              可以複選，行程建立後隨時能改。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {INTERESTS.map((k) => (
                <Chip
                  key={k}
                  active={likes.includes(k)}
                  onClick={() =>
                    setLikes((v) =>
                      v.includes(k) ? v.filter((x) => x !== k) : [...v, k],
                    )
                  }
                >
                  {INTEREST_LABELS[k]}
                </Chip>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <div>
            <SummaryRow label="目的地" value={dest(selected)?.name ?? "—"} />
            <SummaryRow label="日期" value={DATE_LABEL} num />
            <SummaryRow label="天數" value={LENGTH_LABEL} />
            <SummaryRow
              label="誰一起"
              value={WHO.find((w) => w.id === who)?.label ?? "—"}
            />
            <SummaryRow
              label="想做什麼"
              value={likes.map((k) => INTEREST_LABELS[k]).join("、")}
            />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-bg px-5 pb-6 pt-3">
        <Button
          disabled={!canNext}
          onClick={() => {
            if (step < 4) return setStep(step + 1);
            if (who === "solo") return create();
            setInviting(true);
          }}
        >
          {step < 4 ? "下一步" : who === "solo" ? "建立旅程" : "邀請旅伴"}
        </Button>
      </div>
    </Screen>
  );
}

function DestTile({
  d,
  on,
  onPick,
}: {
  d: Destination;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button onClick={onPick} aria-pressed={on} className="text-left">
      <div
        className={`grid h-[92px] place-items-center rounded-2xl text-[32px] ${
          on ? "ring-2 ring-brand" : ""
        }`}
        style={{ background: d.tint }}
      >
        {d.emoji}
      </div>
      <div className="mt-1.5 text-[14.5px] font-bold text-ink">{d.name}</div>
    </button>
  );
}

function SummaryRow({
  label,
  value,
  num,
}: {
  label: string;
  value: string;
  num?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-4 last:border-0">
      <span className="shrink-0 text-[14px] text-ink-3">{label}</span>
      <span
        className={`text-right text-[15px] font-semibold text-ink ${num ? "num" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
