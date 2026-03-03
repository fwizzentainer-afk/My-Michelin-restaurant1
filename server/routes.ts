import express, { type Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertMenuSchema,
  insertTableSchema,
} from "../shared/schema";

/**
 * Registers all HTTP routes under /api.
 * Uses the in-memory storage; swap it later for a DB implementation.
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const router = express.Router();
  const toPublicUser = (user: { id: string; username: string; role: string }) => ({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  const requireAuth: express.RequestHandler = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }
    next();
  };

  const requireAdmin: express.RequestHandler = async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (req.session.role === "admin") {
      return next();
    }

    // Fallback for old/stale sessions that may not have role persisted correctly.
    const user = await storage.getUser(req.session.userId);
    if (user?.role === "admin") {
      req.session.role = "admin";
      return next();
    }

    return res.status(403).json({ error: "Acesso restrito" });
  };

  // Health-check for uptime monitors and manual checks
  router.get("/health", (_req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
  });

  // Session info
  router.get("/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ error: "Sessão inválida" });
    res.json({ id: user.id, username: user.username, role: user.role });
  });

  // Auth
  router.post("/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(400).json({ error: "Informe usuário e senha" });
    }

    const user = await storage.verifyUserCredentials(username, password);
    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    req.session.userId = user.id;
    req.session.role = user.role as "admin" | "sala" | "cozinha";
    res.json({ id: user.id, username: user.username, role: user.role });
  });

  router.post("/logout", requireAuth, (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  // Create user
  router.post("/users", requireAdmin, async (req, res) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) {
      return res.status(409).json({ error: "Usuário já existe" });
    }

    const user = await storage.createUser(parsed.data);
    return res.status(201).json(toPublicUser(user));
  });

  // Fetch user by username (simple demo route)
  router.get("/users/:username", requireAdmin, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username as string);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    return res.json(toPublicUser(user));
  });

  // Menus
  router.get("/menus", requireAuth, async (_req, res) => {
    const data = await storage.listMenus();
    res.json(data);
  });

  router.post("/menus", requireAdmin, async (req, res) => {
    const parsed = insertMenuSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });
    const menu = await storage.createMenu(parsed.data);
    res.status(201).json(menu);
  });

  router.patch("/menus/:id", requireAdmin, async (req, res) => {
    const menu = await storage.updateMenu(req.params.id as string, req.body);
    if (!menu) return res.status(404).json({ error: "Menu não encontrado" });
    res.json(menu);
  });

  router.delete("/menus/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteMenu(req.params.id as string);
    if (!deleted) return res.status(404).json({ error: "Menu não encontrado" });
    res.status(204).end();
  });

  // Tables
  router.get("/tables", requireAuth, async (_req, res) => {
    const data = await storage.listTables();
    res.json(data);
  });

  router.put("/tables/:number", requireAuth, async (req, res) => {
    const body = { ...req.body, number: req.params.number as string };
    const parsed = insertTableSchema.safeParse(body);
    if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });
    const table = await storage.upsertTable(parsed.data);
    res.json(table);
  });

  app.use("/api", router);

  // API 404 handler
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
  });

  return httpServer;
}
