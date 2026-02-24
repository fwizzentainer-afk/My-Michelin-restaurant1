import path from "path"
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Dispositivo conectado:", socket.id);

  socket.on("novo-pedido", (pedido) => {
    console.log("Pedido recebido:", pedido);
    io.emit("pedido-recebido", pedido);
  });

  socket.on("disconnect", () => {
    console.log("Dispositivo desconectado");
  });
}); // Servir React build
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log("Servidor rodando");
});
