import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { COMMERCE_BY_ID } from "../data/commerce";
import { TRAVELLER_BY_ID } from "../data/people";
import { SPOT_BY_ID } from "../data/spots";
import {
  dayWalkKm,
  loadOfDay,
  retime,
  violationsOfDay,
  type Violation,
} from "../lib/coordinator";
import { track } from "../lib/track";
import {
  ADAPT_LABELS,
  LEG_MODE_ICON,
  LEG_MODE_LABELS,
  type AdaptOption,
  type AdaptScenario,
  type Branch,
  type Preference,
  type Stop,
  type Trip,
  type TravellerId,
} from "../types";
import { Avatar, OwnerDots } from "./bits";
import { StatusBar } from "./S0Start";

export function S4Itinerary({
  trip,
  prefs,
  consensus,
  activeDay,
  setActiveDay,
  onTripChange,
  onRecoordinate,
  adapt,
  onAdaptChoose,
  onAdaptDismiss,
  onOpenVoice,
  onOpenMap,
  onOpenTools,
}: {
  trip: Trip;
  prefs: Record<TravellerId, Preference>;
  consensus: number;
  activeDay: number;
  setActiveDay: (d: number) => void;
  onTripChange: (t: Trip) => void;
  onRecoordinate: () => void;
  adapt: AdaptScenario | null;
  onAdaptChoose: (o: AdaptOption) => void;
  onAdaptDismiss: () => void;
  onOpenVoice: (spotId: string) => void;
  onOpenMap: () => void;
  onOpenTools: () => void;
}) {
  const [violations, setViolations] = useState<Violation[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const day = trip.days.find((d) => d.day === activeDay) ?? trip.days[0];
  const isOverview = activeDay === 0;
  const load = useMemo(() => loadOfDay(day), [day]);

  function handleDragEnd(e: DragEndEvent, branch: Branch) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = branch.stops.findIndex((s) => s.stopId === active.id);
    const to = branch.stops.findIndex((s) => s.stopId === over.id);
    if (from < 0 || to < 0) return;

    const moved = retime(
      { ...branch, stops: arrayMove(branch.stops, from, to) },
      branch.stops[0].arrive,
    );
    const nextDay = {
      ...day,
      branches: day.branches.map((b) => (b.id === branch.id ? moved : b)),
    };
    const next: Trip = {
      ...trip,
      days: trip.days.map((d) => (d.day === day.day ? nextDay : d)),
    };
    onTripChange(next);

    const found = violationsOfDay(nextDay, prefs);
    track("manual_reorder", {
      branch: branch.id,
      moved: SPOT_BY_ID[branch.stops[from].spotId]?.name,
      violations: found.length,
    });
    setViolations(found);
  }

  return (
    <div className="flex h-full flex-col">
      <StatusBar />

      {/* header ------------------------------------------------------- */}
      <div className="shrink-0 border-b border-line px-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-serif text-[19px] leading-none text-ink">
              {trip.destination} · 3 天 2 夜
            </div>
            <div className="num mt-1 text-[11px] font-bold text-ink-mute">
              住 {trip.lodging.area} · NT${trip.lodging.perNightTwd.toLocaleString()}／晚·人
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-wider text-ink-mute">
              共識度
            </div>
            <div className="num font-serif text-[22px] font-bold leading-none text-orange">
              {consensus}%
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[0, 1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${
                activeDay === d ? "bg-ink text-white" : "text-ink-mute"
              }`}
            >
              {d === 0 ? "總覽" : `第 ${d} 天`}
            </button>
          ))}
          <button className="shrink-0 rounded-full px-2 py-1.5 text-[13px] text-ink-mute">
            ＋
          </button>
          <button className="shrink-0 rounded-full px-2 py-1.5 text-[13px] text-ink-mute">
            －
          </button>
          <div className="ml-auto flex shrink-0 gap-1">
            <button
              onClick={onOpenMap}
              className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
            >
              🗺 地圖
            </button>
            <button
              onClick={() => {
                track("ai_recoordinate", { day: activeDay });
                onRecoordinate();
              }}
              className="rounded-full bg-orange px-2.5 py-1.5 text-[11px] font-black text-white"
            >
              ⚡ 重新協調
            </button>
          </div>
        </div>
      </div>

      {/* body --------------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
        {adapt && (
          <AdaptCard scenario={adapt} onChoose={onAdaptChoose} onDismiss={onAdaptDismiss} />
        )}

        {violations && (
          <ViolationCard
            violations={violations}
            onKeep={() => setViolations(null)}
            onRecoordinate={() => {
              setViolations(null);
              onRecoordinate();
            }}
          />
        )}

        {isOverview ? (
          <Overview trip={trip} prefs={prefs} onPick={setActiveDay} />
        ) : (
          <>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="font-serif text-[20px] text-ink">
                  {day.date} {day.weekday}
                </div>
                <div className="num mt-0.5 text-[11px] font-bold text-ink-mute">
                  {day.departAt} 出發 · 步行 {dayWalkKm(day).toFixed(1)}km · 結束{" "}
                  {load.endsAt}
                </div>
              </div>
              <span className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink-soft">
                🚃 電車 ▾
              </span>
            </div>

            {day.rejoin && <SplitBanner day={day.day} />}

            <div className={day.branches.length > 2 ? "" : ""}>
              {day.branches.filter((b) => b.id !== "d2-join").length > 1 ? (
                <div className="grid grid-cols-2 gap-2">
                  {day.branches
                    .filter((b) => b.id !== "d2-join")
                    .map((b) => (
                      <BranchColumn
                        key={b.id}
                        branch={b}
                        compact
                        sensors={sensors}
                        onDragEnd={(e) => handleDragEnd(e, b)}
                        onOpenVoice={onOpenVoice}
                      />
                    ))}
                </div>
              ) : (
                day.branches.map((b) => (
                  <BranchColumn
                    key={b.id}
                    branch={b}
                    sensors={sensors}
                    onDragEnd={(e) => handleDragEnd(e, b)}
                    onOpenVoice={onOpenVoice}
                  />
                ))
              )}
            </div>

            {day.rejoin && (
              <>
                <RejoinBar at={day.rejoin.at} />
                {day.branches
                  .filter((b) => b.id === "d2-join")
                  .map((b) => (
                    <BranchColumn
                      key={b.id}
                      branch={b}
                      sensors={sensors}
                      onDragEnd={(e) => handleDragEnd(e, b)}
                      onOpenVoice={onOpenVoice}
                    />
                  ))}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB ---------------------------------------------------------- */}
      <div className="pointer-events-none absolute bottom-24 right-4 z-30 flex flex-col items-end gap-2">
        {addOpen && (
          <div className="rm-rise pointer-events-auto flex flex-col items-end gap-2">
            <div className="text-[13px] font-black text-ink">新增景點</div>
            {["🗺 從地圖搜尋", "◎ 選區域搜尋", "♡ 從收藏選擇"].map((l) => (
              <button
                key={l}
                onClick={() => setAddOpen(false)}
                className="rounded-full bg-white px-4 py-2.5 text-[12.5px] font-bold text-ink shadow-[0_4px_14px_rgba(28,13,10,.18)]"
              >
                {l}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="pointer-events-auto grid size-13 place-items-center rounded-full bg-orange text-2xl font-light text-white shadow-[0_6px_18px_rgba(255,98,16,.4)]"
        >
          {addOpen ? "✕" : "＋"}
        </button>
      </div>

      <div className="shrink-0 border-t border-line bg-white px-4 py-3">
        <button
          onClick={onOpenTools}
          className="w-full rounded-full border-[1.5px] border-line-strong py-2.5 text-[13px] font-bold text-ink-soft"
        >
          行程工具・訂票・分帳
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- pieces */

function SplitBanner({ day }: { day: number }) {
  return (
    <div className="mb-2 rounded-xl border border-orange/30 bg-orange-tint px-3 py-2.5">
      <div className="text-[11.5px] font-black text-orange-deep">
        ⚡ D{day} 分頭行動
      </div>
      <p className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
        阿哲的「迪士尼必去」與小雨的「不進樂園」無法同時滿足，
        協調結果是兩組人各走各的，晚上會合吃飯。
      </p>
    </div>
  );
}

function RejoinBar({ at }: { at: string }) {
  return (
    <div className="my-2 flex items-center gap-2">
      <div className="h-px flex-1 bg-line-strong" />
      <span className="num rounded-full bg-ink px-3 py-1 text-[11px] font-black text-white">
        {at} 會合
      </span>
      <div className="h-px flex-1 bg-line-strong" />
    </div>
  );
}

function BranchColumn({
  branch,
  compact,
  sensors,
  onDragEnd,
  onOpenVoice,
}: {
  branch: Branch;
  compact?: boolean;
  sensors: ReturnType<typeof useSensors>;
  onDragEnd: (e: DragEndEvent) => void;
  onOpenVoice: (spotId: string) => void;
}) {
  return (
    <div>
      {branch.label && (
        <div className="mb-1.5 flex items-center gap-1.5 px-0.5">
          {branch.travellers.map((t) => (
            <Avatar key={t} id={t} size={18} />
          ))}
          <span className="text-[11px] font-black text-ink-soft">{branch.label}</span>
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={branch.stops.map((s) => s.stopId)}
          strategy={verticalListSortingStrategy}
        >
          {branch.stops.map((stop) => (
            <SortableStop
              key={stop.stopId}
              stop={stop}
              compact={compact}
              onOpenVoice={onOpenVoice}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableStop({
  stop,
  compact,
  onOpenVoice,
}: {
  stop: Stop;
  compact?: boolean;
  onOpenVoice: (spotId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.stopId });
  const spot = SPOT_BY_ID[stop.spotId];
  if (!spot) return null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-60" : ""}
    >
      {stop.legFrom && (
        <div className="num flex items-center gap-1.5 py-1.5 pl-1 text-[11px] font-bold text-ink-mute">
          <span className="ml-1 h-5 w-px bg-line-strong" />
          {LEG_MODE_ICON[stop.legFrom.mode]} {LEG_MODE_LABELS[stop.legFrom.mode]}{" "}
          {stop.legFrom.minutes} 分
          {stop.legFrom.metres > 0 && ` · ${stop.legFrom.metres}m`}
        </div>
      )}

      {stop.commerceIds?.map((id) => <CommerceCard key={id} id={id} />)}

      <div
        {...attributes}
        {...listeners}
        className="mb-1 flex touch-none gap-2.5 rounded-2xl border border-line bg-white p-3 shadow-[0_2px_10px_rgba(28,13,10,.05)]"
      >
        <div className="num w-11 shrink-0 pt-0.5 text-right">
          <div className="font-serif text-[16px] font-bold leading-none text-ink">
            {stop.arrive}
          </div>
          <div className="mt-1 text-[10px] font-bold text-ink-mute">{stop.stayMin} 分</div>
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-cream text-xl">
          {spot.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <span className={`font-black text-ink ${compact ? "text-[13px]" : "text-[15px]"}`}>
              {spot.name}
            </span>
            {stop.locked && <span className="mt-0.5 text-[11px]">🔒</span>}
          </div>
          {!compact && (
            <div className="mt-0.5 text-[11.5px] leading-snug text-ink-mute">{spot.note}</div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <OwnerDots ids={stop.forTravellers} />
          </div>
          {stop.adaptedBy && (
            <div className="mt-1.5 inline-block rounded-md bg-blue-tint px-1.5 py-0.5 text-[10px] font-black text-blue">
              因{stop.adaptedBy}調整
            </div>
          )}
          {spot.voice && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenVoice(spot.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-2 rounded-full border-[1.3px] border-line-strong px-2.5 py-1 text-[11px] font-bold text-ink-soft"
            >
              ▶ 語音導覽
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CommerceCard({ id }: { id: string }) {
  const item = COMMERCE_BY_ID[id];
  if (!item) return null;
  const cur = item.currency === "JPY" ? "¥" : "NT$";
  return (
    <div className="relative mb-1.5 overflow-hidden rounded-2xl border-[1.6px] border-orange/35 bg-gradient-to-br from-[#FFF6EE] to-orange-tint p-3">
      <span className="absolute inset-y-0 left-0 w-1 bg-orange" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-orange px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-white">
            💰 {item.provider}
          </span>
          <div className="mt-1.5 text-[13.5px] font-black leading-snug text-ink">
            {item.title}
          </div>
          <div className="mt-1 flex gap-1 text-[11.5px] leading-snug text-[#6d4a34]">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-orange" />
            {item.reason}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="num font-serif text-[20px] font-bold leading-none text-orange">
          {cur}
          {item.price.toLocaleString()}
          <span className="ml-1 font-sans text-[10px] font-bold text-[#9a6a4a]">
            {item.unit === "person" ? "／人" : item.unit === "night" ? "／房晚" : "／組"}
          </span>
        </div>
        <button
          onClick={() => track("ota_click", { item: item.id })}
          className="rounded-full bg-orange px-4 py-2 text-[12.5px] font-black text-white shadow-[0_4px_12px_rgba(255,98,16,.36)]"
        >
          查看
        </button>
      </div>
    </div>
  );
}

function ViolationCard({
  violations,
  onKeep,
  onRecoordinate,
}: {
  violations: Violation[];
  onKeep: () => void;
  onRecoordinate: () => void;
}) {
  return (
    <div className="rm-rise mt-3 rounded-2xl border-[1.5px] border-bad/30 bg-bad-tint p-3.5">
      <div className="text-[12.5px] font-black text-bad">
        {violations.length ? "⚠ 這樣改之後：" : "✓ 這樣改沒有踩到任何人的限制"}
      </div>
      <ul className="mt-2 space-y-1.5">
        {violations.map((v, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <Avatar id={v.travellerId} size={16} />
            <span className="text-[11.5px] text-ink-soft">
              <b>{TRAVELLER_BY_ID[v.travellerId].name}</b>：{v.message}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onKeep}
          className="flex-1 rounded-full border-[1.5px] border-line-strong bg-white py-2 text-[12px] font-bold text-ink-soft"
        >
          保留我的改動
        </button>
        <button
          onClick={onRecoordinate}
          className="flex-1 rounded-full bg-orange py-2 text-[12px] font-black text-white"
        >
          讓 AI 重新協調
        </button>
      </div>
    </div>
  );
}

function AdaptCard({
  scenario,
  onChoose,
  onDismiss,
}: {
  scenario: AdaptScenario;
  onChoose: (o: AdaptOption) => void;
  onDismiss: () => void;
}) {
  const meta = ADAPT_LABELS[scenario.trigger];
  return (
    <div className="rm-rise mt-3 rounded-2xl border-[1.6px] border-blue/30 bg-blue-tint p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12.5px] font-black leading-snug text-blue">
          {meta.icon} {scenario.observation}
        </div>
        <button onClick={onDismiss} className="text-[13px] text-ink-mute">
          ✕
        </button>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
        {scenario.consequence}
      </p>
      <div className="mt-2.5 space-y-2">
        {scenario.options.map((o, i) => (
          <div key={o.id} className="rounded-xl bg-white p-2.5">
            <div className="text-[12.5px] font-black text-ink">
              方案 {String.fromCharCode(65 + i)}｜{o.label}
            </div>
            <div className="mt-0.5 text-[11.5px] leading-snug text-ink-mute">{o.detail}</div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-[11px] text-bad">△</span>
                {o.impact.travellerId === "all" ? (
                  <span className="grid size-[15px] shrink-0 place-items-center rounded-full bg-ink/15 text-[8px] font-black text-ink-soft">
                    全
                  </span>
                ) : (
                  <Avatar id={o.impact.travellerId} size={15} />
                )}
                <span className="truncate text-[11px] text-ink-mute">{o.impact.because}</span>
              </div>
              <button
                onClick={() => onChoose(o)}
                className="shrink-0 rounded-full bg-blue px-3 py-1.5 text-[11.5px] font-black text-white"
              >
                選這個
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview({
  trip,
  prefs,
  onPick,
}: {
  trip: Trip;
  prefs: Record<TravellerId, Preference>;
  onPick: (d: number) => void;
}) {
  return (
    <div className="space-y-2.5 py-3">
      {trip.days.map((d) => {
        const load = loadOfDay(d);
        const v = violationsOfDay(d, prefs);
        const stops = d.branches.reduce((a, b) => a + b.stops.length, 0);
        return (
          <button
            key={d.day}
            onClick={() => onPick(d.day)}
            className="w-full rounded-2xl border border-line bg-white p-3.5 text-left"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-serif text-[17px] text-ink">
                第 {d.day} 天 · {d.date}
              </span>
              <span className="num text-[11px] font-bold text-ink-mute">
                {d.departAt}–{load.endsAt}
              </span>
            </div>
            <div className="num mt-1 text-[11.5px] font-bold text-ink-mute">
              {stops} 站 · 步行 {dayWalkKm(d).toFixed(1)}km
              {d.rejoin && " · 分頭行動"}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {d.branches
                .filter((b) => b.id !== "d2-join")
                .flatMap((b) => b.stops)
                .slice(0, 5)
                .map((s) => (
                  <span
                    key={s.stopId}
                    className="rounded-md bg-cream px-1.5 py-0.5 text-[10.5px] font-bold text-ink-soft"
                  >
                    {SPOT_BY_ID[s.spotId]?.emoji} {SPOT_BY_ID[s.spotId]?.name}
                  </span>
                ))}
            </div>
            {v.length > 0 && (
              <div className="mt-2 text-[11px] font-bold text-bad">
                ⚠ {v.length} 項超過某人的限制
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
