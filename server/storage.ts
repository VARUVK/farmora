import { 
  users, profiles, marketPrices, simulations, notifications, tasks,
  type User, type Profile, type InsertProfile,
  type MarketPrice, type InsertMarketPrice, type Simulation, type InsertSimulation,
  type Notification, type InsertNotification,
  type Task, type InsertTask
} from "@shared/schema";
import { type UpsertUser as InsertUser } from "@shared/models/auth";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User & Profile
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProfile(userId: string): Promise<Profile | undefined>;
  updateProfile(userId: string, profile: Partial<InsertProfile>): Promise<Profile>;
  
  // Market Prices
  getMarketPrices(filters?: { crop?: string, state?: string, district?: string }): Promise<MarketPrice[]>;
  addMarketPrice(price: InsertMarketPrice): Promise<MarketPrice>;
  
  // Simulations
  getSimulations(userId: string): Promise<Simulation[]>;
  createSimulation(simulation: InsertSimulation): Promise<Simulation>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<Notification>;

  // Tasks
  getTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username)); 
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) {
      const [updated] = await db.update(profiles)
        .set({ ...profileData })
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(profiles)
        .values({ userId, ...profileData } as InsertProfile)
        .returning();
      return created;
    }
  }

  async getMarketPrices(filters?: { crop?: string; state?: string; district?: string }): Promise<MarketPrice[]> {
    const conditions = [];
    if (filters?.crop) conditions.push(eq(marketPrices.crop, filters.crop));
    if (filters?.state) conditions.push(eq(marketPrices.state, filters.state));
    if (filters?.district) conditions.push(eq(marketPrices.district, filters.district));
    const base = db.select().from(marketPrices).orderBy(desc(marketPrices.date));
    if (conditions.length === 0) return await base;
    return await base.where(and(...conditions));
  }

  async addMarketPrice(price: InsertMarketPrice): Promise<MarketPrice> {
    const [newPrice] = await db.insert(marketPrices).values(price).returning();
    return newPrice;
  }

  async getSimulations(userId: string): Promise<Simulation[]> {
    return await db.select().from(simulations)
      .where(eq(simulations.userId, userId))
      .orderBy(desc(simulations.createdAt));
  }

  async createSimulation(simulation: InsertSimulation): Promise<Simulation> {
    const [newSim] = await db.insert(simulations).values(simulation).returning();
    return newSim;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: number): Promise<Notification> {
    const [updated] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(eq(tasks.userId, userId))
      .orderBy(desc(tasks.dueDate));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
