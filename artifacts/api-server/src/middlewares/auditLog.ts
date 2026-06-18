import type { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

const AUDIT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function extractActor(req: Request): string {
  const actorHeader = req.headers["x-user-id"];
  if (typeof actorHeader === "string" && actorHeader.trim().length > 0) {
    return actorHeader;
  }
  return "anonymous";
}

export function auditLog(req: Request, res: Response, next: NextFunction) {
  if (!AUDIT_METHODS.has(req.method)) {
    return next();
  }

  const startedAt = Date.now();
  const actor = extractActor(req);
  const reqId = req.id;
  const path = req.originalUrl || req.url;

  res.on("finish", () => {
    logger.info(
      {
        type: "audit.event",
        requestId: reqId,
        actor,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "Audit event",
    );
  });

  return next();
}
