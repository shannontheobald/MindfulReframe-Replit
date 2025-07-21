import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntakeResponseSchema, insertJournalSessionSchema, insertReframingSessionSchema } from "@shared/schema";
import { z } from "zod";
import { getDatabaseStatus } from "./database-status";
import { analyzeJournalEntry, chatReframe, type ChatMessage } from "./openai-service";
import { RULES } from "../shared/rules";
import { 
  validateJournalEntry, 
  hasReachedSessionLimit, 
  getSessionCapBehavior,
  hasReachedDailyTokenLimit 
} from "../shared/rule-helpers";

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

      // Validate journal entry against rules
      const validation = validateJournalEntry(journalEntry);
      if (!validation.isValid) {
        res.status(400).json({ message: validation.errors.join(", ") });
        return;
      }

      // Check session limits if user is provided
      if (userId) {
        const existingSessions = await storage.getJournalSessionsByUserId(userId);
        if (hasReachedSessionLimit(existingSessions.length)) {
          const behavior = getSessionCapBehavior();
          res.status(429).json({ 
            message: "Session limit reached. Please delete some sessions or upgrade your account.",
            sessionCount: existingSessions.length,
            maxSessions: RULES.STORAGE.SESSION_MANAGEMENT.maxSavedSessionsPerUser,
            canExport: behavior.allowExport
          });
          return;
        }
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

      // Check daily token usage (mock implementation for now - would need actual tracking)
      const userTokensUsedToday = 0; // TODO: Implement actual token tracking per user
      
      // Analyze with OpenAI
      const analysis = await analyzeJournalEntry(journalEntry, userContext, userTokensUsedToday);

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

  // ===========================
  // 💬 REFRAMING SESSION ROUTES
  // ===========================

  // Start a new reframing session
  app.post("/api/reframing/start", async (req, res) => {
    try {
      const createReframingSchema = insertReframingSessionSchema.extend({
        journalSessionId: z.number(),
        userId: z.number(),
        selectedThought: z.string().min(1),
        distortionType: z.string().min(1),
        reframingMethod: z.enum(['evidenceCheck', 'alternativePerspectives', 'balancedThinking', 'compassionateSelf', 'actionOriented']),
      });

      const validatedData = createReframingSchema.parse(req.body);

      // Apply rules validation
      const validation = validateJournalEntry(validatedData.selectedThought);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors[0] });
      }

      // Create new reframing session
      const session = await storage.createReframingSession({
        ...validatedData,
        chatHistory: [],
        isCompleted: false,
      });

      res.json({ sessionId: session.id, message: "Reframing session started successfully" });
    } catch (error) {
      console.error("Error starting reframing session:", error);
      res.status(500).json({ error: "Failed to start reframing session" });
    }
  });

  // Chat in a reframing session
  app.post("/api/reframing/:sessionId/chat", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const { message, userId } = req.body;

      if (isNaN(sessionId) || !message || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Get the reframing session
      const session = await storage.getReframingSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Reframing session not found" });
      }

      // Security: Ensure user owns this session
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (session.isCompleted) {
        return res.status(400).json({ error: "This reframing session is already completed" });
      }

      // Get user context for personalization
      const userContext = await storage.getIntakeResponseByUserId(userId);

      // Parse existing chat history
      const chatHistory: ChatMessage[] = session.chatHistory.map(msg => {
        try {
          return typeof msg === 'string' ? JSON.parse(msg) : msg;
        } catch {
          return { role: 'user', content: msg, timestamp: new Date() };
        }
      });

      // Call AI reframing service with turn tracking
      const response = await chatReframe(
        session.selectedThought,
        session.distortionType,
        session.reframingMethod,
        message,
        chatHistory,
        session.turnCount || 0,
        session.maxTurns || 12,
        userContext || undefined,
        0 // TODO: Implement token tracking per user
      );

      // Update chat history
      const newUserMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date()
      };

      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      const updatedHistory = [...chatHistory, newUserMessage, newAssistantMessage];

      // Update session with new history, turn count, and completion status
      const updates: any = {
        chatHistory: updatedHistory.map(msg => JSON.stringify(msg)),
        turnCount: (session.turnCount || 0) + 1
      };

      if (response.isComplete && response.finalReframedThought) {
        updates.isCompleted = true;
        updates.finalReframedThought = response.finalReframedThought;
        updates.completedAt = new Date();
      }

      await storage.updateReframingSession(sessionId, updates);

      res.json({
        message: response.message,
        isComplete: response.isComplete,
        finalReframedThought: response.finalReframedThought,
        nextSuggestion: response.nextSuggestion,
        showPacingOptions: response.showPacingOptions,
        reachedTurnLimit: response.reachedTurnLimit,
        turnCount: updates.turnCount,
        maxTurns: session.maxTurns || 12
      });

    } catch (error: any) {
      console.error("Error in reframing chat:", error);
      
      if (error.message?.includes("Daily AI usage limit reached")) {
        return res.status(429).json({ error: error.message });
      }
      
      res.status(500).json({ error: "Failed to process reframing chat" });
    }
  });

  // Get reframing session details
  app.get("/api/reframing/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const userId = parseInt(req.query.userId as string);

      if (isNaN(sessionId) || isNaN(userId)) {
        return res.status(400).json({ error: "Invalid session ID or user ID" });
      }

      const session = await storage.getReframingSessionById(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: "Reframing session not found" });
      }

      // Security: Ensure user owns this session
      if (session.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Parse chat history for frontend
      const chatHistory = session.chatHistory.map(msg => {
        try {
          return typeof msg === 'string' ? JSON.parse(msg) : msg;
        } catch {
          return { role: 'user', content: msg, timestamp: new Date() };
        }
      });

      res.json({
        ...session,
        chatHistory
      });
    } catch (error) {
      console.error("Error fetching reframing session:", error);
      res.status(500).json({ error: "Failed to fetch reframing session" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
