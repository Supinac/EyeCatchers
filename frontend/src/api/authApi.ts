import { request } from "./client";

export type LoginResponse = {
  id: number;
  login: string;
  name: string;
};

export type StudentLoginRequest = {
  login: string;
};

export type AdminLoginRequest = {
  login: string;
  password: string;
};

export function studentLogin(payload: StudentLoginRequest) {
  return request<LoginResponse>("/user/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminLogin(payload: AdminLoginRequest) {
  return request<LoginResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
