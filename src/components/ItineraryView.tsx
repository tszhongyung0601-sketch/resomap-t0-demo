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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Itinerary, PoolItem } from "../types";
import { ItineraryCard } from "./ItineraryCard";
import { ItineraryMap } from "./ItineraryMap";
import { AddStopModal } from "./AddStopModal";
import { allPoolItemsExcept, dayStartMinutes, recomputeDay } from "../lib/itineraryGenerator";

export function ItineraryView({
  itinerary,
  onRestart,
}: {
  itinerary: Itinerary;
  onRestart: () => void;
}) {
  const [days, setDays] = useState(itinerary.days);
  const [activeDay, setActiveDay] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const currentDay = days.find((d) => d.day === activeDay)!;

  const usedIds = useMemo(() => {
    const ids = new Set<string>();
    days.forEach((d) => d.stops.forEach((s) => ids.add(s.item.id)));
    return ids;
  }, [days]);

  const candidates = useMemo(() => allPoolItemsExcept(usedIds), [usedIds]);

  function updateDay(dayNumber: number, mutate: (stops: typeof currentDay.stops) => typeof currentDay.stops) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.day !== dayNumber) return d;
        const mutated = mutate(d.stops);
        return recomputeDay({ ...d, stops: mutated }, dayStartMinutes(dayNumber, itinerary.input));
      }),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateDay(activeDay, (stops) => {
      const oldIndex = stops.findIndex((s) => s.stopId === active.id);
      const newIndex = stops.findIndex((s) => s.stopId === over.id);
      return arrayMove(stops, oldIndex, newIndex);
    });
  }

  function handleDelete(stopId: string) {
    updateDay(activeDay, (stops) => stops.filter((s) => s.stopId !== stopId));
  }

  function handleAdd(item: PoolItem) {
    updateDay(activeDay, (stops) => [
      ...stops,
      { stopId: `${item.id}-add-${Date.now()}`, item, arrivalTime: "" },
    ]);
    setShowAddModal(false);
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-10 border-b border-line bg-cream-raise px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-orange-deep">
              ResoMap · 你的九份行程
            </div>
            <h1 className="text-lg font-extrabold text-ink">
              {itinerary.input.days} 天九份深度行程
            </h1>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-md border border-line-strong px-3 py-1.5 text-xs text-ink-soft"
          >
            重新規劃
          </button>
        </div>

        {days.length > 1 && (
          <div className="mx-auto mt-3 flex max-w-md gap-2">
            {days.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setActiveDay(d.day)}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold ${
                  activeDay === d.day
                    ? "bg-orange text-white"
                    : "bg-card text-ink-soft border border-line"
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="mx-auto max-w-md px-4 pt-4">
        <ItineraryMap stops={currentDay.stops} />

        <div className="mt-5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={currentDay.stops.map((s) => s.stopId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-3">
                {currentDay.stops.map((stop) => (
                  <ItineraryCard key={stop.stopId} stop={stop} onDelete={handleDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="mt-4 w-full rounded-md border border-dashed border-line-strong py-3 text-sm font-semibold text-ink-mute"
        >
          ＋ 新增景點／商家
        </button>

        <p className="mt-4 text-center text-[11px] text-ink-mute">
          行程時間為 AI 依你輸入條件推算的估計值，實際交通與排隊時間請自行斟酌調整。
        </p>
      </div>

      {showAddModal && (
        <AddStopModal
          candidates={candidates}
          onPick={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
