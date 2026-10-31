import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import { post } from "../lib/api";

function SignUp() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.current);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await post("/auth/signup", form);
      toast.success("Account created. Please sign in.");
      navigate("/sign-in");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Create your account" subtitle="Find your next home in a few minutes">
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <label className="block">
          <span className="text-sm font-medium">Username</span>
          <input className="input mt-1" required minLength={3} maxLength={30} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input className="input mt-1" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input className="input mt-1" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating account" : "Create account"}
        </button>
      </form>
      <p className="text-center text-muted mt-5">
        Already registered? <Link to="/sign-in" className="text-brand font-semibold">Sign in</Link>
      </p>
    </AuthCard>
  );
}

export default SignUp;
