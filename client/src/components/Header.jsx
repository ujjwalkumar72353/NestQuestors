import { Heart, Home, LogOut, Menu, Moon, Plus, Sun, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, useLocation } from "react-router-dom";
import { post } from "../lib/api";
import NotificationBell from "./NotificationBell";

const readTheme = () => {
  try {
    return localStorage.getItem("theme") || "light";
  } catch {
    return "light";
  }
};

const navClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive ? "text-brand" : "text-muted hover:text-ink"
  }`;

function Header() {
  const [theme, setTheme] = useState(readTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);
  const user = useSelector((state) => state.user.current);
  const { pathname } = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    const close = (event) => {
      if (!accountRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const signOut = async () => {
    await post("/auth/signout");
    window.location.assign("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="h-8 w-8 rounded-lg bg-brand text-on-brand flex items-center justify-center">
              <Home size={17} aria-hidden="true" />
            </span>
            NestQuestors
          </Link>
          <nav aria-label="Main" className="hidden md:flex items-center">
            <NavLink to="/search" className={navClass}>
              Explore
            </NavLink>
            <NavLink to="/insights" className={navClass}>
              Rent insights
            </NavLink>
            <NavLink to="/saved" className={navClass}>
              Saved
            </NavLink>
            <NavLink to="/about" className={navClass}>
              About
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-10 w-10 rounded-xl border border-line bg-surface flex items-center justify-center cursor-pointer hover:bg-raised transition-colors"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && <NotificationBell />}
          <Link to="/create-listing" className="btn-primary hidden sm:inline-flex h-10">
            <Plus size={17} aria-hidden="true" />
            List your home
          </Link>
          {user ? (
            <div className="relative hidden md:block" ref={accountRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(!accountOpen)}
                className="h-10 w-10 rounded-full bg-brand text-on-brand font-semibold uppercase cursor-pointer"
              >
                {user.username[0]}
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-52 card p-1.5 shadow-lg">
                  <p className="px-3 py-2 text-sm font-semibold truncate">
                    {user.username}
                  </p>
                  <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-raised">
                    <Home size={16} aria-hidden="true" /> Dashboard
                  </Link>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-raised">
                    <User size={16} aria-hidden="true" /> Profile
                  </Link>
                  <button type="button" onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-raised cursor-pointer">
                    <LogOut size={16} aria-hidden="true" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/sign-in" className="btn-ghost h-10 hidden md:inline-flex">
              Sign in
            </Link>
          )}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="md:hidden h-10 w-10 rounded-xl border border-line bg-surface flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile" className="md:hidden border-t border-line px-4 py-3 flex flex-col gap-1 bg-surface">
          <Link className="px-2 py-2.5" to="/search">Explore</Link>
          <Link className="px-2 py-2.5" to="/insights">Rent insights</Link>
          <Link className="px-2 py-2.5 flex items-center gap-2" to="/saved">
            <Heart size={16} aria-hidden="true" /> Saved
          </Link>
          <Link className="px-2 py-2.5" to="/create-listing">List your home</Link>
          <Link className="px-2 py-2.5" to="/about">About</Link>
          {user ? (
            <>
              <Link className="px-2 py-2.5" to="/dashboard">Dashboard</Link>
              <Link className="px-2 py-2.5" to="/profile">Profile</Link>
              <button type="button" className="px-2 py-2.5 text-left cursor-pointer" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <Link className="px-2 py-2.5" to="/sign-in">Sign in</Link>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
