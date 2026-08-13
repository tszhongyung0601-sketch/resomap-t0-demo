import { BY_TRAVELLER, DEALS, spot } from "../data/demo";
import { LEG_LABEL, type Day, type Stop, type Trip } from "../types";
import { Avatar, Screen, Thumb, TopBar } from "../components/ui";

/**
 * The itinerary reads top to bottom like a train timetable: time, place, how
 * long, how you get to the next one. Address, reviews, ratings and nearby
 * offers all live behind a tap on the card — putting them here is what makes
 * every other planner's day view exhausting.
 */
export function DayPlan({
  trip,
  day,
  onBack,
  onDay,
  onMap,
  onStop,
  banner,
}: {
  trip: Trip;
  day: number;
  onBack: () => void;
  onDay: (n: number) => void;
  onMap: () => void;
  onStop: (spotId: string) => void;
  /** The in-trip AI card, injected above the timeline when something changed. */
  banner?: React.ReactNode;
}) {
  const d = trip.days.find((x) => x.n === day) ?? trip.days[0];

  return (
    <Screen>
      <TopBar
        title={`${trip.city} ${trip.nights + 1} 天 ${trip.nights} 夜`}
        onBack={onBack}
        right={
          <button
            onClick={onMap}
            aria-label="地圖"
            className="grid size-11 place-items-center rounded-full active:bg-surface"
          >
            <MapIcon />
          </button>
        }
        below={
          <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 no-scrollbar">
            {trip.days.map((x) => (
              <button
                key={x.n}
                onClick={() => onDay(x.n)}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${
                  x.n === day ? "bg-ink text-white" : "bg-surface text-ink-2"
                }`}
              >
                Day {x.n}
              </button>
            ))}
          </div>
        }
      />

      {banner && <div className="px-5 pb-1 pt-1">{banner}</div>}

      <div className="px-5 pt-2">
        <div className="text-[15px] font-bold text-ink">
          {d.date} <span className="font-normal text-ink-3">{d.weekday}</span>
        </div>
      </div>

      <div className="px-5 pb-28 pt-3">
        {d.tracks.filter((t) => t.id !== "d3c").length > 1 ? (
          <SplitTracks day={d} onStop={onStop} />
        ) : (
          d.tracks.map((t) => (
            <Timeline key={t.id} stops={t.stops} onStop={onStop} />
          ))
        )}

        {d.meetUp && (
          <>
            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="num text-[12.5px] font-semibold text-ink-3">
                {d.meetUp.at} 會合
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            {d.tracks
              .filter((t) => t.id === "d3c")
              .map((t) => (
                <Timeline key={t.id} stops={t.stops} onStop={onStop} />
              ))}
          </>
        )}
      </div>
    </Screen>
  );
}

function SplitTracks({ day, onStop }: { day: Day; onStop: (id: string) => void }) {
  const tracks = day.tracks.filter((t) => t.id !== "d3c");
  return (
    <div className="space-y-5">
      {tracks.map((t) => (
        <div key={t.id}>
          <div className="mb-2.5 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {t.who.map((w) => (
                <span key={w} className="rounded-full ring-2 ring-bg">
                  <Avatar {...BY_TRAVELLER[w]} size={22} />
                </span>
              ))}
            </div>
            <span className="text-[13.5px] font-semibold text-ink-2">{t.label}</span>
          </div>
          <Timeline stops={t.stops} onStop={onStop} />
        </div>
      ))}
    </div>
  );
}

function Timeline({
  stops,
  onStop,
}: {
  stops: Stop[];
  onStop: (spotId: string) => void;
}) {
  return (
    <div>
      {stops.map((s, i) => (
        <div key={s.id}>
          {i > 0 && s.from && (
            <div className="flex items-center gap-3 py-2 pl-[52px]">
              <span className="text-[12.5px] text-ink-3">
                {LEG_LABEL[s.from.mode]} {s.from.min} 分鐘
              </span>
            </div>
          )}
          <StopCard stop={s} onClick={() => onStop(s.spotId)} />
        </div>
      ))}
    </div>
  );
}

function StopCard({ stop, onClick }: { stop: Stop; onClick: () => void }) {
  const s = spot(stop.spotId);
  return (
    <button onClick={onClick} className="flex w-full gap-3 py-1.5 text-left">
      <div className="num w-11 shrink-0 pt-1 text-[14px] font-bold text-ink">
        {stop.at}
      </div>
      <Thumb emoji={s.emoji} tint={s.tint} size={60} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15.5px] font-semibold text-ink">{s.name}</span>
          {stop.meal && (
            <span className="shrink-0 text-[12px] text-ink-3">
              {stop.meal === "lunch" ? "午餐" : "晚餐"}
            </span>
          )}
        </div>
        {stop.stayMin > 0 && (
          <div className="mt-0.5 text-[12.5px] text-ink-3">
            停留 {fmtStay(stop.stayMin)}
          </div>
        )}
        {stop.changed && (
          <div className="mt-1.5 inline-block rounded-md bg-brand-wash px-1.5 py-0.5 text-[11px] font-semibold text-brand">
            {stop.changed}
          </div>
        )}
      </div>
    </button>
  );
}

function fmtStay(min: number) {
  if (min < 60) return `${min} 分鐘`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} 小時 ${m} 分` : `${h} 小時`;
}

/* ------------------------------------------------------------ spot sheet */

export function SpotDetail({
  spotId,
  onBack,
  onStory,
}: {
  spotId: string;
  onBack: () => void;
  onStory: (id: string) => void;
}) {
  const s = spot(spotId);
  const deals = DEALS.filter((d) => d.spotId === spotId);

  return (
    <Screen>
      <div
        className="relative grid h-[220px] place-items-center text-[64px]"
        style={{ background: s.tint }}
      >
        {s.emoji}
        <button
          onClick={onBack}
          className="absolute left-4 top-4 grid size-10 place-items-center rounded-full bg-bg/90 text-[18px]"
        >
          ‹
        </button>
      </div>

      <div className="px-5 pt-5">
        <h1 className="text-[22px] font-bold text-ink">{s.name}</h1>
        <div className="mt-1 text-[13.5px] text-ink-3">{s.area}</div>
        {s.about && (
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{s.about}</p>
        )}

        {s.story && (
          <button
            onClick={() => onStory(s.id)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left active:bg-surface-2"
          >
            <span className="text-[22px]">🎧</span>
            <div className="flex-1">
              <div className="text-[14.5px] font-semibold text-ink">聽這裡的故事</div>
              <div className="num text-[12.5px] text-ink-3">{s.story.minutes} 分鐘</div>
            </div>
            <span className="text-ink-3">›</span>
          </button>
        )}

        {deals.length > 0 && (
          <div className="mt-5">
            <div className="text-[13px] font-semibold text-ink-3">需要門票？</div>
            {deals.map((d) => (
              <div
                key={d.id}
                className="mt-2 flex items-center gap-3 rounded-2xl bg-surface p-3.5"
              >
                <Thumb emoji={d.emoji} tint={d.tint} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-ink">
                    {d.title}
                  </div>
                  <div className="num text-[12.5px] text-ink-3">
                    {d.provider} · NT$ {d.priceTwd.toLocaleString()} 起
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-bg px-3 py-2 text-[12.5px] font-bold text-brand">
                  查看
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-24" />
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
