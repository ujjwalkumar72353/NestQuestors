import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function PrivateRoute() {
  const { current, ready } = useSelector((state) => state.user);
  const location = useLocation();
  if (!ready) return <div className="min-h-[60vh]" />;
  if (!current) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export default PrivateRoute;
