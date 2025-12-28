import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../../app-env";
import { logger } from "../logger";

export const loggerMiddleware = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    const requestId = c.get("requestId") || "-";

    logger.info({ requestId, method, path }, "Request started");

    await next();

    const duration = Date.now() - start;
    const status = c.res.status;

    const logData = {
      requestId,
      method,
      path,
      status,
      duration: `${duration}ms`
    };

    if (status >= 500) {
      logger.error(logData, "Request completed with error");
    } else if (status >= 400) {
      logger.warn(logData, "Request completed with client error");
    } else {
      logger.info(logData, "Request completed");
    }
  };
};
