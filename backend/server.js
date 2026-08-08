import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

/* =========================================================
   1. SECURITY HEADERS (MUST BE FIRST)
   ========================================================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

/* =========================================================
   2. CORS CONFIGURATION
   ========================================================= */
const allowedOrigins = [
  "https://google-ai-interview.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Postman, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy error: Origin ${origin} not allowed.`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Explicitly handle HTTP OPTIONS preflight requests for all endpoints
app.options("*", cors(corsOptions));

/* =========================================================
   3. SOCKET.IO SETUP
   ========================================================= */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  },
});

app.set("io", io);

/* =========================================================
   4. BODY PARSERS
   ========================================================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   5. ROUTES
   ========================================================= */
app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

/* =========================================================
   6. SOCKET.IO EVENTS
   ========================================================= */
io.on("connection", (socket) => {
  console.log(`A user Connected ${socket.id}`);
  const userId = socket.handshake.query.userId;

  if (userId) {
    socket.join(userId);
    console.log(`User ${socket.id} joined room: ${userId}`);
  }

  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });
});

/* =========================================================
   7. ERROR HANDLING MIDDLEWARE
   ========================================================= */
app.use(notFound);
app.use(errorHandler);

/* =========================================================
   8. SERVER STARTUP
   ========================================================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});