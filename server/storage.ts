import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { users, intakeResponses, type User, type InsertUser, type IntakeResponse, type InsertIntakeResponse } from "@shared/schema";
import { eq } from "drizzle-orm";
import { checkDatabaseConnection } from "./database-status";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIntakeResponse(response: InsertIntakeResponse): Promise<IntakeResponse>;
  getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined>;
}

// Initialize database connection if DATABASE_URL exists, otherwise use in-memory storage
let db: any = null;
let dbAvailable = false;

async function initializeDatabase() {
  const status = await checkDatabaseConnection();
  
  if (status.connected && process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      db = drizzle(sql);
      dbAvailable = true;
      return true;
    } catch (error) {
      console.warn("Failed to initialize Drizzle ORM:", error);
      dbAvailable = false;
      return false;
    }
  }
  
  dbAvailable = false;
  return false;
}

// Initialize database connection
initializeDatabase();

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createIntakeResponse(insertResponse: InsertIntakeResponse): Promise<IntakeResponse> {
    const result = await db.insert(intakeResponses).values(insertResponse).returning();
    return result[0];
  }

  async getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined> {
    const result = await db.select().from(intakeResponses).where(eq(intakeResponses.userId, userId)).limit(1);
    return result[0];
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private intakeResponses: Map<number, IntakeResponse>;
  private currentUserId: number;
  private currentIntakeId: number;

  constructor() {
    this.users = new Map();
    this.intakeResponses = new Map();
    this.currentUserId = 1;
    this.currentIntakeId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createIntakeResponse(insertResponse: InsertIntakeResponse): Promise<IntakeResponse> {
    const id = this.currentIntakeId++;
    const response: IntakeResponse = {
      id,
      userId: insertResponse.userId || null,
      question1: insertResponse.question1,
      question2: insertResponse.question2,
      question3: insertResponse.question3,
      question4: insertResponse.question4,
      question5: insertResponse.question5,
      createdAt: new Date(),
    };
    this.intakeResponses.set(id, response);
    return response;
  }

  async getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined> {
    return Array.from(this.intakeResponses.values()).find(
      (response) => response.userId === userId,
    );
  }
}

// Create a dynamic storage that checks database availability
class DynamicStorage implements IStorage {
  private memStorage = new MemStorage();
  private dbStorage = new DatabaseStorage();

  async getUser(id: number): Promise<User | undefined> {
    return dbAvailable ? this.dbStorage.getUser(id) : this.memStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return dbAvailable ? this.dbStorage.getUserByUsername(username) : this.memStorage.getUserByUsername(username);
  }

  async createUser(user: InsertUser): Promise<User> {
    return dbAvailable ? this.dbStorage.createUser(user) : this.memStorage.createUser(user);
  }

  async createIntakeResponse(response: InsertIntakeResponse): Promise<IntakeResponse> {
    return dbAvailable ? this.dbStorage.createIntakeResponse(response) : this.memStorage.createIntakeResponse(response);
  }

  async getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined> {
    return dbAvailable ? this.dbStorage.getIntakeResponseByUserId(userId) : this.memStorage.getIntakeResponseByUserId(userId);
  }
}

export const storage = new DynamicStorage();
