import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { storage } from "../../storage";
import { isAuthenticated, requireFarmer } from "../auth";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

/**
 * Calculates deterministic advisory logic before AI explanation.
 * Trust-based signals for farmers.
 */
async function calculateAdvisoryLogic(crop: string, state: string, district: string) {
  const prices = await storage.getMarketPrices({ crop, state, district });
  
  if (prices.length < 2) {
    return {
      trend: "stable",
      volatility: 0.1,
      recommendation: "WAIT",
      confidence: 0.6,
      reason: "Insufficient market data for local mandi."
    };
  }

  const latestPrice = prices[0].price;
  const previousPrice = prices[1].price;
  const change = ((latestPrice - previousPrice) / previousPrice) * 100;
  
  let trend = "flat";
  if (change > 2) trend = "up";
  if (change < -2) trend = "down";

  // Mocked volatility based on price swings in last 5 records
  const recentPrices = prices.slice(0, 5).map(p => p.price);
  const avg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  const variance = recentPrices.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / recentPrices.length;
  const volatility = Math.sqrt(variance) / avg;

  let recommendation = "HOLD";
  if (trend === "up" && volatility < 0.15) recommendation = "SELL";
  if (trend === "down") recommendation = "WAIT";

  return {
    trend,
    volatility: Math.round(volatility * 100) / 100,
    recommendation,
    confidence: Math.round((1 - volatility) * 100),
    reason: `Price is ${trend} by ${Math.abs(Math.round(change))}% in recent days.`
  };
}

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", requireFarmer, async (req: any, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, crop, state, district } = req.body;

      // 1. Calculate deterministic logic if context is provided
      let advisoryContext = "";
      if (crop && state && district) {
        const logic = await calculateAdvisoryLogic(crop, state, district);
        advisoryContext = `[MARKET_LOGIC]: Trend: ${logic.trend}, Volatility: ${logic.volatility}, Suggested Action: ${logic.recommendation}, Confidence: ${logic.confidence}%, Basis: ${logic.reason}. Explain this to the farmer clearly without guaranteeing profit.`;
      }

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Inject deterministic logic into system prompt or latest message
      if (advisoryContext) {
        chatMessages.unshift({
          role: "user",
          content: advisoryContext
        });
      }

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

