
import { pool } from "./db.js";

export class AccountLinkRequiredError extends Error {
  constructor() {
    super("An account with this email already exists. Sign in with your existing method.");
    this.name = "AccountLinkRequiredError";
  }
}

export async function findOrCreateGoogleUser(profile) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Find an existing Google identity by sub
    const linkedResult = await client.query(
      `
      SELECT u.id, u.first_name, u.last_name,
             u.email, u.date_of_birth,
             u.profile_picture_url, u.created_at
      FROM public.google_accounts AS g
      JOIN public.app_users AS u ON u.id = g.user_id
      WHERE g.google_sub = $1
      `,
      [profile.googleSub]
    );

    if (linkedResult.rows.length > 0) {
      const user = linkedResult.rows[0];

      await client.query("COMMIT");

      return {
        user,
        isNewUser: false,
      };
    }

    // 2. Do not automatically merge existing email accounts
    const emailResult = await client.query(
      `
      SELECT id
      FROM public.app_users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [profile.email]
    );

    if (emailResult.rows.length > 0) {
      throw new AccountLinkRequiredError();
    }

    // 3. Create a shared application profile
    const userResult = await client.query(
      `
      INSERT INTO public.app_users (
        first_name,
        last_name,
        email,
        profile_picture_url,
        date_of_birth
      )
      VALUES ($1, $2, $3, $4, NULL)
      RETURNING id, first_name, last_name,
                email, date_of_birth,
                profile_picture_url, created_at
      `,
      [
        profile.firstName,
        profile.lastName,
        profile.email,
        profile.picture,
      ]
    );

    const user = userResult.rows[0];

    // 4. Link verified Google identity
    await client.query(
      `
      INSERT INTO public.google_accounts
        (google_sub, user_id)
      VALUES ($1, $2)
      `,
      [profile.googleSub, user.id]
    );

    await client.query("COMMIT");

    return {
      user,
      isNewUser: true,
    };
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Google account rollback failed:", rollbackError);
    }

    // Concurrent registrations can encounter a unique constraint.
    // Retry Google login rather than automatically merging users.
    if (error.code === "23505") {
      throw new AccountLinkRequiredError();
    }

    throw error;
  } finally {
    client.release();
  }
}
