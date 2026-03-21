import { request } from "./client";

export type AuthUserResponse = {
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

export type RegisterStudentRequest = {
  name: string;
  login: string;
};

export type RegisterAdminRequest = {
  name: string;
  login: string;
  password: string;
};

export type UserListItemResponse = {
  id: number;
  login: string;
  name: string;
};

export function studentLogin(payload: StudentLoginRequest) {
  return request<AuthUserResponse>("/user/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function adminLogin(payload: AdminLoginRequest) {
  return request<AuthUserResponse>("/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerStudent(payload: RegisterStudentRequest) {
  return request<AuthUserResponse>("/admin/user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerAdmin(payload: RegisterAdminRequest) {
  return request<AuthUserResponse>("/admin/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export function getStudents() {
  return request<UserListItemResponse[]>("/admin/user", {
    method: "GET",
  });
}

export function getAdmins() {
  return request<UserListItemResponse[]>("/admin/admin", {
    method: "GET",
  });
}

