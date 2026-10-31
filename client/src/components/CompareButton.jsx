import { GitCompareArrows } from "lucide-react";
import toast from "react-hot-toast";
import { MAX_COMPARE, toggleCompare, useCompare } from "../lib/compare";

function CompareButton({ listing, className = "" }) {
  const items = useCompare();
  const active = items.some((item) => item._id === listing._id);

  const onClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!toggleCompare(listing)) {
      toast(`You can compare up to ${MAX_COMPARE} homes`);
    }
  };

  return (
    <button
      type="button"
      aria-label={`${active ? "Remove from" : "Add to"} compare: ${listing.name}`}
      aria-pressed={active}
      onClick={onClick}
      className={`h-10 w-10 rounded-full shadow flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-110 ${
        active ? "bg-teal-700 text-white" : "bg-white/95 text-slate-800"
      } ${className}`}
    >
      <GitCompareArrows size={17} aria-hidden="true" />
    </button>
  );
}

export default CompareButton;
