import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

// ─── Types ──────────────────────────────────────────────────────────
interface User {
  id: string;
  username: string;
  password: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Profile {
  id: number;
  userId: string;
  role: string;
  state: string | null;
  district: string | null;
  crops: string[] | null;
  metadata: any;
}

interface Task {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  category: string;
  dueDate: Date;
  createdAt: Date;
}

// ─── In-Memory Storage (persists across warm invocations) ───────────
class MemStorage {
  users = new Map<string, User>();
  usersByUsername = new Map<string, string>();
  profiles = new Map<string, Profile>();
  marketPrices: any[] = [];
  simulations = new Map<string, any[]>();
  notifications = new Map<string, any[]>();
  tasks = new Map<string, Task[]>();
  conversations = new Map<number, any>();
  messagesMap = new Map<number, any[]>();
  counters = { profile: 1, mp: 1, sim: 1, notif: 1, task: 1, conv: 1, msg: 1 };
}
const store = new MemStorage();

// ─── Password helpers ───────────────────────────────────────────────
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Extend express-session User type
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      password: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}

// ─── Express App ────────────────────────────────────────────────────
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
const SessionStore = MemoryStore(session);
app.set("trust proxy", 1);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "farmora-session-secret-change-me",
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({ checkPeriod: 86400000 }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Passport strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const uid = store.usersByUsername.get(username);
      if (!uid) return done(null, false);
      const user = store.users.get(uid);
      if (!user) return done(null, false);
      if (!(await comparePasswords(password, user.password))) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: string, done) => {
  const user = store.users.get(id);
  done(null, user || null);
});

// ─── Auth Routes ────────────────────────────────────────────────────
app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const u = req.user!;
  res.json({ id: u.id, username: u.username, email: u.email, firstName: u.firstName, lastName: u.lastName, profileImageUrl: u.profileImageUrl, createdAt: u.createdAt, updatedAt: u.updatedAt });
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    if (store.usersByUsername.has(username)) return res.status(400).json({ message: "Username already exists" });

    const id = crypto.randomUUID();
    const now = new Date();
    const user: User = {
      id, username,
      password: await hashPassword(password),
      email: email || null,
      firstName: null, lastName: null, profileImageUrl: null,
      createdAt: now, updatedAt: now,
    };
    store.users.set(id, user);
    store.usersByUsername.set(username, id);

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl, createdAt: user.createdAt, updatedAt: user.updatedAt });
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", (req, res, next) => {
  passport.authenticate("local", (err: any, user: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: "Invalid username or password" });
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ id: user.id, username: user.username, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl, createdAt: user.createdAt, updatedAt: user.updatedAt });
    });
  })(req, res, next);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

// ─── Profile Routes ─────────────────────────────────────────────────
app.get("/api/profiles/me", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const profile = store.profiles.get(req.user!.id);
  if (!profile) return res.status(404).json({ message: "Profile not found" });
  res.json(profile);
});

app.put("/api/profiles/me", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user!.id;
  const existing = store.profiles.get(userId);
  if (existing) {
    const updated = { ...existing, ...req.body };
    store.profiles.set(userId, updated);
    res.json(updated);
  } else {
    const newProfile: Profile = {
      id: store.counters.profile++,
      userId,
      role: req.body.role || "farmer",
      state: req.body.state || null,
      district: req.body.district || null,
      crops: req.body.crops || null,
      metadata: req.body.metadata || null,
    };
    store.profiles.set(userId, newProfile);
    res.json(newProfile);
  }
});

// ─── Market Prices ──────────────────────────────────────────────────
app.get("/api/market-prices", (_req, res) => {
  res.json(store.marketPrices);
});

// ─── Simulations ────────────────────────────────────────────────────
app.get("/api/simulations", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(store.simulations.get(req.user!.id) || []);
});

app.post("/api/simulations", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user!.id;
  const sim = { id: store.counters.sim++, userId, crop: req.body.crop, inputs: req.body.inputs, results: req.body.results, createdAt: new Date() };
  const arr = store.simulations.get(userId) || [];
  arr.push(sim);
  store.simulations.set(userId, arr);
  res.status(201).json(sim);
});

// ─── Notifications ──────────────────────────────────────────────────
app.get("/api/notifications", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(store.notifications.get(req.user!.id) || []);
});

app.patch("/api/notifications/:id/read", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const id = parseInt(req.params.id);
  const notifs = store.notifications.get(req.user!.id) || [];
  const n = notifs.find((x) => x.id === id);
  if (!n) return res.status(404).json({ message: "Not found" });
  n.read = true;
  res.json(n);
});

// ─── Tasks ──────────────────────────────────────────────────────────
app.get("/api/tasks", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(store.tasks.get(req.user!.id) || []);
});

app.post("/api/tasks", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user!.id;
  const task: Task = {
    id: store.counters.task++,
    userId,
    title: req.body.title,
    description: req.body.description ?? null,
    completed: false,
    category: req.body.category,
    dueDate: new Date(req.body.dueDate),
    createdAt: new Date(),
  };
  const arr = store.tasks.get(userId) || [];
  arr.push(task);
  store.tasks.set(userId, arr);
  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const id = parseInt(req.params.id);
  const tasks = store.tasks.get(req.user!.id) || [];
  const t = tasks.find((x) => x.id === id);
  if (!t) return res.status(404).json({ message: "Not found" });
  Object.assign(t, req.body);
  res.json(t);
});

// ─── Conversations / Advisory ───────────────────────────────────────
app.get("/api/conversations", (_req, res) => {
  const all = Array.from(store.conversations.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(all);
});

app.post("/api/conversations", (req, res) => {
  const id = store.counters.conv++;
  const conv = { id, title: req.body.title || "New Chat", createdAt: new Date() };
  store.conversations.set(id, conv);
  res.status(201).json(conv);
});

app.post("/api/conversations/:id/messages", async (req, res) => {
  const conversationId = parseInt(req.params.id);
  const { content } = req.body;
  const msgs = store.messagesMap.get(conversationId) || [];

  const userMsg = { id: store.counters.msg++, conversationId, role: "user", content, createdAt: new Date() };
  msgs.push(userMsg);

  const botMsg = { id: store.counters.msg++, conversationId, role: "assistant", content: "Thanks for your question! AI advisory features are available when an OpenAI API key is configured.", createdAt: new Date() };
  msgs.push(botMsg);
  store.messagesMap.set(conversationId, msgs);

  res.json({ messages: msgs });
});

// ─── Weather (mock) ─────────────────────────────────────────────────
app.get("/api/weather", (_req, res) => {
  res.json({
    temperature: 28,
    humidity: 65,
    description: "Partly Cloudy",
    icon: "02d",
    windSpeed: 12,
    rainfall: 0,
  });
});

// ─── Health ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Error handler ──────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  if (!res.headersSent) {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
});

// ─── Vercel Handler ─────────────────────────────────────────────────
export default function handler(req: Request, res: Response) {
  return app(req, res);
}
