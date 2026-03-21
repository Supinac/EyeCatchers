export type AuthRole = "child" | "admin";

export type AuthState = {
  displayName: string;
  role: AuthRole;
};
