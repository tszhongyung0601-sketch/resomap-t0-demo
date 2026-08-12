import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { ItineraryStop, PoolItem } from "../types";

function itemLabel(item: PoolItem): string {
  return item.kind === "attraction" ? item.name : item.title;
}

// Leaflet's default marker icons reference image files that don't resolve
// correctly through bundlers; rebuild them from the package's own assets.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const commerceIcon = L.divIcon({
  className: "",
  html: `<div style="background:#D9622B;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FitBounds({ stops }: { stops: ItineraryStop[] }) {
  const map = useMap();
  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(stops.map((s) => [s.item.lat, s.item.lng]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
  }, [stops, map]);
  return null;
}

export function ItineraryMap({ stops }: { stops: ItineraryStop[] }) {
  const positions = stops.map((s) => [s.item.lat, s.item.lng] as [number, number]);
  const center: [number, number] =
    positions[0] ?? [25.1093, 121.8447];

  return (
    <div className="h-[280px] w-full overflow-hidden rounded-md border border-line">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: "#D9622B", weight: 3, opacity: 0.7 }} />
        {stops.map((stop, i) => (
          <Marker
            key={stop.stopId}
            position={[stop.item.lat, stop.item.lng]}
            icon={stop.item.kind === "commerce" ? commerceIcon : defaultIcon}
          >
            <Popup>
              {i + 1}. {itemLabel(stop.item)}
              <br />
              {stop.arrivalTime}
            </Popup>
          </Marker>
        ))}
        <FitBounds stops={stops} />
      </MapContainer>
    </div>
  );
}
