import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { post } from "../lib/api";
import { setUser } from "../store/userSlice";

const DEMOS = [
  ["Owner", "owner@demo.com"],
  ["Renter", "renter@demo.com"],
];

function SignIn() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.current);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();

  if (user) return <Navigate to={state?.from || "/"} replace />;

  const signIn = async (values) => {
    setLoading(true);
    try {
      dispatch(setUser(await post("/auth/signin", values)));
      navigate(state?.from || "/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to save homes and contact owners">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          signIn(form);
        }}
      >
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input className="input mt-1" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input className="input mt-1" type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in" : "Sign in"}
        </button>
      </form>
      {import.meta.env.DEV && (
        <div className="mt-5">
          <p className="text-center text-sm text-muted mb-2">Try a demo account</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMOS.map(([label, email]) => (
              <button key={label} type="button" className="btn-ghost" disabled={loading} onClick={() => signIn({ email, password: "demo12345" })}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-center text-muted mt-5">
        New here? <Link to="/sign-up" className="text-brand font-semibold">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export default SignIn;
