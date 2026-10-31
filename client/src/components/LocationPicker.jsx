import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const CITY_CENTERS = {
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Delhi: [28.6139, 77.209],
  Gurugram: [28.4595, 77.0266],
  Hyderabad: [17.385, 78.4867],
  Mumbai: [19.076, 72.8777],
  Noida: [28.5355, 77.391],
  Pune: [18.5204, 73.8567],
};

const dot = L.divIcon({
  className: "",
  html: '<div class="price-pin">Home</div>',
  iconSize: [0, 0],
});

// With no `onChange` this is a read-only map of one home
function LocationPicker({ city, lat, lng, onChange, className = "h-72" }) {
  const element = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const place = (position) => {
    if (marker.current) marker.current.setLatLng(position);
    else marker.current = L.marker(position, { icon: dot }).addTo(map.current);
  };

  useEffect(() => {
    const start = lat !== null && lat !== undefined ? [lat, lng] : CITY_CENTERS[city] || [21.5, 78.5];
    map.current = L.map(element.current, { scrollWheelZoom: false }).setView(start, lat ? 14 : city ? 12 : 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map.current);
    if (lat !== null && lat !== undefined) place([lat, lng]);
    map.current.on("click", (event) => {
      if (!onChangeRef.current) return;
      place(event.latlng);
      onChangeRef.current(
        Number(event.latlng.lat.toFixed(5)),
        Number(event.latlng.lng.toFixed(5))
      );
    });
    return () => {
      map.current.remove();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (city && CITY_CENTERS[city] && (lat === null || lat === undefined)) {
      map.current?.setView(CITY_CENTERS[city], 12);
    }
  }, [city]);

  return (
    <div>
      <div
        ref={element}
        role="application"
        aria-label={onChange ? "Click to pin the home" : "Location of this home"}
        className={`w-full rounded-xl overflow-hidden border border-line z-0 ${onChange ? "cursor-crosshair" : ""} ${className}`}
      />
      {onChange && (
        <p className="text-sm text-muted mt-1.5">
          {lat === null ? "Click the map to place the pin." : `Pinned at ${lat}, ${lng}`}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
