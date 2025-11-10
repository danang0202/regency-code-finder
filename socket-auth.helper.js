// Auth helper for Socket.IO (simplified JS version)
import { readFile } from "fs/promises";
import path from "path";

const AUTH_DB_PATH = path.join(process.cwd(), "storage", "auth.json");

// Read auth database
async function readAuthDatabase() {
  try {
    const data = await readFile(AUTH_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [], sessions: {} };
  }
}

// Get session
export async function getSession(sessionId) {
  const db = await readAuthDatabase();
  return db.sessions[sessionId] || null;
}