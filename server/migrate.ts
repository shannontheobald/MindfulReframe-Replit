import { neon } from "@neondatabase/serverless";

export async function ensureTables() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, skipping table creation");
    return; // Skip migration if no database URL
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test connection first
    await sql`SELECT 1`;
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `;
    
    // Create intake_responses table
    await sql`
      CREATE TABLE IF NOT EXISTS intake_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        question1 TEXT NOT NULL,
        question2 TEXT NOT NULL,
        question3 TEXT NOT NULL,
        question4 TEXT NOT NULL,
        question5 TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    console.log("Database tables ensured successfully");
  } catch (error) {
    console.warn("Failed to ensure database tables, continuing with in-memory storage:", error.message);
    // Don't throw error, just continue with in-memory storage
  }
}