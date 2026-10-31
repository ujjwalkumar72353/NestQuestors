import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, post } from "../lib/api";
import { formatDate } from "../lib/format";

const POLL_MS = 30000;

function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();
  const unread = items.filter((item) => !item.read).length;

  const load = () => api("/notification").then(setItems).catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => {
      clearInterval(timer);
      document.removeEventListener("click", close);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    load();
  }, [pathname]);

  const toggle = () => {
    setOpen(!open);
    if (!open && unread > 0) {
      post("/notification/read")
        .then(() => setItems((old) => old.map((item) => ({ ...item, read: true }))))
        .catch(() => {});
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={toggle}
        className="relative h-10 w-10 rounded-xl border border-line bg-surface flex items-center justify-center cursor-pointer hover:bg-raised transition-colors"
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-orange-600 text-white text-xs font-semibold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute -right-12 sm:right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card shadow-lg p-1.5 max-h-96 overflow-y-auto z-50">
          <p className="px-3 py-2 font-semibold">Notifications</p>
          {items.length === 0 && <p className="px-3 pb-3 text-sm text-muted">Nothing new yet.</p>}
          {items.map((item) => (
            <Link key={item._id} to={item.link} className="block px-3 py-2 rounded-lg hover:bg-raised">
              <span className="block text-sm font-medium">{item.title}</span>
              <span className="block text-sm text-muted truncate">{item.body}</span>
              <span className="block text-xs text-muted mt-0.5">{formatDate(item.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
