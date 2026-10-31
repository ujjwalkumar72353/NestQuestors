import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ListingGrid } from "../components/ListingCard";
import { api } from "../lib/api";

function Saved() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const savedIds = useSelector((state) => state.user.current?.saved);

  useEffect(() => {
    api("/user/saved")
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [savedIds?.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Saved homes</h1>
      {!loading && listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold">No saved homes yet</p>
          <p className="text-sm text-muted mt-1 mb-4">Tap the heart on a home to keep it here.</p>
          <Link to="/search" className="btn-primary">Explore homes</Link>
        </div>
      ) : (
        <ListingGrid listings={listings} loading={loading} skeletons={4} />
      )}
    </div>
  );
}

export default Saved;
