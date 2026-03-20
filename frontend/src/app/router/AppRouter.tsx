import { Navigate, Route, Routes } from "react-router-dom";
import { routes } from "./routes";
import { HomePage } from "../../pages/HomePage/HomePage";
import { GameConfigPage } from "../../pages/GameConfigPage/GameConfigPage";
import { GamePlayPage } from "../../pages/GamePlayPage/GamePlayPage";
import { ResultPage } from "../../pages/ResultPage/ResultPage";
import { SettingsPage } from "../../pages/SettingsPage/SettingsPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={<HomePage />} />
      <Route path={routes.settings} element={<SettingsPage />} />
      <Route path={routes.gameConfig} element={<GameConfigPage />} />
      <Route path={routes.gamePlay} element={<GamePlayPage />} />
      <Route path={routes.result} element={<ResultPage />} />
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}
