import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertIntakeResponseSchema } from "@shared/schema";
import { z } from "zod";
import { getDatabaseStatus } from "./database-status";

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

  const httpServer = createServer(app);
  return httpServer;
}
