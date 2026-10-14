import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

// Authentication middleware
function requireAuthentication(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: "You must be logged in.",
    });
  }

  next();
}


function validateProfile(body) {
  const {
    firstName,
    lastName,
    dateOfBirth,
  } = body ?? {};

  if (
    typeof firstName !== "string" ||
    typeof lastName !== "string"
  ) {
    return {
      error: "First name and last name are required.",
    };
  }

  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();

  if (
    !cleanFirstName ||
    !cleanLastName ||
    cleanFirstName.length > 100 ||
    cleanLastName.length > 100
  ) {
    return {
      error: "Names must contain 1 to 100 characters.",
    };
  }

  let cleanDob = null;

  if (dateOfBirth !== null &&
      dateOfBirth !== undefined &&
      dateOfBirth !== "") {

    if (
      typeof dateOfBirth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)
    ) {
      return { error: "Invalid date of birth." };
    }

    const parsed = new Date(`${dateOfBirth}T00:00:00Z`);
    const today = new Date().toISOString().slice(0, 10);

    if (
      Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== dateOfBirth ||
      dateOfBirth > today
    ) {
      return { error: "Invalid date of birth." };
    }

    cleanDob = dateOfBirth;
  }

  return {
    value: {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      dateOfBirth: cleanDob,
    },
  };
}


// Protected profile endpoint
router.get("/me", requireAuthentication, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        first_name,
        last_name,
        email,
        date_of_birth,
        profile_picture_url,
        created_at
      FROM public.app_users
      WHERE id = $1
      `,
      [req.session.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "User account no longer exists.",
      });
    }

    console.log("DOB from database:", user.date_of_birth);
    console.log("DOB ISO:", user.date_of_birth?.toISOString?.());
    console.log("DOB type:", typeof user.date_of_birth);
    console.log("DOB JSON:", JSON.stringify(user.date_of_birth));

    return res.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        dateOfBirth: user.date_of_birth,
        profilePicture: user.profile_picture_url,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Profile fetch failed:", error);

    return res.status(500).json({
      error: "Unable to load profile.",
    });
  }
});


router.patch(
  "/me",
  requireAuthentication,
  async (req, res) => {

    if (!req.is("application/json")) {
      return res.status(415).json({
        error: "Content-Type must be application/json.",
      });
    }

    const validation = validateProfile(req.body);

    if (validation.error) {
      return res.status(400).json({
        error: validation.error,
      });
    }

    const {
      firstName,
      lastName,
      dateOfBirth,
    } = validation.value;

    try {
      const result = await pool.query(
        `
        UPDATE public.app_users
        SET
          first_name = $1,
          last_name = $2,
          date_of_birth = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING
          id,
          first_name,
          last_name,
          email,
          date_of_birth,
          profile_picture_url,
          created_at
        `,
        [
          firstName,
          lastName,
          dateOfBirth,
          req.session.userId,
        ]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(404).json({
          error: "User profile not found.",
        });
      }

      return res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          dateOfBirth: user.date_of_birth,
          profilePicture: user.profile_picture_url,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      console.error("Profile update failed:", error);

      return res.status(500).json({
        error: "Unable to update profile.",
      });
    }
  }
);

export default router;
