import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "utado_session";

export async function POST(req: NextRequest) {
  const { accessToken } = (await req.json()) as { accessToken?: string | null };
  const res = NextResponse.json({ ok: true });

  if (accessToken) {
    // maxAge mirrors the backend's default ACCESS_TOKEN_TTL (15m). If that env var
    // is changed, update this too — the cookie is just a cache of the token, not
    // a separate source of truth, so it should expire no later than the token does.
    res.cookies.set(COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 15,
    });
  } else {
    res.cookies.delete(COOKIE_NAME);
  }

  return res;
}
