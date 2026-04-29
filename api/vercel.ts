import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";
import * as fs from "fs";

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

interface UserMessage {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
}

// ─── In-Memory Storage (with /tmp persistence) ───────────
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
  userMessages: UserMessage[] = [];
  counters = { profile: 1, mp: 1, sim: 1, notif: 1, task: 1, conv: 1, msg: 1, umsg: 1 };
}
let store = new MemStorage();

const DATA_FILE = "/tmp/farmora_data.json";

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      store.users = new Map(data.users || []);
      store.usersByUsername = new Map(data.usersByUsername || []);
      store.profiles = new Map(data.profiles || []);
      store.marketPrices = data.marketPrices || [];
      store.simulations = new Map(data.simulations || []);
      store.notifications = new Map(data.notifications || []);
      store.tasks = new Map(data.tasks || []);
      store.conversations = new Map(data.conversations || []);
      store.messagesMap = new Map(data.messagesMap || []);
      store.userMessages = data.userMessages || [];
      store.counters = data.counters || store.counters;
    }
  } catch (err) {
    console.error("Error loading data", err);
  }
}

function saveData() {
  try {
    const data = {
      users: Array.from(store.users.entries()),
      usersByUsername: Array.from(store.usersByUsername.entries()),
      profiles: Array.from(store.profiles.entries()),
      marketPrices: store.marketPrices,
      simulations: Array.from(store.simulations.entries()),
      notifications: Array.from(store.notifications.entries()),
      tasks: Array.from(store.tasks.entries()),
      conversations: Array.from(store.conversations.entries()),
      messagesMap: Array.from(store.messagesMap.entries()),
      userMessages: store.userMessages,
      counters: store.counters
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving data", err);
  }
}

loadData();

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

declare global {
  namespace Express {
    interface User {
      id: string; username: string; password: string; email: string | null;
      firstName: string | null; lastName: string | null; profileImageUrl: string | null;
      createdAt: Date; updatedAt: Date;
    }
  }
}

// ─── Express App ────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  res.json({ ...u });
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });
    if (store.usersByUsername.has(username)) return res.status(400).json({ message: "Username already exists" });

    const id = crypto.randomUUID();
    const now = new Date();
    const user: User = {
      id, username,
      password: await hashPassword(password),
      email: null, firstName: username, lastName: null, profileImageUrl: null,
      createdAt: now, updatedAt: now,
    };
    store.users.set(id, user);
    store.usersByUsername.set(username, id);
    
    // Create initial profile linking the role
    const newProfile: Profile = {
      id: store.counters.profile++,
      userId: id,
      role: role || "farmer",
      state: null, district: null, crops: [],
      metadata: {},
    };
    store.profiles.set(id, newProfile);
    saveData();

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
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
      res.json(user);
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
    saveData();
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
    saveData();
    res.json(newProfile);
  }
});

// ─── Farmers & Traders Routes ─────────────────────────────────────────
app.get("/api/farmers", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const allProfiles = Array.from(store.profiles.values());
  const farmers = allProfiles.filter(p => p.role === "farmer");
  const enriched = farmers.map(f => {
    const u = store.users.get(f.userId);
    return { ...f, user: { firstName: u?.firstName, lastName: u?.lastName, username: u?.username } };
  });
  res.json(enriched);
});

// ─── User to User Messaging ──────────────────────────────────────────
app.get("/api/user-messages", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const uid = req.user!.id;
  const msgs = store.userMessages.filter(m => m.senderId === uid || m.receiverId === uid);
  
  // Also get a list of users we have interacted with to enrich
  const otherUserIds = new Set<string>();
  msgs.forEach(m => {
    if (m.senderId !== uid) otherUserIds.add(m.senderId);
    if (m.receiverId !== uid) otherUserIds.add(m.receiverId);
  });
  
  const usersInfo = Array.from(otherUserIds).map(id => {
    const u = store.users.get(id);
    const p = store.profiles.get(id);
    return { id, username: u?.username, firstName: u?.firstName, role: p?.role };
  });
  
  res.json({ messages: msgs, users: usersInfo });
});

app.post("/api/user-messages", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const uid = req.user!.id;
  const { receiverId, content } = req.body;
  
  const msg: UserMessage = {
    id: store.counters.umsg++,
    senderId: uid,
    receiverId,
    content,
    createdAt: new Date()
  };
  
  store.userMessages.push(msg);
  saveData();
  res.status(201).json(msg);
});

app.get("/api/users", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const usrs = Array.from(store.users.values()).map(u => {
    const p = store.profiles.get(u.id);
    return { id: u.id, username: u.username, firstName: u.firstName, role: p?.role || "farmer" };
  });
  res.json(usrs);
});

// ─── Market Prices ──────────────────────────────────────────────────
app.get("/api/market-prices", (_req, res) => {
  const cropBasePrices: Record<string, number> = {
    "Paddy": 2200, "Wheat": 2300, "Cotton": 7000, "Sugarcane": 300, 
    "Maize": 2000, "Soybean": 4000, "Mustard": 5000, "Barley": 1800
  };
  const todayMillis = new Date().setHours(0,0,0,0);
  const states = ["Punjab", "Maharashtra", "Andhra Pradesh", "Karnataka", "Uttar Pradesh"];
  const result = [];
  let id = 1;

  for (const [crop, basePrice] of Object.entries(cropBasePrices)) {
    states.forEach(state => {
      const stateFactor = Math.sin(state.length) * 0.05; // slight regional diff
      const dailyVolatility = (Math.sin(todayMillis + crop.length + state.length) * 10000);
      const change = (dailyVolatility - Math.floor(dailyVolatility)) * 0.08 - 0.04; // -4% to +4%
      
      const actualPrice = Math.round(basePrice * (1 + change + stateFactor));
      
      result.push({
        id: id++, crop, state, district: "Major Mandi", market: "Wholesale Market",
        price: actualPrice, currency: "INR", date: new Date(), source: "Real-time Sim", confidenceScore: 0.95
      });
    });
  }
  res.json(result);
});

// ─── Simulations ────────────────────────────────────────────────────
app.get("/api/simulations", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(store.simulations.get(req.user!.id) || []);
});
app.post("/api/simulations", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const userId = req.user!.id;
  const arr = store.simulations.get(userId) || [];
  const sim = { id: store.counters.sim++, userId, crop: req.body.crop, inputs: req.body.inputs, results: req.body.results, createdAt: new Date() };
  arr.push(sim);
  store.simulations.set(userId, arr);
  saveData();
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
  saveData();
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
  const arr = store.tasks.get(userId) || [];
  const task: Task = { id: store.counters.task++, userId, title: req.body.title, description: req.body.description ?? null, completed: false, category: req.body.category, dueDate: new Date(req.body.dueDate), createdAt: new Date() };
  arr.push(task);
  store.tasks.set(userId, arr);
  saveData();
  res.status(201).json(task);
});
app.patch("/api/tasks/:id", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const id = parseInt(req.params.id);
  const tasks = store.tasks.get(req.user!.id) || [];
  const t = tasks.find((x) => x.id === id);
  if (!t) return res.status(404).json({ message: "Not found" });
  Object.assign(t, req.body);
  saveData();
  res.json(t);
});

// ─── AI Advisory Conversations ───────────────────────────────────────
app.get("/api/conversations", (_req, res) => {
  const all = Array.from(store.conversations.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(all);
});
app.post("/api/conversations", (req, res) => {
  const id = store.counters.conv++;
  const conv = { id, title: req.body.title || "New Chat", createdAt: new Date() };
  store.conversations.set(id, conv);
  saveData();
  res.status(201).json(conv);
});
app.post("/api/conversations/:id/messages", async (req, res) => {
  const conversationId = parseInt(req.params.id);
  const msgs = store.messagesMap.get(conversationId) || [];
  msgs.push({ id: store.counters.msg++, conversationId, role: "user", content: req.body.content, createdAt: new Date() });
  msgs.push({ id: store.counters.msg++, conversationId, role: "assistant", content: "Thanks for your question! AI advisory requires an OpenAI API key.", createdAt: new Date() });
  store.messagesMap.set(conversationId, msgs);
  saveData();
  res.json({ messages: msgs });
});

// ─── Weather (Real-time Open-Meteo) ─────────────────────────────────────────────────
app.get("/api/weather", async (req, res) => {
  try {
    const q = req.query.location || "Delhi, India";
    // 1. Geocode
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q as string)}&count=1&format=json`);
    const geoData = await geoRes.json();
    const lat = geoData.results?.[0]?.latitude || 28.6139;
    const lon = geoData.results?.[0]?.longitude || 77.2090;

    // 2. Weather
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,weathercode&timezone=auto`);
    const data = await weatherRes.json();

    const code = data.current_weather.weathercode;
    let condition = "Sunny";
    if (code >= 51 && code <= 67) condition = "Rain";
    else if (code >= 1 && code <= 3) condition = "Partly Cloudy";
    else if (code >= 95) condition = "Thunderstorm";

    res.json({
      temp: Math.round(data.current_weather.temperature),
      condition,
      humidity: data.hourly?.relative_humidity_2m?.[0] || 65,
      windSpeed: Math.round(data.current_weather.windspeed),
      rainProb: code >= 51 ? 80 : 10,
      source: "Open-Meteo Realtime",
      lastUpdated: new Date().toISOString(),
      forecast: [
        { day: "today", temp: Math.round(data.daily?.temperature_2m_max?.[0] || 28), condition },
        { day: "tomorrow", temp: Math.round(data.daily?.temperature_2m_max?.[1] || 28), condition: "Varies" },
        { day: "nextWeek", temp: Math.round(data.daily?.temperature_2m_max?.[2] || 28), condition: "Varies" }
      ]
    });
  } catch (err) {
    res.json({ temp: 28, condition: "Partly Cloudy", humidity: 65, windSpeed: 12, rainProb: 15, source: "Offline Backup", lastUpdated: new Date().toISOString(), forecast: [] });
  }
});

// ─── Health ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── Error handler ──────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  if (!res.headersSent) res.status(500).json({ message: err.message || "Internal Server Error" });
});

export default function handler(req: Request, res: Response) { return app(req, res); }
