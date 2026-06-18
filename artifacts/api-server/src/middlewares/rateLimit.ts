import type { NextFunction, Request, Response } from "express";

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120);
interface BucketState {
  count: number;
  resetAt: number;
}

// In-memory limiter is intentionally simple for single-instance deployments.
// Use a shared store (Redis/Upstash) for horizontally scaled production setups.
const buckets = new Map<string, BucketState>();
let lastPruneAt = 0;

function getClientIdentifier(req: Request): string {
  return req.ip || "unknown";
}

function pruneExpiredBuckets(now: number) {
  for (const [key, state] of buckets.entries()) {
    if (state.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  if (now - lastPruneAt >= WINDOW_MS) {
    pruneExpiredBuckets(now);
    lastPruneAt = now;
  }
  const key = getClientIdentifier(req);
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
