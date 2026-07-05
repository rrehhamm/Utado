import { Router } from "express";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "@utado/shared";
import { pool } from "../../db/pool";
import { asyncHandler, HttpError } from "../../middleware/errorHandler";
import {
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens";

export const authRouter = Router();

const REFRESH_COOKIE = "utado_refresh";
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/api/v1/auth",
};

async function issueSession(res: import("express").Response, userId: string, username: string) {
  const accessToken = signAccessToken({ sub: userId, username });
  const refreshToken = signRefreshToken(userId);

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, hashToken(refreshToken), refreshExpiryDate()]
  );

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...REFRESH_COOKIE_OPTS,
    expires: refreshExpiryDate(),
  });

  return accessToken;
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = registerSchema.parse(req.body);

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (existing.rowCount) {
      throw new HttpError(409, "username_or_email_taken");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at`,
      [username, email, passwordHash]
    );
    const user = result.rows[0];

    const accessToken = await issueSession(res, user.id, user.username);

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        pinnedSongIds: user.pinned_song_ids,
        pinnedAlbumIds: user.pinned_album_ids,
        pinnedArtistIds: user.pinned_artist_ids,
        createdAt: user.created_at,
      },
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      "SELECT id, username, email, password_hash, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      throw new HttpError(401, "invalid_credentials");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new HttpError(401, "invalid_credentials");
    }

    const accessToken = await issueSession(res, user.id, user.username);

    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        pinnedSongIds: user.pinned_song_ids,
        pinnedAlbumIds: user.pinned_album_ids,
        pinnedArtistIds: user.pinned_artist_ids,
        createdAt: user.created_at,
      },
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new HttpError(401, "missing_refresh_token");
    }

    let payload: { sub: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new HttpError(401, "invalid_refresh_token");
    }

    const tokenHash = hashToken(token);
    const stored = await pool.query(
      "SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > now()",
      [payload.sub, tokenHash]
    );
    if (!stored.rowCount) {
      throw new HttpError(401, "invalid_refresh_token");
    }

    const userResult = await pool.query(
      "SELECT id, username, email, bio, avatar_url, pinned_song_ids, pinned_album_ids, pinned_artist_ids, created_at FROM users WHERE id = $1",
      [payload.sub]
    );
    const user = userResult.rows[0];
    if (!user) {
      throw new HttpError(401, "invalid_refresh_token");
    }

    await pool.query("UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1", [
      stored.rows[0].id,
    ]);

    const accessToken = await issueSession(res, user.id, user.username);
    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        pinnedSongIds: user.pinned_song_ids,
        pinnedAlbumIds: user.pinned_album_ids,
        pinnedArtistIds: user.pinned_artist_ids,
        createdAt: user.created_at,
      },
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await pool.query(
        "UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1",
        [hashToken(token)]
      );
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
    res.status(204).send();
  })
);
