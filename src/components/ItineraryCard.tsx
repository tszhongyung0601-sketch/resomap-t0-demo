import { useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CATEGORY_LABELS,
  COMMERCE_KIND_LABELS,
  type ItineraryStop,
} from "../types";
import { isSpeechSupported, speak, stopSpeaking } from "../lib/speech";

function AttractionCard({ stop }: { stop: ItineraryStop }) {
  const spot = stop.item;
  if (spot.kind !== "attraction") return null;
  const [playState, setPlayState] = useState<"idle" | "playing">("idle");
  const supported = isSpeechSupported();

  const togglePlay = () => {
    if (playState === "playing") {
      stopSpeaking();
      setPlayState("idle");
      return;
    }
    if (!spot.voiceGuide) return;
    speak(spot.voiceGuide.script, {
      onStart: () => setPlayState("playing"),
      onEnd: () => setPlayState("idle"),
    });
  };

  return (
    <div className="flex-1 rounded-md border border-line bg-card p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs text-ink-mute">{stop.arrivalTime}</span>
        <span className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10px] uppercase text-ink-mute">
          {CATEGORY_LABELS[spot.category]}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-md bg-cream-raise text-xl">
          {spot.thumbnailEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-ink">{spot.name}</h3>
          <p className="mt-0.5 text-xs text-ink-mute">建議停留 {spot.stayMinutes} 分鐘</p>
        </div>
      </div>
      {spot.voiceGuide && (
        <button
          type="button"
          disabled={!supported}
          onClick={togglePlay}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-orange bg-orange-tint py-2 text-xs font-semibold text-orange-deep disabled:opacity-40"
        >
          {playState === "playing" ? (
            <>⏸ 播放中... 點擊停止</>
          ) : (
            <>▶ 播放語音導覽（{spot.voiceGuide.durationLabel}）</>
          )}
        </button>
      )}
      {!spot.voiceGuide && (
        <p className="mt-3 text-[11px] text-ink-mute">此站尚無 AI 語音導覽</p>
      )}
    </div>
  );
}

function CommerceCard({ stop }: { stop: ItineraryStop }) {
  const item = stop.item;
  if (item.kind !== "commerce") return null;
  return (
    <div className="flex-1 rounded-md border-2 border-orange bg-orange-tint p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-xs text-orange-deep">{stop.arrivalTime}</span>
        <span className="rounded-full border border-orange bg-white px-2 py-0.5 font-mono text-[10px] text-orange-deep">
          ResoMap 合作連結
        </span>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded border border-orange-deep/30 bg-white px-1.5 py-0.5 font-mono text-[10px] uppercase text-orange-deep">
          {COMMERCE_KIND_LABELS[item.commerceKind]}
        </span>
        <span className="text-[11px] text-ink-mute">{item.provider}</span>
      </div>
      <h3 className="text-[15px] font-bold text-ink">{item.title}</h3>
      <p className="mt-1 text-xs text-ink-soft">{item.description}</p>
      <div className="mt-2 flex items-baseline gap-2">
        {item.originalPrice && item.originalPrice > item.price && (
          <span className="text-xs text-ink-mute line-through">
            NT${item.originalPrice}
          </span>
        )}
        <span className="text-base font-bold text-orange-deep">NT${item.price}</span>
      </div>
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block w-full rounded-md bg-orange py-2 text-center text-xs font-bold text-white"
      >
        {item.commerceKind === "merchant" ? "查看優惠" : "立即購買"}
      </a>
      {item.isFallbackLink && (
        <p className="mt-1.5 text-[10px] text-ink-mute">
          Demo：目前導向 {item.provider} 九份總覽頁，實際上線後將導向真實優惠頁
        </p>
      )}
    </div>
  );
}

export function ItineraryCard({
  stop,
  onDelete,
}: {
  stop: ItineraryStop;
  onDelete: (stopId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.stopId });
  const dragHandleRef = useRef<HTMLButtonElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-2">
      <button
        ref={dragHandleRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex w-6 flex-none cursor-grab touch-none items-center justify-center text-ink-mute active:cursor-grabbing"
        aria-label="拖拉調整順序"
      >
        ⠿
      </button>
      {stop.item.kind === "attraction" ? (
        <AttractionCard stop={stop} />
      ) : (
        <CommerceCard stop={stop} />
      )}
      <button
        type="button"
        onClick={() => onDelete(stop.stopId)}
        className="flex w-6 flex-none items-center justify-center text-ink-mute hover:text-bad"
        aria-label="刪除這一站"
      >
        ✕
      </button>
    </div>
  );
}
