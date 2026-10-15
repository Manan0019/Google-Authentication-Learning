import "dotenv/config";

import express from "express";
import cors from "cors";

import signupRoutes from "./signupRoutes.js";
import loginRoutes from "./loginRoutes.js";
import googleRoutes from "./googleRoutes.js";
import logoutRoutes from "./logoutRoutes.js";
import profileRoutes from "./profileRoutes.js";

import { pool } from "./db.js";
import { sessionMiddleware } from "./sessionConfig.js";

import {
  requireTrustedOrigin,
  requireJson,
} from "./securityMiddleware.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// 1. Allow requests from our React application
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 2. Parse incoming JSON request bodies
app.use(
  express.json({
    limit: "16kb",
  })
);

// 3. Load the user's server-side session
app.use(sessionMiddleware);

// 4. Health check: verify backend and database
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      status: "ok",
      message: "Backend and database are running!",
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    return res.status(503).json({
      status: "error",
      message: "Database is unavailable.",
    });
  }
});

// 5. Protect authentication endpoints
app.use("/api/auth", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return requireTrustedOrigin(req, res, next);
  }

  next();
});

// 6. Require JSON for POST requests except logout
app.use("/api/auth", (req, res, next) => {
  if (
    req.method === "POST" &&
    req.path !== "/logout"
  ) {
    return requireJson(req, res, next);
  }

  next();
});

// 7. Authentication routes
app.use("/api/auth", signupRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/auth", googleRoutes);
app.use("/api/auth", logoutRoutes);
app.use("/api/auth", profileRoutes);

// 8. Handle unknown API routes
app.use("/api", (req, res) => {
  return res.status(404).json({
    error: "API endpoint not found.",
  });
});

// 9. Start server
app.listen(PORT, () => {
  console.log(
    `Server running at http://localhost:${PORT}`
  );
});
