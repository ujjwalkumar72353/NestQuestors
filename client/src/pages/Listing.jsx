import { Bath, BedDouble, Building2, CalendarDays, Car, Check, Compass, Copy, Eye, Landmark, MapPin, Maximize2, ShieldCheck, Sofa, Users } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Link, useLocation, useParams } from "react-router-dom";
import CompareButton from "../components/CompareButton";
import { ListingGrid } from "../components/ListingCard";
import Photo from "../components/Photo";
import SaveButton from "../components/SaveButton";
import { api, post } from "../lib/api";
import { formatDate, formatPrice, OCCUPANCY_LABELS, SLOT_LABELS } from "../lib/format";

const LocationPicker = lazy(() => import("../components/LocationPicker"));

const toInputDate = (date) => date.toISOString().slice(0, 10);

function ScheduleVisit({ listing }) {
  const user = useSelector((state) => state.user.current);
  const location = useLocation();
  const tomorrow = toInputDate(new Date(Date.now() + 86400000));
  const [date, setDate] = useState(tomorrow);
  const [slot, setSlot] = useState("morning");
  const [booked, setBooked] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <Link to="/sign-in" state={{ from: location.pathname }} className="btn-ghost w-full">
        Sign in to book a visit
      </Link>
    );
  }
  if (user._id === listing.userRef) return null;
  if (booked) {
    return (
      <p className="flex items-center gap-2 text-brand font-medium">
        <Check size={18} aria-hidden="true" /> Visit requested
      </p>
    );
  }

  const book = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await post("/visit", { listing: listing._id, date, slot });
      setBooked(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={book} className="flex flex-col gap-3">
      <h2 className="font-semibold">Book a visit</h2>
      <label className="block">
        <span className="text-sm font-medium">Visit date</span>
        <input className="input mt-1" type="date" min={tomorrow} required value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Time</span>
        <select className="input mt-1" value={slot} onChange={(event) => setSlot(event.target.value)}>
          {Object.entries(SLOT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-ghost" disabled={busy}>
        {busy ? "Booking" : "Request visit"}
      </button>
    </form>
  );
}

function MoveInCost({ listing }) {
  const rent = listing.effectivePrice ?? listing.regularPrice;
  const rows = [
    ["First month rent", rent],
    ["Security deposit", listing.deposit],
    ["Maintenance", listing.maintenance],
  ];
  return (
    <section className="card p-5 mt-7">
      <h2 className="text-lg font-semibold">Move-in cost</h2>
      <dl className="mt-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5">
            <dt className="text-muted">{label}</dt>
            <dd>{formatPrice(value)}</dd>
          </div>
        ))}
        <div className="flex justify-between py-2 mt-1 border-t border-line font-semibold">
          <dt>Total to move in</dt>
          <dd>{formatPrice(rent + listing.deposit + listing.maintenance)}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted mt-1">
        Then {formatPrice(rent + listing.maintenance)} every month, including maintenance.
      </p>
    </section>
  );
}

const FAIRNESS_STYLES = {
  "Great value": "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  "Fair rent": "bg-brand-soft text-brand",
  "Above average": "bg-amber-500/15 text-amber-800 dark:text-amber-300",
};

function FairRent({ fairness }) {
  if (!fairness) return null;
  const { label, difference, average, sample } = fairness;
  return (
    <div className="mt-3">
      <span className={`text-sm font-semibold rounded-full px-3 py-1 ${FAIRNESS_STYLES[label]}`}>{label}</span>
      <p className="text-sm text-muted mt-2">
        {difference === 0 ? "Matches" : `${Math.abs(difference)}% ${difference < 0 ? "below" : "above"}`} the {formatPrice(average)} average of {sample} similar rentals in this city.
      </p>
    </div>
  );
}

function ContactOwner({ listing }) {
  const user = useSelector((state) => state.user.current);
  const location = useLocation();
  const [message, setMessage] = useState(
    `Hi, I'm interested in ${listing.name}. Is it available?`
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) {
    return (
      <Link to="/sign-in" state={{ from: location.pathname }} className="btn-primary w-full">
        Sign in to contact owner
      </Link>
    );
  }
  if (user._id === listing.userRef) {
    return (
      <Link to={`/edit-listing/${listing._id}`} className="btn-ghost w-full">
        Edit your listing
      </Link>
    );
  }
  if (sent) {
    return (
      <p className="flex items-center gap-2 text-brand font-medium">
        <Check size={18} aria-hidden="true" /> Message sent to the owner
      </p>
    );
  }

  const send = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      await post("/inquiry", { listing: listing._id, message });
      setSent(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={send}>
      <label className="block">
        <span className="text-sm font-medium">Message</span>
        <textarea className="input h-28 py-2 mt-1" required minLength={5} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} />
      </label>
      <button type="submit" className="btn-primary w-full mt-3" disabled={sending}>
        {sending ? "Sending" : "Contact owner"}
      </button>
    </form>
  );
}

function Listing() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(0);

  useEffect(() => {
    setListing(null);
    setError("");
    setPhoto(0);
    api(`/listing/get/${id}`).then(setListing).catch((failure) => setError(failure.message));
    api(`/listing/similar/${id}`).then(setSimilar).catch(() => setSimilar([]));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">{error}</h1>
        <Link to="/search" className="btn-primary mt-5">Browse homes</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 animate-pulse" aria-hidden="true">
        <div className="rounded-2xl bg-raised aspect-[16/8]" />
        <div className="h-8 bg-raised rounded mt-6 w-1/2" />
        <div className="h-5 bg-raised rounded mt-3 w-1/3" />
      </div>
    );
  }

  const facts = [
    { icon: Users, label: "Type", value: OCCUPANCY_LABELS[listing.occupancy] },
    { icon: BedDouble, label: "Bedrooms", value: listing.bedrooms },
    { icon: Bath, label: "Bathrooms", value: listing.bathrooms },
    { icon: Maximize2, label: "Carpet area", value: listing.carpetArea ? `${listing.carpetArea} sq ft` : "Not listed" },
    { icon: Building2, label: "Floor", value: listing.totalFloors ? `${listing.floor} of ${listing.totalFloors}` : "Not listed" },
    { icon: Compass, label: "Facing", value: listing.facing || "Not listed" },
    { icon: Sofa, label: "Furnishing", value: listing.furnished ? "Furnished" : "Unfurnished" },
    { icon: Car, label: "Parking", value: listing.parking ? "Available" : "None" },
    { icon: CalendarDays, label: "Available from", value: listing.availableFrom ? formatDate(listing.availableFrom) : "Now" },
    { icon: Landmark, label: "Minimum lease", value: `${listing.leaseMonths} months` },
  ];
  const rules = [
    [listing.bachelorFriendly, "Bachelors welcome"],
    [listing.brokerageFree, "No brokerage"],
    [listing.gatedSociety, "Gated society"],
    [listing.petsAllowed, "Pets allowed"],
    [listing.foodPreference === "any", "Non-veg allowed"],
  ];
  const [lng, lat] = listing.location?.coordinates || [];

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="relative">
        <Photo src={listing.imageUrls[photo]} alt={listing.name} className="w-full aspect-[4/3] md:aspect-[16/8] rounded-2xl" />
        <div className="absolute top-4 right-4 flex gap-2">
          <CompareButton listing={listing} />
          <SaveButton id={listing._id} name={listing.name} />
        </div>
      </div>
      {listing.imageUrls.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {listing.imageUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              onClick={() => setPhoto(index)}
              className={`shrink-0 rounded-xl overflow-hidden border-2 cursor-pointer ${index === photo ? "border-brand" : "border-transparent"}`}
            >
              <Photo src={url} alt="" className="h-16 w-24" />
            </button>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{listing.name}</h1>
          <p className="text-muted flex items-center gap-1 mt-1">
            <MapPin size={16} aria-hidden="true" /> {listing.address}
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted">
            <span className="flex items-center gap-1"><Eye size={15} aria-hidden="true" /> {listing.views} views</span>
            <button type="button" className="flex items-center gap-1 cursor-pointer hover:text-ink" onClick={share}>
              <Copy size={15} aria-hidden="true" /> Copy link
            </button>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 card p-5 mt-5">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-2.5">
                <Icon size={18} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-medium text-sm">{value}</dd>
                </div>
              </div>
            ))}
          </dl>

          <h2 className="text-lg font-semibold mt-7">About this home</h2>
          <p className="text-muted mt-2 whitespace-pre-line leading-relaxed">{listing.description}</p>

          <h2 className="text-lg font-semibold mt-7">House rules</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {rules.map(([enabled, label]) => (
              <li key={label} className={`flex items-center gap-2 text-sm ${enabled ? "" : "text-muted line-through"}`}>
                <ShieldCheck size={15} className={enabled ? "text-brand" : ""} aria-hidden="true" /> {label}
              </li>
            ))}
          </ul>

          {listing.amenities.length > 0 && (
            <>
              <h2 className="text-lg font-semibold mt-7">Amenities</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {listing.amenities.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <Check size={15} className="text-brand" aria-hidden="true" /> {item}
                  </li>
                ))}
              </ul>
            </>
          )}

          <MoveInCost listing={listing} />

          {lat !== undefined && (
            <section className="mt-7">
              <h2 className="text-lg font-semibold mb-3">Location and nearby</h2>
              <Suspense fallback={<div className="h-72 rounded-xl bg-raised" />}>
                <LocationPicker city={listing.city} lat={lat} lng={lng} />
              </Suspense>
              {listing.nearby?.length > 0 && (
                <>
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-4">
                    {listing.nearby.map((place) => (
                      <li key={place.name} className="flex justify-between gap-3 text-sm">
                        <span>{place.name} <span className="text-muted">({place.kind})</span></span>
                        <span className="text-muted whitespace-nowrap">{place.km} km</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted mt-2">Distances are approximate, measured in a straight line.</p>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="card p-5 self-start lg:sticky lg:top-24">
          <p className="text-3xl font-bold">
            {formatPrice(listing.effectivePrice ?? listing.regularPrice)}
            <span className="text-base font-normal text-muted"> /month</span>
          </p>
          {listing.offer && (
            <p className="text-sm text-accent font-medium mt-1">
              Save {formatPrice(listing.regularPrice - listing.discountPrice)} every month
            </p>
          )}
          <FairRent fairness={listing.fairness} />
          {listing.owner && (
            <p className="text-sm text-muted mt-3 mb-4">
              Listed by {listing.owner.username}, member since {formatDate(listing.owner.createdAt)}
            </p>
          )}
          <ContactOwner key={listing._id} listing={listing} />
          <div className="mt-5 pt-5 border-t border-line empty:hidden">
            <ScheduleVisit key={listing._id} listing={listing} />
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight mb-5">Similar homes</h2>
          <ListingGrid listings={similar} />
        </section>
      )}
    </div>
  );
}

export default Listing;
