import type { Express } from "express";
import type { Server } from "http";
import { registerInventoryRoutes } from "./routes/inventory";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerInventoryRoutes(app);
  return httpServer;
}
