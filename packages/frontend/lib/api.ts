const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const { accessToken, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || "request_failed");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, accessToken?: string) => request<T>(path, { method: "GET", accessToken }),
  post: <T>(path: string, body?: unknown, accessToken?: string) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, accessToken }),
  put: <T>(path: string, body?: unknown, accessToken?: string) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, accessToken }),
  delete: <T>(path: string, accessToken?: string) =>
    request<T>(path, { method: "DELETE", accessToken }),
};

// Bypasses the generic JSON `request()` helper: a multipart upload must NOT set
// Content-Type manually - the browser sets it (with the multipart boundary) when
// the body is a FormData instance.
export async function uploadFile<T>(path: string, formData: FormData, accessToken: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error || "request_failed");
  }
  return res.json();
}
