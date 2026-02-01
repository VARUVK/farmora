import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath =
  process.env.DATABASE_URL?.replace(/^file:/, "").trim() || path.join(process.cwd(), "local.db");

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
