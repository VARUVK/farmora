import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";
import { storage } from "../../storage";
import { SQLiteSessionStore } from "./sessionStore";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
const DEMO_USER_ID = "demo-user-local";
const DEMO_USER_EMAIL = "demo@farmora.local";

function getSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || "farmora-local-dev-secret-change-in-production",
    store: new SQLiteSessionStore(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local demo login: GET /api/login creates/gets demo user and logs in
  app.get("/api/login", async (req, res, next) => {
    if (req.isAuthenticated() && (req.user as any)?.claims?.sub) {
      return res.redirect("/");
    }
    try {
      let user = await authStorage.getUser(DEMO_USER_ID);
      if (!user) {
        user = await authStorage.upsertUser({
          id: DEMO_USER_ID,
          email: DEMO_USER_EMAIL,
          firstName: "Demo",
          lastName: "User",
          profileImageUrl: null,
        });
        await storage.updateProfile(DEMO_USER_ID, {
          role: "farmer",
          state: "Punjab",
          district: "Ludhiana",
        });
      }
      req.login({ claims: { sub: user.id } } as Express.User, (err) => {
        if (err) return next(err);
        res.redirect("/");
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/callback", (_req, res) => res.redirect("/"));

  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated() || !(req.user as any)?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const requireRole = (role: string): RequestHandler => {
  return async (req: any, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = req.user.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile || profile.role !== role) {
      return res.status(403).json({ message: "Forbidden: Required role " + role });
    }
    next();
  };
};

export const requireFarmer = requireRole("farmer");
export const requireTrader = requireRole("trader");
export const requireAdmin = requireRole("admin");

export function getSession() {
  return getSessionMiddleware();
}
