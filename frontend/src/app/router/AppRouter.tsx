import { Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./routes";
import { EntryPage } from "../../pages/EntryPage/EntryPage";
import { HomePage } from "../../pages/HomePage/HomePage";
import { GameConfigPage } from "../../pages/GameConfigPage/GameConfigPage";
import { GamePlayPage } from "../../pages/GamePlayPage/GamePlayPage";
import { ResultPage } from "../../pages/ResultPage/ResultPage";
import { SettingsPage } from "../../pages/SettingsPage/SettingsPage";
import { AdminLoginPage } from "../../pages/AdminLoginPage/AdminLoginPage";
import { AdminDashboardPage } from "../../pages/AdminDashboardPage/AdminDashboardPage";
import { AdminRouteGuard, ChildRouteGuard } from "./RouteGuards";

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.entry} element={<EntryPage />} />
      <Route path={routes.adminLogin} element={<AdminLoginPage />} />

      <Route element={<ChildRouteGuard />}>
        <Route path={routes.games} element={<HomePage />} />
        <Route path={routes.settings} element={<SettingsPage />} />
        <Route path={routes.gameConfig} element={<GameConfigPage />} />
        <Route path={routes.gamePlay} element={<GamePlayPage />} />
        <Route path={routes.result} element={<ResultPage />} />
      </Route>

      <Route element={<AdminRouteGuard />}>
        <Route path={routes.adminDashboard} element={<AdminDashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to={routes.entry} replace />} />
    </Routes>
  );
}
