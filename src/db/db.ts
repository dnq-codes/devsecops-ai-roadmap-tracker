import fs from 'fs';
import path from 'path';

// Store in database.json instead of sqlite binary to guarantee 100% portable environment support
const dbPath = path.join(process.cwd(), 'database.json');

export interface UserProgress {
  day_id: number;
  completed_at: string;
}

export interface UserNotification {
  id: number;
  missed_count: number;
  status_message: string;
  checked_at: string;
}

export interface UserData {
  id: string; // userId
  username: string;
  passwordHash: string; // plaintext-stored in standard DB or standard encrypted format for our lightweight server
  config: Record<string, string>;
  progress: UserProgress[];
  notifications: UserNotification[];
  aiMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface Schema {
  users: UserData[];
  config: Record<string, string>;
  progress: Array<{ day_id: number; completed_at: string }>;
  notifications: Array<{ id: number; missed_count: number; status_message: string; checked_at: string }>;
}

let inMemoryData: Schema = {
  users: [],
  config: {},
  progress: [],
  notifications: []
};

// Open/Create the JSON Database
function initFileDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(content);
      inMemoryData = {
        users: parsed.users || [],
        config: parsed.config || {},
        progress: parsed.progress || [],
        notifications: parsed.notifications || []
      };
    } else {
      saveToDisk();
    }
    console.log('[JSON FILE DB]: DB successfully loaded at:', dbPath);
  } catch (err: any) {
    console.error('[JSON FILE DB ERROR]: Failed to load database, falling back to clean state:', err.message);
  }
}

function saveToDisk() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(inMemoryData, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[JSON FILE DB SAVE ERROR]: Failed to persist state:', err.message);
  }
}

// Ensure database is initialized
initFileDb();

// User Auth helpers
export function findUserByUsername(username: string): UserData | undefined {
  return inMemoryData.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: string): UserData | undefined {
  return inMemoryData.users.find(u => u.id === id);
}

export function createUser(username: string, passwordHash: string, customId?: string): UserData {
  const newUser: UserData = {
    id: customId || 'user_' + Math.random().toString(36).substr(2, 9),
    username: username,
    passwordHash: passwordHash,
    config: {},
    progress: [],
    notifications: [],
    aiMessages: [
      {
        role: 'assistant',
        content: "👋 Welcome! I am your AI DevOps & DevSecOps Mentor. Ask me any question about today's roadmap, request a hands-on mini-lab, or trigger a self-evaluation quiz!"
      }
    ]
  };
  if (!inMemoryData.users) {
    inMemoryData.users = [];
  }
  inMemoryData.users.push(newUser);
  saveToDisk();
  return newUser;
}

export function saveUserChat(userId: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const user = inMemoryData.users.find(u => u.id === userId);
  if (user) {
    user.aiMessages = messages;
    saveToDisk();
  }
}

export function getUserChat(userId: string): Array<{ role: 'user' | 'assistant'; content: string }> {
  const user = inMemoryData.users.find(u => u.id === userId);
  return user ? user.aiMessages || [] : [];
}

// Promise wrapper for database running commands (INSERT, UPDATE, DELETE)
export async function dbRun(sql: string, params: any[] = [], userId?: string): Promise<void> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  let user: UserData | undefined;
  if (userId) {
    user = inMemoryData.users.find(u => u.id === userId);
  }

  if (norm.startsWith('create table')) {
    // Schema creation is fully mocked and safe
    return;
  }

  if (norm.startsWith('insert into progress')) {
    const day_id = Number(params[0]);
    const completed_at = String(params[1]);
    
    if (user) {
      user.progress = user.progress.filter(p => p.day_id !== day_id);
      user.progress.push({ day_id, completed_at });
    } else {
      inMemoryData.progress = inMemoryData.progress.filter(p => p.day_id !== day_id);
      inMemoryData.progress.push({ day_id, completed_at });
    }
    saveToDisk();
    return;
  }

  if (norm.startsWith('delete from progress')) {
    if (norm.includes('where day_id =')) {
      const day_id = Number(params[0]);
      if (user) {
        user.progress = user.progress.filter(p => p.day_id !== day_id);
      } else {
        inMemoryData.progress = inMemoryData.progress.filter(p => p.day_id !== day_id);
      }
    } else {
      if (user) {
        user.progress = [];
      } else {
        inMemoryData.progress = [];
      }
    }
    saveToDisk();
    return;
  }

  if (norm.startsWith('update config')) {
    const value = String(params[0]);
    const key = String(params[1]);
    if (user) {
      user.config[key] = value;
    } else {
      inMemoryData.config[key] = value;
    }
    saveToDisk();
    return;
  }

  if (norm.startsWith('insert into config')) {
    const key = String(params[0]);
    const value = String(params[1]);
    if (user) {
      user.config[key] = value;
    } else {
      inMemoryData.config[key] = value;
    }
    saveToDisk();
    return;
  }

  if (norm.startsWith('insert into notifications')) {
    const missed_count = Number(params[0]);
    const status_message = String(params[1]);
    const checked_at = String(params[2]);

    if (user) {
      const nextId = user.notifications.length > 0 
        ? Math.max(...user.notifications.map(n => n.id)) + 1 
        : 1;

      user.notifications.push({
        id: nextId,
        missed_count,
        status_message,
        checked_at
      });

      // Handle high density capping to keep database file lean
      if (user.notifications.length > 100) {
        user.notifications = user.notifications.slice(-100);
      }
    } else {
      const nextId = inMemoryData.notifications.length > 0 
        ? Math.max(...inMemoryData.notifications.map(n => n.id)) + 1 
        : 1;

      inMemoryData.notifications.push({
        id: nextId,
        missed_count,
        status_message,
        checked_at
      });

      // Handle high density capping to keep database file lean
      if (inMemoryData.notifications.length > 100) {
        inMemoryData.notifications = inMemoryData.notifications.slice(-100);
      }
    }
    saveToDisk();
    return;
  }

  console.warn('[JSON DB - Run - Unsupported SQL statement]:', sql, params);
}

// Promise wrapper for retrieving a single row
export async function dbGet<T>(sql: string, params: any[] = [], userId?: string): Promise<T | undefined> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  let targetConfig = inMemoryData.config || {};
  let targetProgress = inMemoryData.progress || [];
  let targetNotifications = inMemoryData.notifications || [];

  if (userId) {
    const user = inMemoryData.users.find(u => u.id === userId);
    if (user) {
      targetConfig = user.config;
      targetProgress = user.progress;
      targetNotifications = user.notifications;
    }
  }

  if (norm.startsWith('select value from config where key =')) {
    const key = String(params[0]);
    const val = targetConfig[key];
    if (val !== undefined) {
      return { value: val } as unknown as T;
    }
    return undefined;
  }

  if (norm.startsWith('select day_id from progress where day_id =')) {
    const day_id = Number(params[0]);
    const found = targetProgress.find(p => p.day_id === day_id);
    if (found) {
      return { day_id: found.day_id } as unknown as T;
    }
    return undefined;
  }

  if (norm.startsWith('select missed_count, status_message, checked_at from notifications')) {
    if (targetNotifications.length > 0) {
      const last = targetNotifications[targetNotifications.length - 1];
      return {
        missed_count: last.missed_count,
        status_message: last.status_message,
        checked_at: last.checked_at
      } as unknown as T;
    }
    return undefined;
  }

  console.warn('[JSON DB - Get - Unsupported SQL Query]:', sql, params);
  return undefined;
}

// Promise wrapper for retrieving all matching rows
export async function dbAll<T>(sql: string, params: any[] = [], userId?: string): Promise<T[]> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  let targetProgress = inMemoryData.progress || [];

  if (userId) {
    const user = inMemoryData.users.find(u => u.id === userId);
    if (user) {
      targetProgress = user.progress;
    }
  }

  if (norm.startsWith('select day_id from progress')) {
    return targetProgress.map(p => ({ day_id: p.day_id })) as unknown as T[];
  }

  console.warn('[JSON DB - All - Unsupported SQL Query]:', sql, params);
  return [];
}

