import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize data
  await storage.seedData();

  app.get(api.meta.get.path, async (req, res) => {
    const meta = await storage.getMeta();
    res.json(meta);
  });

  app.post(api.positions.search.path, async (req, res) => {
    try {
      const input = api.positions.search.input.parse(req.body);
      const results = await storage.searchPositions(input);
      res.json(results);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}
