export type AuthRole = "child" | "admin";

export type AuthState = {
  userId: string;
  login: string;
  displayName: string;
  role: AuthRole;
};
