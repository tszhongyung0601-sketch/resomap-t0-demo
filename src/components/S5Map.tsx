import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import { divIcon } from "leaflet";
import { useEffect, useState } from "react";
import { TRAVELLER_BY_ID } from "../data/people";
import { SPOT_BY_ID } from "../data/spots";
import type { DayPlan, Trip, TravellerId } from "../types";
import { StatusBar } from "./S0Start";
import { Avatar } from "./bits";

/** One colour per branch: on the split day two differently-coloured lines leave
 *  the hotel and meet again, which reads instantly on a projector. */
function branchColor(travellers: TravellerId[]): string {
  return TRAVELLER_BY_ID[travellers[0]].color;
}

function pinIcon(label: string, color: string, mon: boolean) {
  return divIcon({
    className: "",
    html: `<div style="position:relative">
      <div style="width:24px;height:24px;border-radius:99px;background:#fff;border:2.5px solid ${color};
        display:grid;place-items:center;font:900 10px/1 system-ui;color:${color};
        box-shadow:0 2px 6px rgba(28,13,10,.3)">${label}</div>
      ${
        mon
          ? `<div style="position:absolute;top:-6px;right:-8px;width:15px;height:15px;border-radius:99px;
             background:#FF6210;color:#fff;font:900 9px/15px system-ui;text-align:center">$</div>`
          : ""
      }
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitBounds({ day }: { day: DayPlan }) {
  const map = useMap();
  useEffect(() => {
    const hotel = SPOT_BY_ID["hotel"];
    const pts = [
      ...(hotel ? [[hotel.lat, hotel.lng] as [number, number]] : []),
      ...day.branches
        .flatMap((b) => b.stops)
        .map((s) => SPOT_BY_ID[s.spotId])
        .filter(Boolean)
        .map((s) => [s.lat, s.lng] as [number, number]),
    ];
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40] });
    else if (pts.length === 1) map.setView(pts[0], 14);
  }, [day, map]);
  return null;
}

export function S5Map({
  trip,
  activeDay,
  setActiveDay,
  onClose,
  onOpenVoice,
}: {
  trip: Trip;
  activeDay: number;
  setActiveDay: (d: number) => void;
  onClose: () => void;
  onOpenVoice: (spotId: string) => void;
}) {
  const day = trip.days.find((d) => d.day === activeDay) ?? trip.days[0];
  const [focus, setFocus] = useState<string | null>(null);
  const stops = day.branches.flatMap((b) =>
    b.stops.map((s) => ({ ...s, color: branchColor(b.travellers), branchId: b.id })),
  );

  return (
    <div className="relative flex h-full flex-col">
      <MapContainer
        center={[35.68, 139.76]}
        zoom={11}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0 h-full w-full"
      >
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={18} />
        <FitBounds day={day} />
        {day.branches.map((b) => {
          // Both branches start from the hotel, so a split day reads as two
          // lines diverging rather than one line and a lone pin.
          const origin = SPOT_BY_ID["hotel"];
          const pts = [
            ...(day.rejoin && origin ? [[origin.lat, origin.lng] as [number, number]] : []),
            ...b.stops
              .map((s) => SPOT_BY_ID[s.spotId])
              .filter(Boolean)
              .map((s) => [s.lat, s.lng] as [number, number]),
          ];
          if (pts.length < 2) return null;
          return (
            <Polyline
              key={b.id}
              positions={pts}
              pathOptions={{
                color: branchColor(b.travellers),
                weight: 4.5,
                opacity: 0.9,
                dashArray: b.id === "d2-join" ? "2 8" : undefined,
              }}
            />
          );
        })}
        {stops.map((s, i) => {
          const spot = SPOT_BY_ID[s.spotId];
          if (!spot) return null;
          return (
            <Marker
              key={s.stopId}
              position={[spot.lat, spot.lng]}
              icon={pinIcon(String(i + 1), s.color, Boolean(s.commerceIds?.length))}
              eventHandlers={{ click: () => setFocus(s.stopId) }}
            />
          );
        })}
      </MapContainer>

      <div className="pointer-events-none relative z-10 flex h-full flex-col">
        <StatusBar />
        <div className="pointer-events-auto flex items-center gap-2 px-4">
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-white text-[15px] font-bold shadow-[0_2px_10px_rgba(28,13,10,.2)]"
          >
            ✕
          </button>
          <div className="flex gap-1 rounded-full bg-white/95 p-1 shadow-[0_2px_10px_rgba(28,13,10,.15)]">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setActiveDay(d)}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
                  activeDay === d ? "bg-ink text-white" : "text-ink-mute"
                }`}
              >
                第 {d} 天
              </button>
            ))}
          </div>
          <span className="ml-auto rounded-full bg-white/90 px-2 py-1 text-[9px] font-bold text-ink-mute">
            © OpenStreetMap
          </span>
        </div>

        {day.rejoin && (
          <div className="pointer-events-auto mx-4 mt-2 rounded-xl bg-white/95 px-3 py-2 shadow-[0_2px_10px_rgba(28,13,10,.15)]">
            <div className="flex items-center gap-2 text-[11px] font-bold text-ink-soft">
              {day.branches
                .filter((b) => b.id !== "d2-join")
                .map((b) => (
                  <span key={b.id} className="flex items-center gap-1">
                    <span
                      className="h-1 w-4 rounded-full"
                      style={{ background: branchColor(b.travellers) }}
                    />
                    {b.travellers.map((t) => TRAVELLER_BY_ID[t].name).join("＋")}
                  </span>
                ))}
            </div>
          </div>
        )}

        <div className="pointer-events-auto mt-auto flex gap-2 overflow-x-auto px-4 pb-6 pt-3 no-scrollbar">
          {stops.map((s, i) => {
            const spot = SPOT_BY_ID[s.spotId];
            if (!spot) return null;
            return (
              <div
                key={s.stopId}
                className={`w-[210px] shrink-0 rounded-2xl bg-white p-3 shadow-[0_3px_14px_rgba(28,13,10,.18)] ${
                  focus === s.stopId ? "ring-2 ring-orange" : ""
                }`}
              >
                <div className="num flex items-center gap-1.5 text-[10.5px] font-bold text-ink-mute">
                  <span
                    className="grid size-4 place-items-center rounded-full text-[9px] font-black text-white"
                    style={{ background: s.color }}
                  >
                    {i + 1}
                  </span>
                  {s.arrive} · {s.stayMin} 分
                </div>
                <div className="mt-1 text-[14px] font-black leading-snug text-ink">
                  {spot.emoji} {spot.name}
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  {(s.forTravellers.length
                    ? s.forTravellers
                    : (["che", "yu", "kai", "ting"] as TravellerId[])
                  ).map((t) => (
                    <Avatar key={t} id={t} size={15} />
                  ))}
                </div>
                {spot.voice && (
                  <button
                    onClick={() => onOpenVoice(spot.id)}
                    className="mt-2 w-full rounded-full bg-ink py-1.5 text-[11.5px] font-bold text-white"
                  >
                    ▶ 語音導覽
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
