import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Photo from "../components/Photo";
import { api } from "../lib/api";
import { formatDate, formatPrice, OCCUPANCY_LABELS } from "../lib/format";

const yesNo = (value) => (value ? "Yes" : "No");

const ROWS = [
  ["Monthly rent", (item) => formatPrice(item.effectivePrice)],
  ["Maintenance", (item) => formatPrice(item.maintenance)],
  ["Deposit", (item) => formatPrice(item.deposit)],
  ["Rent check", (item) => item.fairness?.label || "Not enough data"],
  ["Type", (item) => OCCUPANCY_LABELS[item.occupancy]],
  ["Bedrooms", (item) => item.bedrooms],
  ["Carpet area", (item) => (item.carpetArea ? `${item.carpetArea} sq ft` : "-")],
  ["Floor", (item) => `${item.floor} of ${item.totalFloors}`],
  ["Furnished", (item) => yesNo(item.furnished)],
  ["Parking", (item) => yesNo(item.parking)],
  ["Bachelors OK", (item) => yesNo(item.bachelorFriendly)],
  ["Pets allowed", (item) => yesNo(item.petsAllowed)],
  ["No brokerage", (item) => yesNo(item.brokerageFree)],
  ["Available from", (item) => (item.availableFrom ? formatDate(item.availableFrom) : "-")],
  ["Amenities", (item) => item.amenities.join(", ") || "-"],
];

function Compare() {
  const [params] = useSearchParams();
  const [listings, setListings] = useState(null);
  const ids = params.get("ids");

  useEffect(() => {
    if (!ids) {
      setListings([]);
      return;
    }
    api(`/listing/compare?ids=${ids}`).then(setListings).catch(() => setListings([]));
  }, [ids]);

  if (!listings) return <div className="min-h-[60vh]" />;
  if (listings.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Nothing to compare yet</h1>
        <p className="text-muted mt-2 mb-5">Use the compare button on up to 3 rentals.</p>
        <Link to="/search" className="btn-primary">Explore rentals</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Compare rentals</h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <td className="p-4" />
              {listings.map((item) => (
                <th key={item._id} scope="col" className="p-4 text-left align-top font-semibold">
                  <Photo src={item.imageUrls[0]} alt="" className="h-28 w-full rounded-xl mb-2" />
                  <Link to={`/listing/${item._id}`} className="hover:text-brand">{item.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, read]) => (
              <tr key={label} className="border-t border-line">
                <th scope="row" className="p-4 text-left font-medium text-muted whitespace-nowrap">{label}</th>
                {listings.map((item) => (
                  <td key={item._id} className="p-4">{read(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Compare;
