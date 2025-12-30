import pino from "pino";
import { env } from "../env";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname"
        }
      }
    : undefined,
  base: undefined
});

export type Logger = typeof logger;
