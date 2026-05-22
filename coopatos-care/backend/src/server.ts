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

export const onlineEmployees = new Map<number, string>();

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

const emitPresenceUpdate = () => {
  io.emit("presence-updated", {
    onlineEmployeeIds: Array.from(onlineEmployees.keys()),
  });
};

io.on("connection", (socket) => {
  const employeeIdFromQuery = socket.handshake.query.employeeId;
  const employeeId = Number(employeeIdFromQuery);

  if (employeeId) {
    onlineEmployees.set(employeeId, socket.id);

    socket.join(`employee-${employeeId}`);

    emitPresenceUpdate();
  }

  socket.on("join-report", (reportId) => {
    socket.join(`report-${reportId}`);
  });

  socket.on("leave-report", (reportId) => {
    socket.leave(`report-${reportId}`);
  });

  socket.on("join-private-conversation", (conversationId) => {
  socket.join(`private-conversation-${conversationId}`);
});

socket.on("leave-private-conversation", (conversationId) => {
  socket.leave(`private-conversation-${conversationId}`);
});

  socket.on("disconnect", () => {
    if (employeeId) {
      onlineEmployees.delete(employeeId);
      emitPresenceUpdate();
    }
  });
});

app.use(router);

const PORT = Number(process.env.PORT) || 3333;

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});