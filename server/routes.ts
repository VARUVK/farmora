import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireFarmer } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // 1. Setup Auth
  setupAuth(app);

  // 2. API Routes
  
  // Profiles
  app.get(api.profiles.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const profile = await storage.getProfile(user.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  });

  app.put(api.profiles.update.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    try {
      const input = api.profiles.update.input.parse(req.body);
      const profile = await storage.updateProfile(user.id, input);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
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
  app.get(api.simulations.list.path, requireFarmer, async (req, res) => {
    const user = req.user as any;
    const sims = await storage.getSimulations(user.id);
    res.json(sims);
  });

  app.post(api.simulations.create.path, requireFarmer, async (req, res) => {
    const user = req.user as any;
    try {
      const input = api.simulations.create.input.parse(req.body);
      const sim = await storage.createSimulation({ ...input, userId: user.id });
      res.status(201).json(sim);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Chat/Advisory
  app.get("/api/conversations", isAuthenticated, async (req, res) => {
    const conversations = await storage.getAllConversations();
    res.json(conversations);
  });

  app.post("/api/conversations", isAuthenticated, async (req, res) => {
    const { title } = req.body;
    const conversation = await storage.createConversation(title || "New Chat");
    res.status(201).json(conversation);
  });

  app.post("/api/conversations/:id/messages", requireFarmer, async (req: any, res) => {
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    await storage.createMessage(conversationId, "user", content);
    
    const messages = await storage.getMessagesByConversation(conversationId);
    const chatMessages = messages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content
    }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const openai = getOpenAI();
    let fullResponse = "";

    if (openai) {
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }
    } else {
      fullResponse = "AI Advisory is in demo mode. Set OPENAI_API_KEY for real responses.";
      res.write(`data: ${JSON.stringify({ content: fullResponse })}\n\n`);
    }

    await storage.createMessage(conversationId, "assistant", fullResponse);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  });

  // Notifications
  app.get(api.notifications.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const notifs = await storage.getNotifications(user.id);
    res.json(notifs);
  });

  // Tasks
  app.get("/api/tasks", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userTasks = await storage.getTasks(user.id);
    res.json(userTasks);
  });

  app.post("/api/tasks", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const newTask = await storage.createTask({
      ...req.body,
      userId: user.id,
      dueDate: new Date(req.body.dueDate)
    });
    res.status(201).json(newTask);
  });

  const httpServer = createServer(app);
  return httpServer;
}
