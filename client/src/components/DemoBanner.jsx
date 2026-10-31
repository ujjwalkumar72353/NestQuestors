import { useEffect, useState } from "react";
import { api } from "../lib/api";

function DemoBanner() {
  const [demoSite, setDemoSite] = useState(false);

  useEffect(() => {
    api("/listing/options")
      .then((options) => setDemoSite(options.demoSite))
      .catch(() => {});
  }, []);

  if (!demoSite) return null;
  return (
    <p role="status" className="bg-amber-500 text-amber-950 text-center text-sm font-medium px-4 py-1.5">
      Demo data: these rentals, owners, prices and view counts are sample data, not real homes.
    </p>
  );
}

export default DemoBanner;
