import { Router } from "express";
import argon2 from "argon2";
import { pool } from "./db.js";

const router = Router();

router.post("/signup", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    dateOfBirth,
    password,
    confirmPassword,
  } = req.body ?? {};

  // 1. Validate submitted input
  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof email !== "string" ||
    typeof dateOfBirth !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return res.status(400).json({
      error: "All registration fields are required.",
    });
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (
    !cleanFirstName ||
    !cleanLastName ||
    cleanFirstName.length > 100 ||
    cleanLastName.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanEmail.length > 320
  ) {
    return res.status(400).json({
      error: "Please enter valid name and email details.",
    });
  }

  // Validate calendar date and reject future DOB.
  const dobPattern = /^\d{4}-\d{2}-\d{2}$/;
  const parsedDob = new Date(`${dateOfBirth}T00:00:00Z`);
  const today = new Date().toISOString().slice(0, 10);

  if (
    !dobPattern.test(dateOfBirth) ||
    Number.isNaN(parsedDob.getTime()) ||
    parsedDob.toISOString().slice(0, 10) !== dateOfBirth ||
    dateOfBirth > today
  ) {
    return res.status(400).json({
      error: "Please enter a valid date of birth.",
    });
  }

  const passwordBytes = Buffer.byteLength(password, "utf8");

  if (
    password.length < 12 ||
    passwordBytes > 1024
  ) {
    return res.status(400).json({
      error: "Password must be at least 12 characters and within the size limit.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      error: "Passwords do not match.",
    });
  }

  let client;

  try {
    // 2. Hash password before storing it
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    // 3. Acquire a database connection
    client = await pool.connect();

    // 4. Start a transaction
    await client.query("BEGIN");

    // 5. Insert profile
    const userResult = await client.query(
      `
      INSERT INTO public.app_users
        (first_name, last_name, email, date_of_birth)
      VALUES ($1, $2, $3, $4)
      RETURNING id, first_name, last_name, email, date_of_birth
      `,
      [
        cleanFirstName,
        cleanLastName,
        cleanEmail,
        dateOfBirth,
      ]
    );

    const user = userResult.rows[0];

    // 6. Store the password hash
    await client.query(
      `
      INSERT INTO public.password_credentials
        (user_id, password_hash)
      VALUES ($1, $2)
      `,
      [user.id, passwordHash]
    );

    // 7. Commit both changes
    await client.query("COMMIT");

    return res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    if (
      error.code === "23505" &&
      error.constraint === "app_users_email_unique"
    ) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Signup failed:", error);

    return res.status(500).json({
      error: "Unable to create account.",
    });
  } finally {
    if (client) client.release();
  }
});

export default router;