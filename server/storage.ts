import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { users, intakeResponses, journalSessions, reframingSessions, type User, type InsertUser, type IntakeResponse, type InsertIntakeResponse, type JournalSession, type InsertJournalSession, type ReframingSession, type InsertReframingSession } from "@shared/schema";
import { eq } from "drizzle-orm";
import { checkDatabaseConnection } from "./database-status";
import { RULES } from "../shared/rules";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIntakeResponse(response: InsertIntakeResponse): Promise<IntakeResponse>;
  getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined>;
  createJournalSession(session: InsertJournalSession): Promise<JournalSession>;
  getJournalSessionsByUserId(userId: number): Promise<JournalSession[]>;
  getJournalSession(id: number): Promise<JournalSession | undefined>;
  createReframingSession(session: InsertReframingSession): Promise<ReframingSession>;
  getReframingSessionById(sessionId: number): Promise<ReframingSession | undefined>;
  updateReframingSession(sessionId: number, updates: Partial<ReframingSession>): Promise<void>;
  getReframingSessionsByUserId(userId: number): Promise<ReframingSession[]>;
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

  async createJournalSession(session: InsertJournalSession): Promise<JournalSession> {
    const result = await db.insert(journalSessions).values(session).returning();
    return result[0];
  }

  async getJournalSessionsByUserId(userId: number): Promise<JournalSession[]> {
    // Apply RLS-style filtering - restrict to user's own sessions only
    const result = await db.select().from(journalSessions)
      .where(eq(journalSessions.userId, userId))
      .orderBy(journalSessions.createdAt);
    return result;
  }

  async getJournalSession(id: number): Promise<JournalSession | undefined> {
    const result = await db.select().from(journalSessions).where(eq(journalSessions.id, id)).limit(1);
    return result[0];
  }

  async createReframingSession(session: InsertReframingSession): Promise<ReframingSession> {
    const result = await db.insert(reframingSessions).values(session).returning();
    return result[0];
  }

  async getReframingSessionById(sessionId: number): Promise<ReframingSession | undefined> {
    const result = await db.select().from(reframingSessions).where(eq(reframingSessions.id, sessionId)).limit(1);
    return result[0];
  }

  async updateReframingSession(sessionId: number, updates: Partial<ReframingSession>): Promise<void> {
    await db.update(reframingSessions).set(updates).where(eq(reframingSessions.id, sessionId));
  }

  async getReframingSessionsByUserId(userId: number): Promise<ReframingSession[]> {
    return await db.select().from(reframingSessions).where(eq(reframingSessions.userId, userId));
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private intakeResponses: Map<number, IntakeResponse>;
  private journalSessions: Map<number, JournalSession>;
  private reframingSessions: Map<number, ReframingSession>;
  private currentUserId: number;
  private currentIntakeId: number;
  private currentSessionId: number;
  private currentReframingId: number;

  constructor() {
    this.users = new Map();
    this.intakeResponses = new Map();
    this.journalSessions = new Map();
    this.reframingSessions = new Map();
    this.currentUserId = 1;
    this.currentIntakeId = 1;
    this.currentSessionId = 1;
    this.currentReframingId = 1;
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

  async createJournalSession(insertSession: InsertJournalSession): Promise<JournalSession> {
    const id = this.currentSessionId++;
    const session: JournalSession = {
      id,
      userId: insertSession.userId || null,
      journalEntry: insertSession.journalEntry,
      detectedThoughts: insertSession.detectedThoughts,
      cognitiveDistortions: insertSession.cognitiveDistortions,
      createdAt: new Date(),
    };
    this.journalSessions.set(id, session);
    return session;
  }

  async getJournalSessionsByUserId(userId: number): Promise<JournalSession[]> {
    // Apply session isolation - restrict to user's own sessions only
    return Array.from(this.journalSessions.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async getJournalSession(id: number): Promise<JournalSession | undefined> {
    return this.journalSessions.get(id);
  }

  async createReframingSession(insertSession: InsertReframingSession): Promise<ReframingSession> {
    const id = this.currentReframingId++;
    const session: ReframingSession = {
      id,
      journalSessionId: insertSession.journalSessionId,
      userId: insertSession.userId,
      selectedThought: insertSession.selectedThought,
      distortionType: insertSession.distortionType,
      reframingMethod: insertSession.reframingMethod,
      chatHistory: insertSession.chatHistory || [],
      finalReframedThought: insertSession.finalReframedThought || null,
      isCompleted: insertSession.isCompleted || false,
      createdAt: new Date(),
      completedAt: insertSession.completedAt || null,
    };
    this.reframingSessions.set(id, session);
    return session;
  }

  async getReframingSessionById(sessionId: number): Promise<ReframingSession | undefined> {
    return this.reframingSessions.get(sessionId);
  }

  async updateReframingSession(sessionId: number, updates: Partial<ReframingSession>): Promise<void> {
    const session = this.reframingSessions.get(sessionId);
    if (session) {
      const updatedSession = { ...session, ...updates };
      this.reframingSessions.set(sessionId, updatedSession);
    }
  }

  async getReframingSessionsByUserId(userId: number): Promise<ReframingSession[]> {
    return Array.from(this.reframingSessions.values())
      .filter((session) => session.userId === userId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
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

  async createJournalSession(session: InsertJournalSession): Promise<JournalSession> {
    return dbAvailable ? this.dbStorage.createJournalSession(session) : this.memStorage.createJournalSession(session);
  }

  async getJournalSessionsByUserId(userId: number): Promise<JournalSession[]> {
    return dbAvailable ? this.dbStorage.getJournalSessionsByUserId(userId) : this.memStorage.getJournalSessionsByUserId(userId);
  }

  async getJournalSession(id: number): Promise<JournalSession | undefined> {
    return dbAvailable ? this.dbStorage.getJournalSession(id) : this.memStorage.getJournalSession(id);
  }

  async createReframingSession(session: InsertReframingSession): Promise<ReframingSession> {
    return dbAvailable ? this.dbStorage.createReframingSession(session) : this.memStorage.createReframingSession(session);
  }

  async getReframingSessionById(sessionId: number): Promise<ReframingSession | undefined> {
    return dbAvailable ? this.dbStorage.getReframingSessionById(sessionId) : this.memStorage.getReframingSessionById(sessionId);
  }

  async updateReframingSession(sessionId: number, updates: Partial<ReframingSession>): Promise<void> {
    return dbAvailable ? this.dbStorage.updateReframingSession(sessionId, updates) : this.memStorage.updateReframingSession(sessionId, updates);
  }

  async getReframingSessionsByUserId(userId: number): Promise<ReframingSession[]> {
    return dbAvailable ? this.dbStorage.getReframingSessionsByUserId(userId) : this.memStorage.getReframingSessionsByUserId(userId);
  }
}

export const storage = new DynamicStorage();
