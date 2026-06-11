import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { router } from "./routes/index.js";

const app = express();

const productionOrigins = [
  "https://www.zeladoriacoopatos.com.br",
  "https://zeladoriacoopatos.com.br",
  "https://zeladoria-coopatos.vercel.app",
  "https://zeladoria-coopatos-app.vercel.app",
];

const configuredOrigins = [
  ...productionOrigins,
  process.env.PUBLIC_APP_URL,
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGINS,
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
]
  .filter(Boolean)
  .flatMap((origin) => String(origin).split(","))
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

//teste//z

const isAllowedOrigin = (origin: string) => {
  const normalizedOrigin = origin.replace(/\/$/, "");

  return (
    configuredOrigins.includes(normalizedOrigin) ||
    /^https:\/\/[a-z0-9-]+(?:-[a-z0-9-]+)*\.vercel\.app$/i.test(normalizedOrigin)
  );
};

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(null, isAllowedOrigin(origin));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Admin-Id",
    "X-Admin-Session-Token",
  ],
};

app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const server = http.createServer(app);

export const onlineEmployees = new Map<number, string>();

export const io = new Server(server, {
  cors: corsOptions,
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
