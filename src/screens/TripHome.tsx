import { AGREED, BY_TRAVELLER, CONFLICT, TRAVELLERS, spot } from "../data/demo";
import { INTEREST_LABELS, type Trip, type TravellerId } from "../types";
import { Avatar, Button, Card, Screen, Section, Thumb, TopBar } from "../components/ui";

/* ------------------------------------------------------- trip overview */

export function TripHome({
  trip,
  onDay,
  onTravellers,
  onMap,
}: {
  trip: Trip;
  onDay: (n: number) => void;
  onTravellers: () => void;
  onMap: () => void;
}) {
  return (
    <Screen>
      <TopBar
        title={`${trip.city} ${trip.nights + 1} 天 ${trip.nights} 夜`}
        right={
          <button
            onClick={onMap}
            aria-label="地圖"
            className="grid size-11 place-items-center rounded-full active:bg-surface"
          >
            <MapIcon />
          </button>
        }
      />
      <div className="num px-5 text-[13px] text-ink-3">{trip.dates}</div>

      <div className="mt-4 px-5">
        <button
          onClick={onTravellers}
          className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
        >
          <div className="flex -space-x-2">
            {TRAVELLERS.map((t) => (
              <span key={t.id} className="ring-2 ring-surface rounded-full">
                <Avatar {...t} size={30} />
              </span>
            ))}
          </div>
          <div className="flex-1">
            <div className="text-[14.5px] font-bold text-ink">4 位旅伴</div>
            <div className="text-[12.5px] text-ink-3">看大家想去哪</div>
          </div>
          <span className="text-ink-3">›</span>
        </button>
      </div>

      <Section title="每日行程" tight>
        <div className="space-y-2.5 px-5">
          {trip.days.map((d) => {
            const stops = d.tracks.flatMap((t) => t.stops);
            const first = stops[0];
            return (
              <Card key={d.n} onClick={() => onDay(d.n)} className="p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[15px] font-bold text-ink">
                    Day {d.n}
                    {trip.phase === "ongoing" && d.n === trip.today && (
                      <span className="ml-2 rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-bold text-brand">
                        今天
                      </span>
                    )}
                  </span>
                  <span className="num text-[12.5px] text-ink-3">
                    {d.date} {d.weekday}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  {stops.slice(0, 4).map((s) => {
                    const sp = spot(s.spotId);
                    return <Thumb key={s.id} emoji={sp.emoji} tint={sp.tint} size={40} radius={11} />;
                  })}
                  {stops.length > 4 && (
                    <span className="num text-[12.5px] text-ink-3">
                      +{stops.length - 4}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 text-[12.5px] text-ink-3">
                  {first && `${first.at} 出發 · `}
                  {stops.length} 個行程
                  {d.meetUp && " · 分開走再會合"}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <div className="h-24" />
    </Screen>
  );
}

/* ------------------------------------------------------------ travellers */

export function Travellers({
  onBack,
  onConsensus,
}: {
  onBack: () => void;
  onConsensus: () => void;
}) {
  return (
    <Screen>
      <TopBar title="旅伴" onBack={onBack} />
      <div className="px-5 pt-2">
        {TRAVELLERS.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 border-b border-line py-4 last:border-0"
          >
            <Avatar {...t} size={40} />
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-ink">{t.name}</div>
              <div className="mt-0.5 text-[13px] text-ink-3">
                {t.likes.map((l) => INTEREST_LABELS[l]).join(" / ")}
                {t.note && ` · ${t.note}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto px-5 pb-6 pt-8">
        <Button onClick={onConsensus}>AI 幫大家找共識</Button>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------- consensus */

/**
 * No scores, no percentages, no "127 combinations".
 *
 * The traveller needs two things: what everybody already agrees on, and the one
 * thing that still needs sorting out. Everything else the coordinator worked
 * out is invisible, which is the point — it only has to be explainable, not
 * displayed.
 */
export function Consensus({
  onBack,
  onAccept,
  onAlternatives,
}: {
  onBack: () => void;
  onAccept: () => void;
  onAlternatives: () => void;
}) {
  const names = (ids: TravellerId[]) => ids.map((i) => BY_TRAVELLER[i].name).join("、");

  return (
    <Screen>
      <TopBar title="AI 建議" onBack={onBack} />

      <div className="px-5 pt-2">
        <p className="text-[15px] leading-relaxed text-ink">
          這趟旅行大家最一致的是：
        </p>
        <div className="mt-3 space-y-2">
          {AGREED.map((a) => (
            <div key={a.label} className="flex items-center gap-2.5">
              <span className="text-[15px] text-ok">✓</span>
              <span className="text-[15px] font-semibold text-ink">{a.label}</span>
              <div className="ml-auto flex -space-x-1.5">
                {a.who.map((w) => (
                  <span key={w} className="rounded-full ring-2 ring-bg">
                    <Avatar {...BY_TRAVELLER[w]} size={22} />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 px-5">
        <p className="text-[15px] leading-relaxed text-ink">
          目前有 <b>1 個</b>需要協調：
        </p>

        <div className="mt-3 rounded-2xl bg-surface p-4">
          <div className="text-[17px] font-bold text-ink">{CONFLICT.topic}</div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
              <span className="flex -space-x-1.5">
                {CONFLICT.wants.map((w) => (
                  <span key={w} className="rounded-full ring-2 ring-surface">
                    <Avatar {...BY_TRAVELLER[w]} size={20} />
                  </span>
                ))}
              </span>
              {names(CONFLICT.wants)} 想去
            </div>
            <div className="flex items-center gap-2 text-[13.5px] text-ink-2">
              <span className="flex -space-x-1.5">
                {CONFLICT.against.map((w) => (
                  <span key={w} className="rounded-full ring-2 ring-surface">
                    <Avatar {...BY_TRAVELLER[w]} size={20} />
                  </span>
                ))}
              </span>
              {names(CONFLICT.against)} {CONFLICT.againstReason}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="rounded-2xl border border-brand/25 bg-brand-wash p-4">
          <div className="text-[12px] font-bold uppercase tracking-wide text-brand">
            AI 建議
          </div>
          <div className="mt-1.5 text-[17px] font-bold text-ink">
            Day {CONFLICT.suggestion.day} 分頭行動
          </div>

          <div className="mt-3 space-y-2.5">
            {CONFLICT.suggestion.groups.map((g) => (
              <div key={g.where} className="flex items-center gap-2.5 rounded-xl bg-bg p-3">
                <div className="flex -space-x-1.5">
                  {g.who.map((w) => (
                    <span key={w} className="rounded-full ring-2 ring-bg">
                      <Avatar {...BY_TRAVELLER[w]} size={24} />
                    </span>
                  ))}
                </div>
                <div className="text-[14px] text-ink-3">→</div>
                <div className="text-[14.5px] font-semibold text-ink">{g.where}</div>
              </div>
            ))}
            <div className="flex items-center gap-2.5 px-1">
              <span className="num text-[14px] font-bold text-ink">
                {CONFLICT.suggestion.meet.at}
              </span>
              <span className="text-[14px] text-ink-3">→</span>
              <span className="text-[14px] text-ink-2">
                {CONFLICT.suggestion.meet.where}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* pb-24 clears the tab bar; the decision must never sit under it. */}
      <div className="mt-auto space-y-2 px-5 pb-24 pt-8">
        <Button onClick={onAccept}>採用這個方案</Button>
        <Button variant="ghost" onClick={onAlternatives}>
          看看其他方案
        </Button>
      </div>
    </Screen>
  );
}

export function Alternatives({ onBack }: { onBack: () => void }) {
  return (
    <Screen>
      <TopBar title="其他方案" onBack={onBack} />
      <div className="space-y-3 px-5 pt-2">
        {CONFLICT.alternatives.map((a) => (
          <div key={a.id} className="rounded-2xl bg-surface p-4">
            <div className="text-[15.5px] font-bold text-ink">{a.label}</div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{a.why}</p>
          </div>
        ))}
        <p className="px-1 pt-2 text-[13px] leading-relaxed text-ink-3">
          分頭行動是唯一讓四個人都拿到想要的東西的做法，所以 ResoMap 把它排在第一個。
        </p>
      </div>
    </Screen>
  );
}

function MapIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#16150f" strokeWidth="1.7">
      <path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" strokeLinejoin="round" />
      <path d="M9 4.5v12.7M15 6.8v12.7" />
    </svg>
  );
}
