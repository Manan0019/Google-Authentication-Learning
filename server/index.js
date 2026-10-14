import "dotenv/config";
import express from "express";
import cors from "cors";
import { OAuth2Client } from "google-auth-library";
import signupRoutes from "./signupRoutes.js";
import loginRoutes from "./loginRoutes.js";

const app = express();

const PORT = 4000;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID in server/.env");
}

const googleClient = new OAuth2Client();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "16kb" }));

app.use("/api/auth", signupRoutes);

app.use("/api/auth", loginRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Backend is running!",
  });
});

app.post("/api/auth/google", async (req, res) => {
  const { credential } = req.body ?? {};

  if (typeof credential !== "string" || !credential) {
    return res.status(400).json({
      error: "Google credential is required",
    });
  }

  try {
      const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub) {
      return res.status(401).json({
        error: "Google account identity is missing",
      });
    }

    return res.status(200).json({
      message: "Google identity verified",
      user: {
        googleId: payload.sub,
        name: payload.name ?? "",
        email: payload.email ?? "",
        emailVerified: payload.email_verified === true,
        picture: payload.picture ?? "",
      },
    });
  } catch (error) {
    console.error("Google verification failed:", error.message);

    return res.status(401).json({
      error: "Google ID token could not be verified",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
