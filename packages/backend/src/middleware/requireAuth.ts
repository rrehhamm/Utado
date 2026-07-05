import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../modules/auth/tokens";
import { HttpError } from "./errorHandler";

export interface AuthedRequest extends Request {
  userId?: string;
  username?: string;
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return next(new HttpError(401, "unauthorized"));
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.username = payload.username;
    next();
  } catch {
    next(new HttpError(401, "unauthorized"));
  }
}
