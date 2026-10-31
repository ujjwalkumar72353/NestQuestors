import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SmartSearch({ initial = "", onSearch, large = false }) {
  const [value, setValue] = useState(initial);
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    const q = value.trim();
    if (onSearch) onSearch(q);
    else navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`flex items-center gap-2 bg-surface border border-line rounded-2xl pl-4 pr-1.5 ${
        large ? "h-16 shadow-xl shadow-black/10" : "h-13 py-1"
      }`}
    >
      <Sparkles size={19} className="text-brand shrink-0" aria-hidden="true" />
      <input
        aria-label="Describe the home you want"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="2BHK furnished in Pune under 25k"
        className="flex-1 min-w-0 bg-transparent outline-none text-ink placeholder:text-muted"
      />
      <button type="submit" className="btn-primary" aria-label="Search">
        <Search size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}

export default SmartSearch;
