export type ApiValidationIssue = {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

export type ApiValidationError = {
  detail?: ApiValidationIssue[];
};

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function isValidationError(value: unknown): value is ApiValidationError {
  return Boolean(value) && typeof value === "object" && "detail" in (value as Record<string, unknown>);
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong.") {
  if (error instanceof ApiError) {
    if (isValidationError(error.data) && Array.isArray(error.data.detail) && error.data.detail.length > 0) {
      return error.data.detail[0]?.msg || fallback;
    }

    if (typeof error.data === "string" && error.data.trim()) {
      return error.data;
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}.`, response.status, body);
  }

  return body as T;
}


export async function simulateDelay<T>(value: T, delay = 200): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}
