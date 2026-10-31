import { BellPlus, List, LocateFixed, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ListingGrid } from "../components/ListingCard";
import SmartSearch from "../components/SmartSearch";
import { api, post } from "../lib/api";
import { describeFilter, OCCUPANCY_LABELS } from "../lib/format";

const MapView = lazy(() => import("../components/MapView"));
const BOUNDS = ["south", "west", "north", "east"];
const NEAR_ME_RADIUS_KM = "5";

const CITIES = ["Bengaluru", "Chennai", "Delhi", "Gurugram", "Hyderabad", "Mumbai", "Noida", "Pune"];
const TOGGLES = [
  ["bachelorFriendly", "Bachelor friendly"],
  ["furnished", "Furnished"],
  ["parking", "Parking"],
  ["gatedSociety", "Gated society"],
  ["petsAllowed", "Pets allowed"],
  ["brokerageFree", "No brokerage"],
  ["offer", "On offer"],
];

function Filters({ params, update }) {
  return (
    <div className="flex flex-col gap-4">
      <label className="block">
        <span className="text-sm font-medium">City</span>
        <select className="input mt-1" value={params.get("city") || ""} onChange={(e) => update({ city: e.target.value })}>
          <option value="">Any city</option>
          {CITIES.map((city) => <option key={city}>{city}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Rental type</span>
        <select className="input mt-1" value={params.get("occupancy") || ""} onChange={(e) => update({ occupancy: e.target.value })}>
          <option value="">Any type</option>
          {Object.entries(OCCUPANCY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Bedrooms</span>
        <select className="input mt-1" value={params.get("bedrooms") || ""} onChange={(e) => update({ bedrooms: e.target.value })}>
          <option value="">Any</option>
          {[1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} BHK</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">Min rent</span>
          <input className="input mt-1" type="number" min={0} defaultValue={params.get("minPrice") || ""} key={`min${params.get("minPrice")}`} onBlur={(e) => update({ minPrice: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Max rent</span>
          <input className="input mt-1" type="number" min={0} defaultValue={params.get("maxPrice") || ""} key={`max${params.get("maxPrice")}`} onBlur={(e) => update({ maxPrice: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-col gap-2.5">
        {TOGGLES.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand)]"
              checked={params.get(key) === "true"}
              onChange={(e) => update({ [key]: e.target.checked ? "true" : "" })}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

function Search() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pins, setPins] = useState(null);
  const user = useSelector((state) => state.user.current);
  const navigate = useNavigate();
  const view = params.get("view") === "map" ? "map" : "list";
  const query = params.toString();
  const moveTimer = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(`/listing/get?${query}`)
      .then((result) => active && setData(result))
      .catch((failure) => active && setError(failure.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [query]);

  useEffect(() => {
    if (view !== "map") return undefined;
    let active = true;
    const next = new URLSearchParams(params);
    next.delete("view");
    api(`/listing/map?${next}`)
      .then((result) => active && setPins(result))
      .catch(() => active && setPins({ pins: [], total: 0 }));
    return () => {
      active = false;
    };
  }, [query, view]);

  const saveAlert = async () => {
    if (!user) {
      toast("Sign in to save this search");
      navigate("/sign-in");
      return;
    }
    const criteria = new URLSearchParams(params);
    ["view", "page", "sort", ...BOUNDS].forEach((key) => criteria.delete(key));
    const label =
      params.get("q") ||
      [...criteria.values()].slice(0, 3).join(", ") ||
      "All rentals";
    try {
      await post("/alert", { label: label.slice(0, 80), query: criteria.toString() });
      toast.success("We'll notify you about new matches");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const nearMe = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser can't share location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        update({
          lat: coords.latitude.toFixed(4),
          lng: coords.longitude.toFixed(4),
          radiusKm: NEAR_ME_RADIUS_KM,
        }),
      () => toast.error("Allow location access to search near you")
    );
  };

  const onMapMove = (bounds) => {
    clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => update(bounds), 400);
  };

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: "", ...changes }).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key)
    );
    setParams(next);
  };

  const page = data?.page || 1;
  const understood = Object.entries(data?.understood || {});

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <SmartSearch
        key={params.get("q") || ""}
        initial={params.get("q") || ""}
        onSearch={(q) => update({ q })}
      />

      {understood.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3" aria-label="What we understood">
          <span className="text-sm text-muted">We understood:</span>
          {understood.map(([key, value]) => (
            <span key={key} className="text-sm rounded-full bg-brand-soft text-brand px-3 py-1 font-medium">
              {describeFilter(key, value)}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <div role="group" aria-label="View" className="inline-flex rounded-xl border border-line bg-surface p-1">
          <button type="button" aria-pressed={view === "list"} className={`px-3 h-9 rounded-lg flex items-center gap-1.5 text-sm font-medium cursor-pointer ${view === "list" ? "bg-brand text-on-brand" : ""}`} onClick={() => update({ view: "", ...Object.fromEntries(BOUNDS.map((key) => [key, ""])) })}>
            <List size={16} aria-hidden="true" /> List
          </button>
          <button type="button" aria-pressed={view === "map"} className={`px-3 h-9 rounded-lg flex items-center gap-1.5 text-sm font-medium cursor-pointer ${view === "map" ? "bg-brand text-on-brand" : ""}`} onClick={() => update({ view: "map" })}>
            <MapIcon size={16} aria-hidden="true" /> Map
          </button>
        </div>
        <button type="button" className="btn-ghost h-11" onClick={nearMe}>
          <LocateFixed size={16} aria-hidden="true" /> Near me
        </button>
        <button type="button" className="btn-ghost h-11" onClick={saveAlert}>
          <BellPlus size={16} aria-hidden="true" /> Save search
        </button>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8 mt-6">
        <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
          <Filters params={params} update={update} />
          {query && (
            <button type="button" className="btn-ghost w-full mt-4" onClick={() => setParams({})}>
              Clear all
            </button>
          )}
        </aside>

        <div className="min-w-0">
          <div className="flex justify-between items-center gap-3 mb-5">
            <p className="font-semibold" role="status">
              {loading ? "Searching" : `${(data?.total ?? 0).toLocaleString("en-IN")} rentals found`}
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost lg:hidden" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal size={17} aria-hidden="true" /> Filters
              </button>
              <select aria-label="Sort by" className="input w-40" value={params.get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}>
                <option value="newest">Newest</option>
                <option value="price_asc">Rent: low to high</option>
                <option value="price_desc">Rent: high to low</option>
                <option value="bedrooms">Most bedrooms</option>
                <option value="area">Largest area</option>
              </select>
            </div>
          </div>

          {view === "map" ? (
            <Suspense fallback={<div className="h-[70vh] rounded-2xl bg-raised" />}>
              <p className="text-sm text-muted mb-2">
                {pins ? `Showing ${pins.pins.length} of ${pins.total} on the map. Move the map to search that area.` : "Loading map"}
              </p>
              <MapView pins={pins?.pins || []} onMove={onMapMove} />
            </Suspense>
          ) : error ? (
            <p className="card p-8 text-center text-muted">{error}</p>
          ) : !loading && data?.listings.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="font-semibold">No homes match this search</p>
              <p className="text-sm text-muted mt-1 mb-4">Try a higher budget or fewer filters.</p>
              <button type="button" className="btn-primary" onClick={() => setParams({})}>
                Clear search
              </button>
            </div>
          ) : (
            <ListingGrid listings={data?.listings || []} loading={loading} skeletons={6} />
          )}

          {view === "list" && !loading && data?.pages > 1 && (
            <nav aria-label="Pagination" className="flex justify-center items-center gap-3 mt-10">
              <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => { update({ page: String(page - 1) }); window.scrollTo(0, 0); }}>
                Previous
              </button>
              <span className="text-sm text-muted">Page {page} of {data.pages}</span>
              <button type="button" className="btn-ghost" disabled={page >= data.pages} onClick={() => { update({ page: String(page + 1) }); window.scrollTo(0, 0); }}>
                Next
              </button>
            </nav>
          )}
        </div>
      </div>

      {showFilters && (
        <div role="dialog" aria-modal="true" aria-label="Filters" className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowFilters(false)}>
          <div className="bg-canvas w-full max-h-[85vh] overflow-y-auto rounded-t-2xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button type="button" aria-label="Close filters" className="h-10 w-10 flex items-center justify-center cursor-pointer" onClick={() => setShowFilters(false)}>
                <X size={20} />
              </button>
            </div>
            <Filters params={params} update={update} />
            <button type="button" className="btn-primary w-full mt-5" onClick={() => setShowFilters(false)}>
              Show homes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;
