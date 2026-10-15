import { Router } from "express";
import argon2 from "argon2";
import { pool } from "./db.js";

const router = Router();

// A valid Argon2id hash of a dummy password.
// We'll generate this at startup so unknown emails
// still perform a real password verification.
const dummyHashPromise = argon2.hash(
  "dummy-password-never-used-for-login",
  { type: argon2.argon2id }
);

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  // Step 1: Validate the request structure
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password ||
    email.length > 320 ||
    Buffer.byteLength(password, "utf8") > 1024
  ) {
    return res.status(400).json({
      error: "Valid email and password are required.",
    });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // Step 2: Find the account and its password hash
    const result = await pool.query(
      `
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
        u.profile_picture_url,
        c.password_hash
      FROM public.app_users AS u
      INNER JOIN public.password_credentials AS c
        ON c.user_id = u.id
      WHERE LOWER(u.email) = $1
      LIMIT 1
      `,
      [cleanEmail],
    );

    const user = result.rows[0];

    // Step 3: Verify password with Argon2id
    // For unknown accounts, verify a dummy hash.
    const hashToCheck = user ? user.password_hash : await dummyHashPromise;

    const passwordValid = await argon2.verify(hashToCheck, password);

    // Step 4: Reject failed credentials
    if (!user || !passwordValid) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // Step 5: Return safe profile fields
    // Do NOT return password_hash.

    // Create a fresh session ID after authentication.
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        console.error("Session regeneration failed:", regenerateError);

        return res.status(500).json({
          error: "Unable to establish login session.",
        });
      }

      // Store only the internal user ID.
      req.session.userId = String(user.id);

      // Explicitly persist before sending success.
      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);

          return res.status(500).json({
            error: "Unable to save login session.",
          });
        }

        return res.status(200).json({
          message: "Logged in successfully.",
          user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            dateOfBirth: user.date_of_birth,
            profilePicture: user.profile_picture_url,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login verification failed:", error);

    return res.status(500).json({
      error: "Unable to process login.",
    });
  }
});

export default router;