import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon, type LatLngBoundsExpression } from "leaflet";
import { bounds, cluster } from "../lib/geo";
import type { Poi } from "../types";

/**
 * The one map in the app.
 *
 * Search results, a destination, the spots tab and a trip's route all render
 * through here — they differ only in what they pass in. Keeping a single
 * component means clustering, fitting and the sponsored-pin rule are decided
 * once instead of drifting apart across four screens.
 *
 * The Leaflet container carries `isolation: isolate` and `z-0` deliberately:
 * Leaflet's internal panes sit at z-index 400-700, so without a stacking
 * context of its own the map paints straight over any UI layered on top of it.
 */

export interface MapPin {
  poi: Poi;
  /** 1-based position in an itinerary. Renders a numbered pin instead of an emoji. */
  order?: number;
  /** Paid placement. Rendered with a visible ring and a label in the sheet. */
  sponsored?: boolean;
}

function pinIcon(pins: MapPin[], activeId: string | null) {
  if (pins.length > 1) {
    const n = pins.length;
    const size = n > 20 ? 46 : n > 8 ? 40 : 34;
    return divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;border-radius:99px;background:#fff;
        border:2px solid #ff6210;color:#16150f;display:grid;place-items:center;
        font:700 ${Math.round(size / 3)}px/1 system-ui;
        box-shadow:0 2px 8px rgba(0,0,0,.16)">${n}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  const p = pins[0];
  const on = p.poi.id === activeId;

  if (p.order != null) {
    return divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:99px;
        background:${on ? "#e2540a" : "#ff6210"};color:#fff;display:grid;place-items:center;
        font:700 14px/1 system-ui;border:2.5px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,.28)">${p.order}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  /* Sponsored pins get a dashed ring, never a brighter colour — a paid result
     must be identifiable, not more attractive. */
  const ring = p.sponsored
    ? "border:2px dashed #918c83;"
    : on
      ? "border:2px solid #ff6210;"
      : "";
  return divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:99px;${ring}
      background:${on ? "#ff6210" : "#fff"};display:grid;place-items:center;font-size:16px;
      box-shadow:0 2px 8px rgba(0,0,0,.18)">${p.poi.emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function Watch({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

function Fit({ to, focus }: { to: LatLngBoundsExpression | null; focus: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.setView(focus, Math.max(map.getZoom(), 15), { animate: true });
  }, [focus, map]);
  useEffect(() => {
    if (to && !focus) map.fitBounds(to, { padding: [40, 40], animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);
  return null;
}

export function MapView({
  pins,
  centre,
  zoom = 13,
  fit,
  route,
  activeId,
  showMe,
  onPick,
}: {
  pins: MapPin[];
  centre: [number, number];
  zoom?: number;
  /** Frame all pins on mount. Off for the browse map, on for a trip's route. */
  fit?: boolean;
  /** Draw the itinerary line through the pins, in order. */
  route?: boolean;
  activeId?: string | null;
  /** A stand-in "you are here" dot. Mock: nothing asks for real geolocation. */
  showMe?: [number, number];
  onPick?: (poi: Poi) => void;
}) {
  const [z, setZ] = useState(zoom);
  const [focus, setFocus] = useState<[number, number] | null>(null);

  const groups = useMemo(
    () =>
      cluster(
        pins.map((p) => ({ ...p, lat: p.poi.lat, lng: p.poi.lng })),
        route ? 99 : z, // an itinerary is never clustered: the order is the point
      ),
    [pins, z, route],
  );

  const box = useMemo(
    () => (fit && pins.length ? bounds(pins.map((p) => p.poi)) : null),
    [fit, pins],
  );

  const line = useMemo(
    () =>
      route
        ? [...pins]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((p) => [p.poi.lat, p.poi.lng] as [number, number])
        : [],
    [route, pins],
  );

  return (
    <MapContainer
      center={centre}
      zoom={zoom}
      zoomControl={false}
      attributionControl={false}
      style={{ isolation: "isolate" }}
      className="absolute inset-0 z-0 size-full"
    >
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={18} />
      <Watch onZoom={setZ} />
      <Fit to={box} focus={focus} />

      {line.length > 1 && (
        <Polyline
          positions={line}
          pathOptions={{ color: "#ff6210", weight: 3.5, opacity: 0.75, dashArray: "1 7", lineCap: "round" }}
        />
      )}

      {showMe && (
        <Marker
          position={showMe}
          interactive={false}
          icon={divIcon({
            className: "",
            html: `<div style="width:18px;height:18px;border-radius:99px;background:#2F6FED;
              border:3px solid #fff;box-shadow:0 0 0 6px rgba(47,111,237,.18)"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
        />
      )}

      {groups.map((g, i) => (
        <Marker
          key={g.items[0].poi.id + i}
          position={[g.lat, g.lng]}
          icon={pinIcon(g.items, activeId ?? null)}
          eventHandlers={{
            click: () => {
              if (g.items.length === 1) {
                setFocus([g.lat, g.lng]);
                onPick?.(g.items[0].poi);
              } else {
                setFocus([g.lat, g.lng]);
                setZ((v) => Math.min(16, v + 2));
              }
            },
          }}
        />
      ))}
    </MapContainer>
  );
}

/** ©️ OpenStreetMap. Required by the tile licence, so it is not optional. */
export function MapCredit() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-10 bg-bg/70 px-1.5 py-0.5 text-[10px] text-ink-3">
      ©️ OpenStreetMap contributors
    </div>
  );
}
