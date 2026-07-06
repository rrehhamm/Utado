export const API_URL = "http://localhost:4000/api/v1";

interface RegisteredUser {
  accessToken: string;
  user: { id: string; username: string; email: string };
}

export async function registerViaApi(usernamePrefix: string): Promise<RegisteredUser> {
  const suffix = Date.now().toString().slice(-6) + Math.floor(Math.random() * 1000);
  const username = `${usernamePrefix}${suffix}`.slice(0, 30);
  const email = `${username}@example.com`;
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password: "testpass123" }),
  });
  if (!res.ok) throw new Error(`register failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  return { ...body, user: { ...body.user, email } };
}

export async function getSongs(): Promise<{ id: string; title: string }[]> {
  const res = await fetch(`${API_URL}/songs`);
  return res.json();
}

export async function logSongViaApi(accessToken: string, songId: string, rating: number, review?: string) {
  const res = await fetch(`${API_URL}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ songId, rating, review: review ?? null }),
  });
  if (!res.ok) throw new Error(`log create failed: ${res.status} ${await res.text()}`);
  return res.json();
}
