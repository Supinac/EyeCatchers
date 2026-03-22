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
  if (response.status === 204 || response.status === 205 || response.status === 304) {
    return null;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
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
    credentials: "include",
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


export type ApiFileResponse = {
  blob: Blob;
  fileName: string | null;
  contentType: string;
};

function parseContentDispositionFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = contentDisposition.match(/filename=([^;]+)/i);
  return plainMatch?.[1]?.trim() ?? null;
}

function normalizeBase64(value: string) {
  return value.replace(/^data:application\/pdf;base64,/i, '').replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
}

function isBase64Pdf(value: string) {
  const normalized = normalizeBase64(value);
  return /^JVBERi0/i.test(normalized);
}

function decodeBase64Pdf(value: string) {
  const normalized = normalizeBase64(value);
  const binary = window.atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: 'application/pdf' });
}

async function parseFileBody(response: Response): Promise<ApiFileResponse> {
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const fileName = parseContentDispositionFileName(response.headers.get('content-disposition'));

  if (contentType.includes('application/json') || contentType.startsWith('text/')) {
    const text = await response.text();
    let serialized = text.trim();

    if (contentType.includes('application/json')) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (typeof parsed === 'string') {
          serialized = parsed;
        }
      } catch {
        serialized = text.trim();
      }
    }

    if (isBase64Pdf(serialized)) {
      return {
        blob: decodeBase64Pdf(serialized),
        fileName,
        contentType: 'application/pdf',
      };
    }

    return {
      blob: new Blob([text], { type: contentType || 'text/plain' }),
      fileName,
      contentType,
    };
  }

  const blob = await response.blob();
  return {
    blob,
    fileName,
    contentType: blob.type || contentType,
  };
}

export async function requestFile(path: string, init?: RequestInit): Promise<ApiFileResponse> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/pdf, application/octet-stream, application/json, text/plain, */*',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await parseResponseBody(response);
    throw new ApiError(`Request failed with status ${response.status}.`, response.status, body);
  }

  return parseFileBody(response);
}

export function triggerBrowserFileDownload(blob: Blob, fileName: string) {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl);
  }, 0);
}
