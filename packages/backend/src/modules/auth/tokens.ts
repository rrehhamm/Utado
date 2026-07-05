import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_TTL_DAYS = 30;

export interface AccessTokenPayload {
  sub: string;
  username: string;
}

const JWT_ALGORITHM = "HS256";

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET, { algorithms: [JWT_ALGORITHM] }) as AccessTokenPayload;
}

export function signRefreshToken(userId: string): string {
  // jti makes every issuance unique even when re-issued for the same user within the
  // same second (otherwise HMAC signing is deterministic: identical sub/iat/exp would
  // produce a byte-for-byte identical JWT, so the *new* DB row and the *revoked* row
  // it replaced would share the same token_hash - letting the "revoked" raw token
  // keep authenticating via the new row).
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, REFRESH_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: [JWT_ALGORITHM] }) as { sub: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
