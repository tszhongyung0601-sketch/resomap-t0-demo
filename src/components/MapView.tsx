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
  /**
   * What the pin's colour means on this map, and it means exactly one thing:
   * orange has a voice guide, navy does not. Deliberately not the POI's
   * category — six pin colours look like information while answering no
   * question, and this one maps onto the section directly below the map on the
   * home screen. Undefined keeps the original white pin every other map uses.
   */
  tone?: "story" | "plain";
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
  /* A toned pin is filled rather than outlined, and drops the emoji: at 30px on
     a saturated fill an emoji is unreadable, and here the colour is the whole
     message. The headphones mark repeats it for anyone who cannot separate the
     two hues — colour is never the only carrier. */
  if (p.tone) {
    const fill = p.tone === "story" ? "#ff6210" : "#33415c";
    const mark = p.tone === "story" ? "🎧" : "";
    return divIcon({
      className: "",
      html: `<div style="width:30px;height:30px;border-radius:99px;background:${fill};
        border:2.5px solid #fff;display:grid;place-items:center;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,.28)">${mark}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }

  return divIcon({
    className: "",
    html: `<div style="width:34px;height:34px;border-radius:99px;${ring}
      background:${on ? "#ff6210" : "#fff"};display:grid;place-items:center;font-size:16px;
      box-shadow:0 2px 8px rgba(0,0,0,.18)">${p.poi.emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

/**
 * What the two pin colours mean, on the map itself.
 *
 * Two colours with no key is decoration pretending to be data. It sits inside
 * the map rather than under it because the reader is looking at the pins when
 * the question occurs to them.
 */
export function PinLegend() {
  return (
    <div className="pointer-events-none absolute right-2.5 top-2.5 z-10 flex flex-col gap-1 rounded-xl bg-bg/92 px-2.5 py-2 shadow-sm backdrop-blur">
      {[
        { fill: "#ff6210", label: "有語音故事" },
        { fill: "#33415c", label: "還沒有" },
      ].map((r) => (
        <span key={r.label} className="flex items-center gap-1.5 text-[11px] text-ink-2">
          <i
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: r.fill }}
            aria-hidden
          />
          {r.label}
        </span>
      ))}
    </div>
  );
}

function Watch({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
  return null;
}

/** Where the map has been told to go, and how close. */
interface Focus {
  at: [number, number];
  /** Omitted for "open this place" — that always goes in close. */
  zoom?: number;
}

function Fit({ to, focus }: { to: LatLngBoundsExpression | null; focus: Focus | null }) {
  const map = useMap();
  useEffect(() => {
    /* Two different intents used to share one code path, and the cluster one was
       wrong: tapping a bubble asked to SPREAD it, but fell into the "open this
       place" branch and jumped to zoom 15 on the cluster's centroid — which on
       the Taiwan overview is open sea or farmland between three cities, with not
       a single pin left on screen and no way back but pinching out. A spread
       carries its own target zoom; a pick does not and still goes in close. */
    if (focus) map.setView(focus.at, focus.zoom ?? Math.max(map.getZoom(), 15), { animate: true });
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
  spread,
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
  /**
   * Never group these pins, however far out the map is.
   *
   * For the city overview: `cluster()` buckets by a 0.8° grid cell at zoom 7,
   * which swallows 台北, 新北 and 宜蘭 into one bubble reading "3" — while the
   * pins themselves are 32px, 43px and 46px apart at that zoom and never touch.
   * The grid was hiding three of eight cities to solve an overlap that does not
   * exist, under a caption promising eight. Measured, not guessed: the closest
   * pair of the eight anchors is 32px and the pins are 30px across.
   */
  spread?: boolean;
  activeId?: string | null;
  /** A stand-in "you are here" dot. Mock: nothing asks for real geolocation. */
  showMe?: [number, number];
  onPick?: (poi: Poi) => void;
}) {
  const [z, setZ] = useState(zoom);
  const [focus, setFocus] = useState<Focus | null>(null);

  const groups = useMemo(
    () =>
      cluster(
        pins.map((p) => ({ ...p, lat: p.poi.lat, lng: p.poi.lng })),
        // an itinerary is never clustered (the order is the point), and neither is
        // a set of pins the caller has measured as non-overlapping
        route || spread ? 99 : z,
      ),
    [pins, z, route, spread],
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
                setFocus({ at: [g.lat, g.lng] });
                onPick?.(g.items[0].poi);
              } else {
                /* Two steps in, centred on the bubble. No setZ here: setView
                   fires zoomend, Watch picks it up, and `z` — which decides the
                   clustering granularity — stays a reading of the map rather
                   than a second copy that can disagree with it. */
                setFocus({ at: [g.lat, g.lng], zoom: Math.min(16, z + 2) });
              }
            },
          }}
        />
      ))}
    </MapContainer>
  );
}

/**
 * ©️ OpenStreetMap. Required by the tile licence, so it is not optional.
 *
 * 11px, the same floor every other label in the app keeps. An attribution the
 * licence obliges us to show is the last thing to shrink below legible — set at
 * 10px it was the only text in the product a reader could not actually read.
 */
export function MapCredit() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-10 bg-bg/70 px-1.5 py-0.5 text-[11px] text-ink-3">
      ©️ OpenStreetMap contributors
    </div>
  );
}
