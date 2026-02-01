import session from "express-session";
import type { SessionData } from "express-session";
import { db } from "../../db";
import { sessions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * SQLite-backed session store for express-session.
 * Uses the Drizzle sessions table (sid, sess, expire).
 */
export class SQLiteSessionStore extends session.Store {
  get(sid: string, callback: (err: unknown, session?: SessionData | null) => void): void {
    db.select()
      .from(sessions)
      .where(eq(sessions.sid, sid))
      .limit(1)
      .then((rows) => {
        if (rows.length === 0) return callback(null, null);
        const row = rows[0];
        const expire = row.expire instanceof Date ? row.expire.getTime() : Number(row.expire);
        if (expire <= Date.now()) {
          this.destroy(sid, () => callback(null, null));
          return;
        }
        try {
          const sess = typeof row.sess === "string" ? JSON.parse(row.sess) : row.sess;
          callback(null, sess);
        } catch (e) {
          callback(e, null);
        }
      })
      .catch((err) => callback(err, null));
  }

  set(sid: string, session: SessionData, callback: (err?: unknown) => void): void {
    const sess = JSON.stringify(session);
    const expires = session.cookie?.expires;
    const expire = expires instanceof Date ? expires.getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;

    db.insert(sessions)
      .values({
        sid,
        sess,
        expire: new Date(expire),
      })
      .onConflictDoUpdate({
        target: sessions.sid,
        set: { sess, expire: new Date(expire) },
      })
      .then(() => callback())
      .catch((err) => callback(err));
  }

  destroy(sid: string, callback: (err?: unknown) => void): void {
    db.delete(sessions)
      .where(eq(sessions.sid, sid))
      .then(() => callback())
      .catch((err) => callback(err));
  }

  touch(sid: string, session: SessionData, callback: (err?: unknown) => void): void {
    const expires = session.cookie?.expires;
    const expire = expires instanceof Date ? expires.getTime() : Date.now() + 7 * 24 * 60 * 60 * 1000;
    db.update(sessions)
      .set({ expire: new Date(expire) })
      .where(eq(sessions.sid, sid))
      .then(() => callback())
      .catch((err) => callback(err));
  }
}
