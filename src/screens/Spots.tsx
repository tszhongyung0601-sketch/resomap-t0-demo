import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import { SPOTS, spot } from "../data/demo";
import { SPOT_KIND_LABELS, type Spot, type SpotKind } from "../types";
import { Chip, Thumb } from "../components/ui";

type Filter = "all" | SpotKind | "story";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "attraction", label: SPOT_KIND_LABELS.attraction },
  { id: "food", label: SPOT_KIND_LABELS.food },
  { id: "story", label: "故事" },
  { id: "nature", label: SPOT_KIND_LABELS.nature },
];

/**
 * Grid clustering, done here rather than pulled in as a dependency: at low zoom
 * a hundred overlapping pins is noise, and the only thing the traveller needs
 * to see is roughly where things are dense.
 */
function cluster(items: Spot[], zoom: number) {
  if (zoom >= 14) return items.map((s) => ({ items: [s], lat: s.lat, lng: s.lng }));
  const cell = zoom >= 12 ? 0.02 : zoom >= 10 ? 0.08 : 0.3;
  const buckets = new Map<string, Spot[]>();
  for (const s of items) {
    const k = `${Math.round(s.lat / cell)}:${Math.round(s.lng / cell)}`;
    buckets.set(k, [...(buckets.get(k) ?? []), s]);
  }
  return [...buckets.values()].map((group) => ({
    items: group,
    lat: group.reduce((a, s) => a + s.lat, 0) / group.length,
    lng: group.reduce((a, s) => a + s.lng, 0) / group.length,
  }));
}

function pin(label: string, count: number, active: boolean) {
  if (count > 1) {
    const size = count > 20 ? 46 : count > 8 ? 40 : 34;
    return divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:99px;background:#fff;
        border:2px solid #ff6210;color:#16150f;display:grid;place-items:center;
        font:700 ${size / 3}px/1 system-ui;box-shadow:0 2px 8px rgba(0,0,0,.16)">${count}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  return divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:99px;
      background:${active ? "#ff6210" : "#fff"};display:grid;place-items:center;font-size:16px;
      box-shadow:0 2px 8px rgba(0,0,0,.18)">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function ZoomWatch({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, Math.max(map.getZoom(), 15), { animate: true });
  }, [target, map]);
  return null;
}

export function Spots({ onSpot }: { onSpot: (id: string) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [zoom, setZoom] = useState(12);
  const [focus, setFocus] = useState<string | null>(null);
  const [fly, setFly] = useState<[number, number] | null>(null);

  const items = useMemo(
    () =>
      SPOTS.filter((s) => s.kind !== "transit").filter((s) =>
        filter === "all" ? true : filter === "story" ? Boolean(s.story) : s.kind === filter,
      ),
    [filter],
  );
  const groups = useMemo(() => cluster(items, zoom), [items, zoom]);
  const nearby = items.slice(0, 5);

  return (
    <div className="relative h-full">
      <MapContainer
        center={[35.69, 139.76]}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        /* isolate + z-0: Leaflet's own panes sit at z-index 400-700. Without a
           stacking context of its own the map paints straight over the search
           bar and the sheet, which are only z-20. */
        style={{ isolation: "isolate" }}
        className="absolute inset-0 z-0 size-full"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={18} />
        <ZoomWatch onZoom={setZoom} />
        <FlyTo target={fly} />
        {groups.map((g, i) => (
          <Marker
            key={i}
            position={[g.lat, g.lng]}
            icon={pin(
              g.items[0].emoji,
              g.items.length,
              g.items.length === 1 && g.items[0].id === focus,
            )}
            eventHandlers={{
              click: () => {
                if (g.items.length === 1) {
                  setFocus(g.items[0].id);
                  setFly([g.items[0].lat, g.items[0].lng]);
                } else {
                  setFly([g.lat, g.lng]);
                  setZoom((z) => Math.min(15, z + 2));
                }
              },
            }}
          />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-bg px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,.1)]">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#918c83" strokeWidth="2">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] text-ink-3">搜尋景點</span>
        </div>
        <div className="pointer-events-auto mt-2.5 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* pb clears the tab bar exactly — any more reads as a dead white band. */}
      <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl bg-bg pb-[76px] pt-2.5">
        <div className="mx-auto h-1 w-9 rounded-full bg-line" />
        <div className="mt-2.5 px-5 text-[15px] font-bold text-ink">附近推薦</div>
        <div className="mt-1 max-h-[248px] overflow-y-auto px-5 no-scrollbar">
          {nearby.map((s) => (
            <button
              key={s.id}
              onClick={() => onSpot(s.id)}
              className="flex w-full items-center gap-3 border-b border-line py-2.5 text-left last:border-0"
            >
              <Thumb emoji={s.emoji} tint={s.tint} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-ink">{s.name}</div>
                <div className="text-[12px] text-ink-3">
                  {s.area}
                  {s.story && " · 🎧"}
                </div>
              </div>
              <span className="text-ink-3">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SPOT_LOOKUP = spot;
