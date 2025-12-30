import type { DbClient } from "./client";

export type DbTransaction = Parameters<DbClient["transaction"]>[0] extends (
  tx: infer T,
  ...args: any[]
) => any
  ? T
  : never;

export type DbOrTx = DbClient | DbTransaction;
