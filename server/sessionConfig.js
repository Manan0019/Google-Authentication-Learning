import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db.js";

const PgSession = connectPgSimple(session);

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

const sessionStore = new PgSession({
  pool,
  tableName: "user_sessions",
  schemaName: "public",
  createTableIfMissing: false,
  pruneSessionInterval: 60 * 15,
});

export const sessionMiddleware = session({
  name: isProduction ? "__Host-auth.sid" : "auth.sid",

  secret: process.env.SESSION_SECRET,

  store: sessionStore,

  resave: false,

  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24,
  },
});
