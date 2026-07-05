import { NextFunction, Response } from "express";
import { verifyAccessToken } from "../modules/auth/tokens";
import { AuthedRequest } from "./requireAuth";

export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
  } catch {
    // ignore invalid/expired token, proceed unauthenticated
  }
  next();
}
