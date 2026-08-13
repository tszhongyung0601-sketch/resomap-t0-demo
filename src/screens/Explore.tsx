import { DESTINATIONS, IDEAS, NEARBY, TRIP, spot } from "../data/demo";
import type { Trip } from "../types";
import { Card, Screen, Section, Thumb } from "../components/ui";

/**
 * The home screen asks one question: where do you want to go?
 *
 * It does not ask for budget, pace, companions or constraints. Those belong to
 * the moment they matter — inside a trip — not to the first three seconds of
 * using the app.
 */
export function Explore({
  trip,
  onOpenTrip,
  onToday,
  onCreate,
  onSpot,
}: {
  trip: Trip | null;
  onOpenTrip: () => void;
  onToday: () => void;
  onCreate: () => void;
  onSpot: (id: string) => void;
}) {
  return (
    <Screen>
      <div className="px-5 pb-1 pt-5">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-[13px] font-black text-white">
            R
          </span>
          <span className="text-[15px] font-bold text-ink">ResoMap</span>
        </div>
        <h1 className="mt-4 text-[26px] font-bold leading-tight text-ink">
          {trip?.phase === "ongoing" ? "今天在東京，玩得開心" : "準備去哪裡走走？"}
        </h1>
      </div>

      <div className="px-5 pt-4">
        <button className="flex w-full items-center gap-2.5 rounded-2xl bg-surface px-4 py-3.5 text-left">
          <Search />
          <span className="text-[14.5px] text-ink-3">
            搜尋城市、景點或想做的事情
          </span>
        </button>
        <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {["東京賞櫻", "台南兩天", "週末親子旅行"].map((s) => (
            <span
              key={s}
              className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-[12.5px] text-ink-2"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {trip ? (
        <Section title={trip.phase === "ongoing" ? "旅行進行中" : "正在規劃的旅程"} tight>
          <div className="px-5">
            {trip.phase === "ongoing" ? (
              <OngoingCard trip={trip} onToday={onToday} />
            ) : (
              <PlanningCard trip={trip} onOpen={onOpenTrip} />
            )}
          </div>
        </Section>
      ) : (
        <Section tight>
          <div className="px-5">
            <Card onClick={onCreate} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand-wash text-[19px]">
                  ＋
                </span>
                <div>
                  <div className="text-[15px] font-bold text-ink">建立旅程</div>
                  <div className="text-[13px] text-ink-3">30 秒，四個問題</div>
                </div>
              </div>
            </Card>
          </div>
        </Section>
      )}

      <Section title="找旅行靈感">
        <div className="snap-rail flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              onClick={onCreate}
              className="w-[128px] shrink-0 text-left"
            >
              <div
                className="grid h-[92px] place-items-center rounded-2xl text-[34px]"
                style={{ background: d.tint }}
              >
                {d.emoji}
              </div>
              <div className="mt-2 text-[14.5px] font-bold text-ink">{d.name}</div>
              <div className="text-[12px] text-ink-3">{d.sub}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="你可能會喜歡">
        <div className="grid grid-cols-2 gap-3 px-5">
          {IDEAS.map((i) => (
            <button key={i.id} onClick={onCreate} className="text-left">
              <div
                className="grid h-[104px] place-items-center rounded-2xl text-[32px]"
                style={{ background: i.tint }}
              >
                {i.emoji}
              </div>
              <div className="mt-2 text-[14px] font-bold leading-snug text-ink">
                {i.title}
              </div>
              <div className="text-[12px] text-ink-3">{i.sub}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="附近熱門" action="看地圖" onAction={() => onSpot(NEARBY[0])}>
        <div className="px-5">
          {NEARBY.slice(0, 4).map((id) => {
            const s = spot(id);
            return (
              <button
                key={id}
                onClick={() => onSpot(id)}
                className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-0"
              >
                <Thumb emoji={s.emoji} tint={s.tint} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-ink">
                    {s.name}
                  </div>
                  <div className="text-[12.5px] text-ink-3">
                    {s.area}
                    {s.story && " · 🎧 有語音故事"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <div className="h-24" />
    </Screen>
  );
}

function PlanningCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Thumb emoji="🗼" tint="#E7EDF7" size={52} />
        <div className="flex-1">
          <div className="text-[16px] font-bold text-ink">
            {trip.city} {trip.nights + 1} 天 {trip.nights} 夜
          </div>
          <div className="num mt-0.5 text-[13px] text-ink-3">{trip.dates}</div>
          <div className="mt-0.5 text-[13px] text-ink-3">4 位旅伴</div>
        </div>
      </div>
      <button
        onClick={onOpen}
        className="mt-3.5 h-11 w-full rounded-full bg-brand text-[14px] font-bold text-white active:bg-brand-press"
      >
        繼續規劃
      </button>
    </Card>
  );
}

function OngoingCard({ trip, onToday }: { trip: Trip; onToday: () => void }) {
  const day = trip.days.find((d) => d.n === trip.today);
  const next = day?.tracks[0]?.stops[0];
  const s = next ? spot(next.spotId) : null;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-bold text-ink">{trip.city}旅行</div>
        <span className="num rounded-full bg-brand-wash px-2.5 py-1 text-[12px] font-bold text-brand">
          Day {trip.today} / {trip.nights + 1}
        </span>
      </div>
      {s && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-bg p-3">
          <Thumb emoji={s.emoji} tint={s.tint} size={44} />
          <div className="flex-1">
            <div className="text-[12px] text-ink-3">下一站</div>
            <div className="text-[15px] font-bold text-ink">{s.name}</div>
          </div>
          <div className="num text-[15px] font-bold text-ink">{next?.at}</div>
        </div>
      )}
      <button
        onClick={onToday}
        className="mt-3.5 h-11 w-full rounded-full bg-brand text-[14px] font-bold text-white active:bg-brand-press"
      >
        查看今天行程
      </button>
    </Card>
  );
}

function Search() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#918c83" strokeWidth="2">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  );
}

export const DEMO_TRIP = TRIP;
