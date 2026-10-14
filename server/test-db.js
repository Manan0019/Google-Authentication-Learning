import { pool } from "./db.js";

try {
  const result = await pool.query(`
    SELECT
      current_database() AS database,
      current_user AS username,
      COUNT(*) AS total_users
    FROM users
  `);

  console.log("DATABASE CONNECTION SUCCESSFUL");
  console.table(result.rows);
} catch (error) {
  console.error("DATABASE CONNECTION FAILED");
  console.error(error.message);

  process.exitCode = 1;
} finally {
  await pool.end();
}
