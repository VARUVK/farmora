import { 
  users, profiles, marketPrices, simulations, notifications,
  type User, type InsertUser, type Profile, type InsertProfile,
  type MarketPrice, type InsertMarketPrice, type Simulation, type InsertSimulation,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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
}

export class DatabaseStorage implements IStorage {
  // User & Profile (Delegated to Auth module mostly, but kept here for completeness if needed)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: 'username' might not exist on the auth-generated user table which uses 'email'. 
    // Adapting for safety:
    const [user] = await db.select().from(users).where(eq(users.email, username)); 
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // This is mostly handled by the Auth integration, but implementing for interface compliance
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async updateProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
    // Check if profile exists
    const existing = await this.getProfile(userId);
    if (existing) {
      const [updated] = await db.update(profiles)
        .set({ ...profileData }) // Remove updatedAt if not in schema or handle it
        .where(eq(profiles.userId, userId))
        .returning();
      return updated;
    } else {
      // Create if not exists
      const [created] = await db.insert(profiles)
        .values({ userId, ...profileData } as InsertProfile)
        .returning();
      return created;
    }
  }

  async getMarketPrices(filters?: { crop?: string, state?: string, district?: string }): Promise<MarketPrice[]> {
    let query = db.select().from(marketPrices).orderBy(desc(marketPrices.date));
    
    if (filters) {
      if (filters.crop) query.where(eq(marketPrices.crop, filters.crop));
      // Add other filters as needed (drizzle query builder handles simple where clauses easily, complex ones need `and()`)
    }
    
    return await query;
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
}

export const storage = new DatabaseStorage();
