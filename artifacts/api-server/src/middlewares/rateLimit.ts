import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);

interface BucketState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketState>();

function getClientIdentifier(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || "unknown";
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = `${getClientIdentifier(req)}:${req.path}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "rate_limit_exceeded",
      message: "Too many requests. Please retry later.",
    });
  }

  current.count += 1;
  return next();
}
