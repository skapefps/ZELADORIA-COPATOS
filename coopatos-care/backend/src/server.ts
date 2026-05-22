import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { router } from "./routes/index.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  socket.on("join-report", (reportId) => {
    socket.join(`report-${reportId}`);
  });

  socket.on("leave-report", (reportId) => {
    socket.leave(`report-${reportId}`);
  });
});

app.use(router);

const PORT = Number(process.env.PORT) || 3333;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});