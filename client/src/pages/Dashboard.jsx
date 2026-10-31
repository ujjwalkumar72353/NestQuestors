import { BellOff, Eye, Heart, Home, MessageSquare, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useSearchParams } from "react-router-dom";
import Photo from "../components/Photo";
import { api, post } from "../lib/api";
import { formatDate, formatPrice, SLOT_LABELS } from "../lib/format";

function Empty({ text, action }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-muted mb-4">{text}</p>
      {action}
    </div>
  );
}

function MyListings() {
  const [listings, setListings] = useState(null);

  useEffect(() => {
    api("/user/listings").then(setListings).catch(() => setListings([]));
  }, []);

  const remove = async (listing) => {
    if (!window.confirm(`Delete "${listing.name}"?`)) return;
    try {
      await api(`/listing/delete/${listing._id}`, { method: "DELETE" });
      setListings(listings.filter((item) => item._id !== listing._id));
      toast.success("Listing deleted");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!listings) return <p className="text-muted">Loading</p>;
  if (listings.length === 0) {
    return (
      <Empty
        text="You haven't listed a home yet."
        action={<Link to="/create-listing" className="btn-primary">List your home</Link>}
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {listings.slice(0, 50).map((listing) => (
        <li key={listing._id} className="card p-3 flex items-center gap-4">
          <Photo src={listing.imageUrls[0]} alt={listing.name} className="h-16 w-20 rounded-xl shrink-0" />
          <div className="min-w-0 flex-1">
            <Link to={`/listing/${listing._id}`} className="font-medium hover:text-brand block truncate">
              {listing.name}
            </Link>
            <p className="text-sm text-muted truncate">
              {formatPrice(listing.effectivePrice ?? listing.regularPrice)} · {listing.city}
            </p>
          </div>
          <Link to={`/edit-listing/${listing._id}`} aria-label={`Edit ${listing.name}`} className="btn-ghost w-11 px-0">
            <Pencil size={16} aria-hidden="true" />
          </Link>
          <button type="button" aria-label={`Delete ${listing.name}`} className="btn-danger w-11 px-0" onClick={() => remove(listing)}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Messages({ path, received }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api(path).then(setItems).catch(() => setItems([]));
  }, [path]);

  const markRead = async (item) => {
    await post(`/inquiry/${item._id}/read`).catch(() => {});
    setItems(items.map((row) => (row._id === item._id ? { ...row, read: true } : row)));
  };

  if (!items) return <p className="text-muted">Loading</p>;
  if (items.length === 0) {
    return <Empty text={received ? "No messages from renters yet." : "You haven't contacted any owners yet."} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item._id} className={`card p-4 ${received && !item.read ? "border-brand" : ""}`}>
          <div className="flex justify-between gap-3 flex-wrap">
            <Link to={`/listing/${item.listing._id}`} className="font-medium hover:text-brand">
              {item.listing.name}
            </Link>
            <span className="text-sm text-muted">{formatDate(item.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-line">{item.message}</p>
          {received && (
            <div className="flex items-center justify-between gap-3 flex-wrap mt-3">
              <a href={`mailto:${item.sender.email}`} className="text-sm text-brand font-medium">
                Reply to {item.sender.username}
              </a>
              {!item.read && (
                <button type="button" className="btn-ghost h-9" onClick={() => markRead(item)}>
                  Mark as read
                </button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/user/analytics").then(setData).catch(() => setData(false));
  }, []);

  if (data === null) return <p className="text-muted">Loading</p>;
  if (!data) return <Empty text="Could not load your numbers." />;
  const stats = [
    [Home, "Listings", data.totals.listings],
    [Eye, "Views", data.totals.views],
    [Heart, "Saves", data.totals.saves],
    [MessageSquare, "Messages", data.totals.inquiries],
    [CalendarDays, "Visits", data.totals.visits],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(([Icon, label, value]) => (
          <div key={label} className="card p-4">
            <Icon size={18} className="text-brand" aria-hidden="true" />
            <p className="text-2xl font-bold mt-2">{value.toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </div>
      {data.top.length > 0 && (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left font-semibold p-4">Top listings</caption>
            <thead>
              <tr className="text-muted text-left border-t border-line">
                <th scope="col" className="px-4 py-2 font-medium">Home</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Views</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Saves</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Messages</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Visits</th>
              </tr>
            </thead>
            <tbody>
              {data.top.map((row) => (
                <tr key={row._id} className="border-t border-line">
                  <td className="px-4 py-2.5"><Link to={`/listing/${row._id}`} className="hover:text-brand">{row.name}</Link></td>
                  <td className="px-4 py-2.5 text-right">{row.views}</td>
                  <td className="px-4 py-2.5 text-right">{row.saves}</td>
                  <td className="px-4 py-2.5 text-right">{row.inquiries}</td>
                  <td className="px-4 py-2.5 text-right">{row.visits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  requested: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  confirmed: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  declined: "bg-red-500/15 text-red-700 dark:text-red-300",
  cancelled: "bg-raised text-muted",
};

function VisitList({ path, owner }) {
  const [visits, setVisits] = useState(null);

  const load = () => api(path).then(setVisits).catch(() => setVisits([]));

  useEffect(() => {
    load();
  }, [path]);

  const change = async (visit, status) => {
    try {
      await post(`/visit/${visit._id}/status`, { status });
      toast.success(`Visit ${status}`);
      load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!visits) return <p className="text-muted">Loading</p>;
  if (visits.length === 0) {
    return <Empty text={owner ? "No visit requests yet." : "You haven't booked any visits."} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {visits.map((visit) => (
        <li key={visit._id} className="card p-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <Link to={`/listing/${visit.listing._id}`} className="font-medium hover:text-brand">
              {visit.listing.name}
            </Link>
            <span className={`text-xs font-semibold capitalize rounded-full px-2.5 py-1 ${STATUS_STYLES[visit.status]}`}>
              {visit.status}
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            {formatDate(visit.date)}, {SLOT_LABELS[visit.slot]}
            {owner && ` · ${visit.renter.username}`}
          </p>
          <div className="flex gap-2 mt-3">
            {owner && visit.status === "requested" && (
              <>
                <button type="button" className="btn-primary h-9" onClick={() => change(visit, "confirmed")}>Confirm visit</button>
                <button type="button" className="btn-ghost h-9" onClick={() => change(visit, "declined")}>Decline</button>
              </>
            )}
            {!owner && ["requested", "confirmed"].includes(visit.status) && (
              <button type="button" className="btn-ghost h-9" onClick={() => change(visit, "cancelled")}>Cancel visit</button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Visits() {
  return (
    <div className="flex flex-col gap-7">
      <section>
        <h2 className="font-semibold mb-3">Visits to my homes</h2>
        <VisitList path="/visit/owner" owner />
      </section>
      <section>
        <h2 className="font-semibold mb-3">Homes I'm visiting</h2>
        <VisitList path="/visit/mine" />
      </section>
    </div>
  );
}

function Alerts() {
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    api("/alert").then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const remove = async (id) => {
    try {
      await api(`/alert/${id}`, { method: "DELETE" });
      setAlerts(alerts.filter((alert) => alert._id !== id));
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!alerts) return <p className="text-muted">Loading</p>;
  if (alerts.length === 0) {
    return <Empty text="Save a search to get notified about new matches." action={<Link to="/search" className="btn-primary">Explore rentals</Link>} />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {alerts.map((alert) => (
        <li key={alert._id} className="card p-4 flex items-center justify-between gap-3">
          <Link to={`/search?${alert.query}`} className="font-medium hover:text-brand min-w-0 truncate">{alert.label}</Link>
          <button type="button" aria-label={`Delete alert ${alert.label}`} className="btn-ghost w-11 px-0" onClick={() => remove(alert._id)}>
            <BellOff size={16} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

const TABS = [
  ["overview", "Overview"],
  ["listings", "My listings"],
  ["visits", "Visits"],
  ["inbox", "Inbox"],
  ["sent", "Sent"],
  ["alerts", "Search alerts"],
];

function Dashboard() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const setTab = (key) => setParams({ tab: key });
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
      <div className="flex justify-between items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link to="/create-listing" className="btn-primary">New listing</Link>
      </div>
      <div role="tablist" className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 font-medium border-b-2 -mb-px cursor-pointer whitespace-nowrap transition-colors ${
              tab === key ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "listings" && <MyListings />}
      {tab === "visits" && <Visits />}
      {tab === "alerts" && <Alerts />}
      {tab === "inbox" && <Messages path="/inquiry/received" received />}
      {tab === "sent" && <Messages path="/inquiry/sent" />}
    </div>
  );
}

export default Dashboard;
