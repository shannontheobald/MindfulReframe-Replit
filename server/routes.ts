import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntakeResponseSchema, insertJournalSessionSchema } from "@shared/schema";
import { z } from "zod";
import { getDatabaseStatus } from "./database-status";
import { analyzeJournalEntry } from "./openai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Database status endpoint
  app.get("/api/status", (req, res) => {
    const status = getDatabaseStatus();
    res.json({
      server: "running",
      database: status
    });
  });
  // Create intake response
  app.post("/api/intake", async (req, res) => {
    try {
      const validatedData = insertIntakeResponseSchema.parse(req.body);
      const intakeResponse = await storage.createIntakeResponse(validatedData);
      res.json(intakeResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // Get intake response by user ID
  app.get("/api/intake/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const intakeResponse = await storage.getIntakeResponseByUserId(userId);
      if (!intakeResponse) {
        res.status(404).json({ message: "Intake response not found" });
        return;
      }

      res.json(intakeResponse);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analyze journal entry and create session
  app.post("/api/sessions/analyze", async (req, res) => {
    try {
      const { journalEntry, userId } = z.object({
        journalEntry: z.string().min(10, "Journal entry must be at least 10 characters"),
        userId: z.number().optional()
      }).parse(req.body);

      if (!process.env.OPENAI_API_KEY) {
        res.status(500).json({ message: "OpenAI API not configured" });
        return;
      }

      // Get user context from intake if available
      let userContext = undefined;
      if (userId) {
        const intakeResponse = await storage.getIntakeResponseByUserId(userId);
        if (intakeResponse) {
          userContext = {
            question1: intakeResponse.question1,
            question2: intakeResponse.question2,
            question3: intakeResponse.question3,
            question4: intakeResponse.question4,
            question5: intakeResponse.question5,
          };
        }
      }

      // Analyze with OpenAI
      const analysis = await analyzeJournalEntry(journalEntry, userContext);

      // Create session record
      const sessionData = insertJournalSessionSchema.parse({
        userId: userId || null,
        journalEntry,
        detectedThoughts: analysis.detectedThoughts.map(t => t.thought),
        cognitiveDistortions: analysis.detectedThoughts.map(t => `${t.distortion}: ${t.explanation}`),
      });

      const session = await storage.createJournalSession(sessionData);

      res.json({
        sessionId: session.id,
        summary: analysis.summary,
        detectedThoughts: analysis.detectedThoughts
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        console.error("Session analysis error:", error);
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to analyze journal entry" });
      }
    }
  });

  // Get journal sessions for user
  app.get("/api/sessions/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const sessions = await storage.getJournalSessionsByUserId(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific journal session
  app.get("/api/sessions/detail/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      if (isNaN(sessionId)) {
        res.status(400).json({ message: "Invalid session ID" });
        return;
      }

      const session = await storage.getJournalSession(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
