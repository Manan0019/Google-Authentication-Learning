import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD",
];

for (const name of requiredVariables) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 10,
  connectionTimeoutMillis: 5000,
});
