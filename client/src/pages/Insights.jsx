import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatPrice } from "../lib/format";

const CITIES = ["Bengaluru", "Chennai", "Delhi", "Gurugram", "Hyderabad", "Mumbai", "Noida", "Pune"];

function Bars({ rows, labelOf, linkOf }) {
  const highest = Math.max(...rows.map((row) => row.average), 1);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={labelOf(row)}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <Link to={linkOf(row)} className="font-medium hover:text-brand">{labelOf(row)}</Link>
            <span className="text-muted">{formatPrice(row.average)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-raised overflow-hidden">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(row.average / highest) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Insights() {
  const [params, setParams] = useSearchParams();
  const city = CITIES.includes(params.get("city")) ? params.get("city") : "Bengaluru";
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/insights/${city}`).then(setData).catch(() => setData(false));
  }, [city]);

  const stats = data
    ? [
        ["Rentals listed", data.total.toLocaleString("en-IN")],
        ["Average rent per sq ft", formatPrice(data.rentPerSqft)],
        ["Bachelor friendly", `${data.bachelorShare}%`],
        ["No brokerage", `${data.noBrokerageShare}%`],
      ]
    : [];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Rent insights</h1>
      <p className="text-muted mt-1 mb-5">Calculated from the rentals listed on NestQuestors right now.</p>
      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1 mb-6">
        {CITIES.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === city}
            onClick={() => setParams({ city: name })}
            className={`shrink-0 px-4 py-2 rounded-full border text-sm font-medium cursor-pointer transition-colors ${
              name === city ? "bg-brand text-on-brand border-brand" : "border-line bg-surface hover:border-brand"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {data === false && <p className="card p-8 text-center text-muted">Could not load insights.</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(([label, value]) => (
              <div key={label} className="card p-4">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <section className="card p-5">
              <h2 className="font-semibold mb-4">Average rent by home size</h2>
              <Bars rows={data.byBedrooms} labelOf={(row) => `${row.bedrooms} BHK`} linkOf={(row) => `/search?city=${city}&bedrooms=${row.bedrooms}`} />
            </section>
            <section className="card p-5">
              <h2 className="font-semibold mb-4">2BHK rent by area</h2>
              <Bars rows={data.byArea} labelOf={(row) => row.area} linkOf={(row) => `/search?city=${city}&bedrooms=2&searchTerm=${encodeURIComponent(row.area)}`} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export default Insights;
