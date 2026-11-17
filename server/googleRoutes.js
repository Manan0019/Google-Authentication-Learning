
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";

import {
  findOrCreateGoogleUser,
  AccountLinkRequiredError,
} from "./googleUserRepository.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID");
}

const googleClient = new OAuth2Client();

// Convert database user into safe API response
function publicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    dateOfBirth: user.date_of_birth,
    profilePicture: user.profile_picture_url,
    createdAt: user.created_at,
  };
}

router.post("/google", async (req, res) => {
  const { credential } = req.body ?? {};

  if (
    typeof credential !== "string" ||
    !credential ||
    credential.length > 12000
  ) {
    return res.status(400).json({
      error: "A valid Google credential is required.",
    });
  }

  // Step 1: Verify Google's signed identity token
  let payload;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    payload = ticket.getPayload();

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        error: "Google account identity could not be verified.",
      });
    }
  } catch (error) {
    console.error("Google token verification failed:", error.message);

    return res.status(401).json({
      error: "Invalid or expired Google credential.",
    });
  }

  // Step 2: Resolve the application account
  let result;

  try {
    result = await findOrCreateGoogleUser({
      googleSub: payload.sub,
      email: payload.email.trim().toLowerCase(),
      firstName: payload.given_name || payload.name || "Google",
      lastName: payload.family_name || "",
      picture: payload.picture || null,
    });
  } catch (error) {
    if (error instanceof AccountLinkRequiredError) {
      return res.status(409).json({
        error: error.message,
        code: "ACCOUNT_LINK_REQUIRED",
      });
    }

    console.error("Google user database error:", error);

    return res.status(500).json({
      error: "Unable to create or find Google account.",
    });
  }

  // Step 3: Create the same session as password login
  req.session.regenerate((regenerateError) => {
    if (regenerateError) {
      console.error("Google session regeneration failed:", regenerateError);

      return res.status(500).json({
        error: "Unable to establish session.",
      });
    }

    req.session.userId = String(result.user.id);

    req.session.save((saveError) => {
      if (saveError) {
        console.error("Google session save failed:", saveError);

        return res.status(500).json({
          error: "Unable to save session.",
        });
      }

      return res.status(200).json({
        message: result.isNewUser
          ? "Google account created successfully."
          : "Welcome back!",

        isNewUser: result.isNewUser,

        user: publicUser(result.user),
      });
    });
  });
});

export default router;
