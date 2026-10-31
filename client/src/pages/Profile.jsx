import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { post } from "../lib/api";
import { setUser } from "../store/userSlice";

function Profile() {
  const user = useSelector((state) => state.user.current);
  const [details, setDetails] = useState({ username: user.username, email: user.email });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const dispatch = useDispatch();

  const run = async (event, action) => {
    event.preventDefault();
    try {
      await action();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveDetails = (event) =>
    run(event, async () => {
      dispatch(setUser(await post("/user/update", details)));
      toast.success("Profile updated");
    });

  const savePassword = (event) =>
    run(event, async () => {
      await post("/user/password", passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      toast.success("Password changed");
    });

  const deleteAccount = (event) =>
    run(event, async () => {
      await post("/user/delete", { password: confirmPassword });
      window.location.assign("/");
    });

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>

      <form onSubmit={saveDetails} className="card p-5 flex flex-col gap-4">
        <h2 className="font-semibold">Your details</h2>
        <label className="block">
          <span className="text-sm font-medium">Username</span>
          <input className="input mt-1" required minLength={3} value={details.username} onChange={(e) => setDetails({ ...details, username: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input className="input mt-1" type="email" required value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary self-start">Save details</button>
      </form>

      <form onSubmit={savePassword} className="card p-5 flex flex-col gap-4">
        <h2 className="font-semibold">Change password</h2>
        <label className="block">
          <span className="text-sm font-medium">Current password</span>
          <input className="input mt-1" type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">New password</span>
          <input className="input mt-1" type="password" autoComplete="new-password" required minLength={8} value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
        </label>
        <button type="submit" className="btn-primary self-start">Change password</button>
      </form>

      <form onSubmit={deleteAccount} className="card p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-red-700 dark:text-red-300">Delete account</h2>
        <p className="text-sm text-muted">This permanently removes your account, listings and messages.</p>
        <label className="block">
          <span className="text-sm font-medium">Confirm with your password</span>
          <input className="input mt-1" type="password" autoComplete="off" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn-danger self-start">Delete my account</button>
      </form>
    </div>
  );
}

export default Profile;
