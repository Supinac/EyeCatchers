export const routes = {
  entry: "/",
  games: "/games",
  settings: "/settings",
  gameConfig: "/game/:gameKey",
  gamePlay: "/play/:gameKey",
  result: "/result",
  adminLogin: "/admin/login",
  adminDashboard: "/admin",
} as const;
