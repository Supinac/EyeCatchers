import { Navigate, Outlet } from "react-router-dom";
import { getAuthState } from "../../features/auth/model/authStore";
import { routes } from "./routes";

export function ChildRouteGuard() {
  const auth = getAuthState();

  if (!auth) {
    return <Navigate to={routes.entry} replace />;
  }

  if (auth.role !== "child") {
    return <Navigate to={routes.adminDashboard} replace />;
  }

  return <Outlet />;
}

export function AdminRouteGuard() {
  const auth = getAuthState();

  if (!auth) {
    return <Navigate to={routes.adminLogin} replace />;
  }

  if (auth.role !== "admin") {
    return <Navigate to={routes.games} replace />;
  }

  return <Outlet />;
}
