import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../lib/format";

const INDIA = [21.5, 78.5];

const shortPrice = (value) =>
  value >= 1000 ? `₹${Math.round(value / 100) / 10}k` : formatPrice(value);

const pinIcon = (listing) =>
  L.divIcon({
    className: "",
    html: `<div class="price-pin">${shortPrice(listing.effectivePrice)}</div>`,
    iconSize: [0, 0],
  });

function MapView({ pins, onMove, className = "h-[70vh]" }) {
  const element = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const fitted = useRef(false);
  const onMoveRef = useRef(onMove);
  const navigate = useNavigate();
  onMoveRef.current = onMove;

  useEffect(() => {
    map.current = L.map(element.current, { scrollWheelZoom: true }).setView(INDIA, 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map.current);
    layer.current = L.markerClusterGroup({
      maxClusterRadius: 48,
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          className: "",
          html: `<div class="cluster-pin">${cluster.getChildCount()}</div>`,
          iconSize: [0, 0],
        }),
    }).addTo(map.current);
    map.current.on("moveend", () => {
      if (!fitted.current) return;
      const bounds = map.current.getBounds();
      onMoveRef.current?.({
        south: bounds.getSouth().toFixed(4),
        west: bounds.getWest().toFixed(4),
        north: bounds.getNorth().toFixed(4),
        east: bounds.getEast().toFixed(4),
      });
    });
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layer.current) return;
    layer.current.clearLayers();
    const points = [];
    pins.forEach((listing) => {
      const [lng, lat] = listing.location.coordinates;
      points.push([lat, lng]);
      const popup = document.createElement("button");
      popup.type = "button";
      popup.className = "text-left cursor-pointer w-44";
      popup.textContent = `${listing.name} · ${formatPrice(listing.effectivePrice)} a month`;
      popup.onclick = () => navigate(`/listing/${listing._id}`);
      L.marker([lat, lng], { icon: pinIcon(listing), title: listing.name })
        .bindPopup(popup)
        .addTo(layer.current);
    });
    if (points.length > 0 && !fitted.current) {
      map.current.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
      setTimeout(() => {
        fitted.current = true;
      }, 500);
    }
  }, [pins, navigate]);

  return (
    <div
      ref={element}
      role="application"
      aria-label="Map of rental homes"
      className={`w-full rounded-2xl overflow-hidden border border-line z-0 ${className}`}
    />
  );
}

export default MapView;
