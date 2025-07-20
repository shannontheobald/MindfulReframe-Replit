import { users, intakeResponses, type User, type InsertUser, type IntakeResponse, type InsertIntakeResponse } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createIntakeResponse(response: InsertIntakeResponse): Promise<IntakeResponse>;
  getIntakeResponseByUserId(userId: number): Promise<IntakeResponse | undefined>;
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

export const storage = new MemStorage();
