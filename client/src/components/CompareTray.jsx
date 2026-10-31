import { X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clearCompare, useCompare } from "../lib/compare";

function CompareTray() {
  const items = useCompare();
  const { pathname } = useLocation();
  if (items.length === 0 || pathname === "/compare") return null;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 card shadow-xl flex items-center gap-3 pl-4 pr-2 py-2 max-w-[calc(100vw-6rem)]">
      <span className="text-sm font-medium whitespace-nowrap">{items.length} to compare</span>
      <Link to={`/compare?ids=${items.map((item) => item._id).join(",")}`} className="btn-primary h-9 whitespace-nowrap">
        Compare
      </Link>
      <button type="button" aria-label="Clear compare list" className="h-9 w-9 flex items-center justify-center cursor-pointer" onClick={clearCompare}>
        <X size={16} />
      </button>
    </div>
  );
}

export default CompareTray;
