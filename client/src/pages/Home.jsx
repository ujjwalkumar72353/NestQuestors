import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { BadgeCheck, BedDouble, Building2, DoorOpen, Map, MessageCircle, Sparkles, Users } from "lucide-react";
import { ListingGrid } from "../components/ListingCard";
import SmartSearch from "../components/SmartSearch";
import { api } from "../lib/api";

const CITIES = ["Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi", "Gurugram", "Noida", "Chennai"];
const EXAMPLES = [
  "2BHK furnished in Hyderabad under 40k",
  "1BHK for bachelors in Pune",
  "Parking near Koramangala in Bengaluru",
];
const HERO =
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1800&q=70";

const STAY_TYPES = [
  { icon: Building2, label: "Full homes", to: "/search?occupancy=full" },
  { icon: DoorOpen, label: "Private rooms", to: "/search?occupancy=private" },
  { icon: Users, label: "Flatmates", to: "/search?occupancy=shared" },
  { icon: BedDouble, label: "PG stays", to: "/search?occupancy=pg" },
];

const VALUES = [
  { icon: Sparkles, title: "Search in plain words", text: "Say what you need, and we turn it into filters." },
  { icon: BadgeCheck, title: "Fair rent check", text: "See how each rent compares with similar homes." },
  { icon: Map, title: "Search on the map", text: "Explore homes area by area, near your office." },
  { icon: MessageCircle, title: "Talk to owners", text: "Message owners directly from any listing." },
];

function Home() {
  const [recommended, setRecommended] = useState({ listings: [], personalized: false });
  const [latest, setLatest] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { current, ready } = useSelector((state) => state.user);

  useEffect(() => {
    if (!ready) return;
    Promise.all([
      api("/listing/recommended"),
      api("/listing/get?bachelorFriendly=true&limit=8"),
    ])
      .then(([picks, rentals]) => {
        setRecommended(picks);
        setLatest(rentals.listings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    if (current) {
      api("/user/recent").then(setRecent).catch(() => setRecent([]));
    } else {
      setRecent([]);
    }
  }, [ready, current?._id]);

  return (
    <div>
      <section className="relative isolate">
        <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover -z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/50 to-black/70 -z-10" />
        <div className="max-w-3xl mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            Find a home that says yes to bachelors
          </h1>
          <p className="text-white/90 md:text-lg mt-4 max-w-xl mx-auto">
            Tell us what you're looking for, the way you'd tell a friend.
          </p>
          <div className="mt-8 text-left text-ink">
            <SmartSearch large />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((example) => (
              <Link
                key={example}
                to={`/search?q=${encodeURIComponent(example)}`}
                className="text-sm rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 backdrop-blur transition-colors"
              >
                {example}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <section aria-label="Cities" className="flex gap-2 overflow-x-auto py-6">
          {CITIES.map((city) => (
            <Link
              key={city}
              to={`/search?city=${city}`}
              className="shrink-0 px-4 py-2 rounded-full border border-line bg-surface text-sm font-medium hover:border-brand hover:text-brand transition-colors"
            >
              {city}
            </Link>
          ))}
        </section>

        <section aria-label="Stay types" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAY_TYPES.map(({ icon: Icon, label, to }) => (
            <Link key={label} to={to} className="card p-4 flex items-center gap-3 hover:border-brand transition-colors">
              <span className="h-10 w-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="font-semibold">{label}</span>
            </Link>
          ))}
        </section>

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold tracking-tight mb-5">Recently viewed</h2>
            <ListingGrid listings={recent.slice(0, 4)} />
          </section>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight">
            {recommended.personalized ? "Recommended for you" : "Great deals right now"}
          </h2>
          <p className="text-muted mb-5">
            {recommended.personalized
              ? "Based on the homes you saved and viewed."
              : "Save a few homes to get personal recommendations."}
          </p>
          <ListingGrid listings={recommended.listings} loading={loading} />
        </section>

        <section className="mt-14">
          <div className="flex justify-between items-end gap-3 mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Bachelor friendly rentals</h2>
            <Link to="/search?bachelorFriendly=true" className="text-brand font-medium shrink-0">
              View all
            </Link>
          </div>
          <ListingGrid listings={latest} loading={loading} />
        </section>

        <section className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <span className="h-10 w-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                <Icon size={19} aria-hidden="true" />
              </span>
              <h3 className="font-semibold mt-3">{title}</h3>
              <p className="text-sm text-muted mt-1">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default Home;
