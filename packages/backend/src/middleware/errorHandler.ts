import { NextFunction, Request, Response } from "express";
import type { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Duck-typed rather than `instanceof ZodError`: zod schemas reach this handler both from
// backend code (imports zod directly) and from @utado/shared's compiled output (imports its
// own zod), and under some bundlers/test runners those resolve to distinct module instances
// with distinct ZodError classes even though they're the same physical package.
function isZodError(err: unknown): err is ZodError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: unknown }).name === "ZodError" &&
    Array.isArray((err as { issues?: unknown }).issues)
  );
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isZodError(err)) {
    return res.status(400).json({ error: "validation_error", details: err.flatten() });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "internal_server_error" });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "not_found" });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
