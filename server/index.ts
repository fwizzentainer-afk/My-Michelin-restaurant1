import path from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import fs from "fs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import memorystore from "memorystore";
import cors from "cors";
import { ensureAdminUser, pool } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const isDev = process.env.NODE_ENV !== "production";
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (isDev && corsOrigins.length === 0) {
  corsOrigins.push("http://localhost:5000");
}

if (!isDev && corsOrigins.length === 0) {
  throw new Error("CORS_ORIGINS é obrigatório em produção");
}

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (corsOrigins.length === 0) return true;
  return corsOrigins.includes(origin);
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

const io = new Server(httpServer, {
  cors: {
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  },
});

// Socket.io handlers - registered only once
io.on("connection", (socket) => {
  console.log("Dispositivo conectado:", socket.id);

  socket.on("novo-pedido", (pedido) => {
    console.log("Pedido recebido:", pedido);
    io.emit("pedido-recebido", pedido);
  });

  socket.on("state-sync", (syncEvent) => {
    // Re-broadcast to other connected clients to keep state in sync.
    socket.broadcast.emit("state-sync", syncEvent);
  });

  socket.on("disconnect", () => {
    console.log("Dispositivo desconectado");
  });
});

const PORT = parseInt(process.env.PORT || "3000", 10);

// Session setup (PG store in prod, memory in dev)
const PgStore = connectPgSimple(session);
const MemoryStore = memorystore(session);
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "change-me",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "lax",
    secure: !isDev,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

if (!isDev && sessionConfig.secret === "change-me") {
  throw new Error("SESSION_SECRET forte é obrigatório em produção");
}

if (pool) {
  sessionConfig.store = new PgStore({ pool, tableName: "session" });
} else {
  sessionConfig.store = new MemoryStore({ checkPeriod: 86400000 });
}

app.use(session(sessionConfig));

async function setupRoutes() {
  // Import routes
  try {
    // Use extensionless import so it works in TS (dev) and compiled JS (prod)
    const { registerRoutes } = await import("./routes");
    await registerRoutes(httpServer, app);
    console.log("Rotas registradas");
  } catch (err) {
    console.error("Erro ao registrar rotas:", err);
    throw err;
  }
}

async function setupVite() {
  // Development only
  if (!isDev) return;

  try {
    const { createServer: createViteServer, createLogger } = await import("vite");
    const viteConfig = (await import("../vite.config.js")).default;

    const viteLogger = createLogger();
    const serverOptions = {
      middlewareMode: true,
      hmr: { server: httpServer, path: "/vite-hmr" },
      allowedHosts: true as const,
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
        let template = fs.readFileSync(clientTemplate, "utf-8");
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log("Vite HMR configurado para desenvolvimento");
  } catch (err) {
    console.error("Erro ao setup Vite:", err);
  }
}

async function setupProduction() {
  // Production only
  if (isDev) return;

  const distPath = path.resolve(__dirname, "..", "dist", "public");
  
  if (!fs.existsSync(distPath)) {
    console.warn(`Diretório dist não encontrado em ${distPath}`);
    // Fallback para arquivos compilados
    const clientDist = path.resolve(__dirname, "..", "client", "dist");
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.use((req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
      });
    }
    return;
  }

  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  console.log(`Arquivos estáticos servidos de ${distPath}`);
}

let serverStarted = false;

async function startServer() {
  // `startServer` may be called more than once in some hot-reload/dev setups
  // which would lead to the "already listen" error. Guard against that here.
  if (serverStarted) {
    console.warn("startServer called again; ignoring");
    return;
  }
  serverStarted = true;

  try {
    // Ensure default admin exists when credentials are provided
    if (process.env.ADMIN_PASSWORD) {
      await ensureAdminUser(
        process.env.ADMIN_USER || "admin",
        process.env.ADMIN_PASSWORD,
        "admin",
      );
    } else {
      if (isDev) {
        const devAdminUser = process.env.ADMIN_USER || "admin";
        const devAdminPassword = "admin123";
        await ensureAdminUser(devAdminUser, devAdminPassword, "admin");
        console.warn(
          `ADMIN_PASSWORD não definido - usando credenciais de desenvolvimento (${devAdminUser}/${devAdminPassword})`,
        );
      } else {
        console.warn("ADMIN_PASSWORD não definido - defina para criar o usuário admin");
      }
    }

    await setupRoutes();

    if (isDev) {
      await setupVite();
    } else {
      await setupProduction();
    }

    if (!httpServer.listening) {
      httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Servidor rodando na porta ${PORT}${isDev ? " (desenvolvimento)" : " (produção)"}`);
      });
    }

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("SIGTERM recebido, encerrando servidor...");
      httpServer.close(() => {
        console.log("Servidor encerrado");
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("Erro fatal ao iniciar servidor:", err);
    process.exit(1);
  }
}

startServer();
