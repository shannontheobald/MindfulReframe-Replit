import { neon } from "@neondatabase/serverless";

export interface DatabaseStatus {
  connected: boolean;
  error?: string;
  using: 'database' | 'memory';
}

let dbStatus: DatabaseStatus = {
  connected: false,
  using: 'memory'
};

export async function checkDatabaseConnection(): Promise<DatabaseStatus> {
  if (!process.env.DATABASE_URL) {
    dbStatus = {
      connected: false,
      error: 'No DATABASE_URL provided',
      using: 'memory'
    };
    return dbStatus;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;
    
    dbStatus = {
      connected: true,
      using: 'database'
    };
    
    console.log("✅ Database connection successful - using PostgreSQL");
    return dbStatus;
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown database error';
    console.log("⚠️ Database connection failed - using in-memory storage");
    console.log("Error details:", errorMessage);
    
    dbStatus = {
      connected: false,
      error: errorMessage,
      using: 'memory'
    };
    
    return dbStatus;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return dbStatus;
}