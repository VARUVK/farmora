import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { api } from "@shared/routes";
import { z } from "zod";
import { isAuthenticated, requireFarmer } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Setup Chat (AI Advisory)
  registerChatRoutes(app);

  // 3. API Routes

  // Profiles
  app.get(api.profiles.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const profile = await storage.getProfile(userId);
    if (!profile) {
      // Return empty profile or 404? 
      // Let's return 404 so frontend knows to prompt creation/setup
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    try {
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(userId, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Market Prices
  app.get(api.marketPrices.list.path, isAuthenticated, async (req, res) => {
    const filters = {
      crop: req.query.crop as string,
      state: req.query.state as string,
      district: req.query.district as string,
    };
    const prices = await storage.getMarketPrices(filters);
    res.json(prices);
  });

  // Simulations
  app.get(api.simulations.list.path, requireFarmer, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const sims = await storage.getSimulations(userId);
    res.json(sims);
  });

  app.post(api.simulations.create.path, requireFarmer, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    try {
      const input = api.simulations.create.input.parse(req.body);
      const sim = await storage.createSimulation({ ...input, userId });
      res.status(201).json(sim);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Notifications
  app.get(api.notifications.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user!.claims.sub;
    const notifs = await storage.getNotifications(userId);
    res.json(notifs);
  });

  app.patch(api.notifications.markRead.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const updated = await storage.markNotificationRead(id);
    if (!updated) return res.status(404).json({ message: "Notification not found" });
    res.json(updated);
  });

  // Seed Data (Safe to call on every startup, checks for existing data internally or we can add a check)
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Seed some market prices if empty
  const prices = await storage.getMarketPrices();
  if (prices.length === 0) {
    console.log("Seeding market prices...");
    const samplePrices = [
      { crop: "Wheat", state: "Punjab", district: "Ludhiana", market: "Ludhiana Mandi", price: 2125, source: "Agmarknet" },
      { crop: "Rice", state: "Punjab", district: "Amritsar", market: "Amritsar Mandi", price: 3200, source: "Agmarknet" },
      { crop: "Cotton", state: "Maharashtra", district: "Nagpur", market: "Nagpur Mandi", price: 6500, source: "Agmarknet" },
      { crop: "Onion", state: "Maharashtra", district: "Nashik", market: "Lasalgaon", price: 1800, source: "Agmarknet" },
      { crop: "Tomato", state: "Karnataka", district: "Kolar", market: "Kolar APMC", price: 1200, source: "Agmarknet" },
    ];
    
    for (const p of samplePrices) {
      await storage.addMarketPrice(p);
    }
  }
}
