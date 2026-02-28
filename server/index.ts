import path from "path";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Socket.io handlers - registered only once
io.on("connection", (socket) => {
  console.log("Dispositivo conectado:", socket.id);

  socket.on("novo-pedido", (pedido) => {
    console.log("Pedido recebido:", pedido);
    io.emit("pedido-recebido", pedido);
  });

  socket.on("disconnect", () => {
    console.log("Dispositivo desconectado");
  });
});

const PORT = parseInt(process.env.PORT || "3000", 10);
const isDev = process.env.NODE_ENV !== "production";

async function setupRoutes() {
  // Import routes
  try {
    const { registerRoutes } = await import("./routes.js");
    await registerRoutes(httpServer, app);
    console.log("Rotas registradas");
  } catch (err) {
    console.warn("Erro ao registrar rotas:", err);
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

    app.use("/{*path}", async (req, res, next) => {
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

async function startServer() {
  try {
    await setupRoutes();

    if (isDev) {
      await setupVite();
    } else {
      await setupProduction();
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor rodando na porta ${PORT}${isDev ? " (desenvolvimento)" : " (produção)"}`);
    });

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
