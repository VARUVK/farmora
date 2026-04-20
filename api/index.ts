import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { setupAuth } from "../server/auth";

const app = express();

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// Initialize once at module load time (Vercel caches between requests)
let initialized = false;
const initPromise = registerRoutes(app).then(() => {
  initialized = true;
}).catch((err) => {
  console.error("Failed to initialize routes:", err);
});

// Error handler
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", err);
  if (res.headersSent) return next(err);
  return res.status(status).json({ message });
});

// Vercel handler — waits for init before processing each request
export default async function handler(req: Request, res: Response) {
  await initPromise;
  app(req, res);
}
