import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const SESSION_COOKIE = "utado_session";

function authHeaders(): HeadersInit {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function serverFetchJson<T>(path: string): Promise<T | null> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function serverFetchJsonOrEmpty<T>(path: string, fallback: T): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    headers: authHeaders(),
  });
  if (!res.ok) return fallback;
  return res.json();
}
