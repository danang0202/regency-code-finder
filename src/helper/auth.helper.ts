import { readFile, writeFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserSession {
  id: string;
  username: string;
  email: string;
  loginAt: string;
}

export interface AuthDatabase {
  users: User[];
  sessions: { [sessionId: string]: UserSession };
}

const AUTH_DB_PATH = path.join(process.cwd(), "storage", "auth.json");

// Initialize auth database
export async function initAuthDatabase(): Promise<void> {
  try {
    await readFile(AUTH_DB_PATH, "utf-8");
  } catch {
    const initialDb: AuthDatabase = {
      users: [],
      sessions: {}
    };
    await ensureStorageDir();
    await writeFile(AUTH_DB_PATH, JSON.stringify(initialDb, null, 2));
  }
}

// Ensure storage directory exists
async function ensureStorageDir(): Promise<void> {
  const storageDir = path.join(process.cwd(), "storage");
  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(storageDir, { recursive: true });
  } catch {
    // Directory already exists
  }
}

// Read auth database
export async function readAuthDatabase(): Promise<AuthDatabase> {
  await initAuthDatabase();
  const data = await readFile(AUTH_DB_PATH, "utf-8");
  return JSON.parse(data);
}

// Write auth database
export async function writeAuthDatabase(db: AuthDatabase): Promise<void> {
  await writeFile(AUTH_DB_PATH, JSON.stringify(db, null, 2));
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate session ID
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Generate user ID
export function generateUserId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Find user by username or email
export async function findUserByCredential(credential: string): Promise<User | null> {
  const db = await readAuthDatabase();
  return db.users.find(user => 
    user.username === credential || user.email === credential
  ) || null;
}

// Find user by ID
export async function findUserById(id: string): Promise<User | null> {
  const db = await readAuthDatabase();
  return db.users.find(user => user.id === id) || null;
}

// Create new user
export async function createUser(username: string, email: string, password: string): Promise<User> {
  const db = await readAuthDatabase();
  
  // Check if user already exists
  const existingUser = await findUserByCredential(username) || await findUserByCredential(email);
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);
  const newUser: User = {
    id: generateUserId(),
    username,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await writeAuthDatabase(db);
  
  return newUser;
}

// Create user session
export async function createSession(user: User): Promise<string> {
  const db = await readAuthDatabase();
  const sessionId = generateSessionId();
  
  const session: UserSession = {
    id: user.id,
    username: user.username,
    email: user.email,
    loginAt: new Date().toISOString()
  };

  db.sessions[sessionId] = session;
  
  // Update user's last login
  const userIndex = db.users.findIndex(u => u.id === user.id);
  if (userIndex !== -1) {
    db.users[userIndex].lastLoginAt = new Date().toISOString();
  }
  
  await writeAuthDatabase(db);
  return sessionId;
}

// Get session
export async function getSession(sessionId: string): Promise<UserSession | null> {
  const db = await readAuthDatabase();
  return db.sessions[sessionId] || null;
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await readAuthDatabase();
  delete db.sessions[sessionId];
  await writeAuthDatabase(db);
}

// Validate login credentials
export async function validateLogin(credential: string, password: string): Promise<User | null> {
  const user = await findUserByCredential(credential);
  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return null;
  }

  return user;
}

// Get all active sessions (for admin purposes)
export async function getActiveSessions(): Promise<UserSession[]> {
  const db = await readAuthDatabase();
  return Object.values(db.sessions);
}

// Clean up expired sessions (optional, can be called periodically)
export async function cleanupExpiredSessions(maxAgeHours: number = 24): Promise<void> {
  const db = await readAuthDatabase();
  const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
  
  Object.keys(db.sessions).forEach(sessionId => {
    const session = db.sessions[sessionId];
    if (new Date(session.loginAt) < cutoffTime) {
      delete db.sessions[sessionId];
    }
  });
  
  await writeAuthDatabase(db);
}