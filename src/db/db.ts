import fs from 'fs';
import path from 'path';

// Store in database.json instead of sqlite binary to guarantee 100% portable environment support
const dbPath = path.join(process.cwd(), 'database.json');

interface Schema {
  config: Record<string, string>;
  progress: Array<{ day_id: number; completed_at: string }>;
  notifications: Array<{ id: number; missed_count: number; status_message: string; checked_at: string }>;
}

let inMemoryData: Schema = {
  config: {},
  progress: [],
  notifications: []
};

// Open/Create the JSON Database
function initFileDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf-8');
      inMemoryData = JSON.parse(content);
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

// Promise wrapper for database running commands (INSERT, UPDATE, DELETE)
export async function dbRun(sql: string, params: any[] = []): Promise<void> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  if (norm.startsWith('create table')) {
    // Schema creation is fully mocked and safe
    return;
  }

  if (norm.startsWith('insert into progress')) {
    const day_id = Number(params[0]);
    const completed_at = String(params[1]);
    
    inMemoryData.progress = inMemoryData.progress.filter(p => p.day_id !== day_id);
    inMemoryData.progress.push({ day_id, completed_at });
    saveToDisk();
    return;
  }

  if (norm.startsWith('delete from progress')) {
    if (norm.includes('where day_id =')) {
      const day_id = Number(params[0]);
      inMemoryData.progress = inMemoryData.progress.filter(p => p.day_id !== day_id);
    } else {
      inMemoryData.progress = [];
    }
    saveToDisk();
    return;
  }

  if (norm.startsWith('update config')) {
    const value = String(params[0]);
    const key = String(params[1]);
    inMemoryData.config[key] = value;
    saveToDisk();
    return;
  }

  if (norm.startsWith('insert into config')) {
    const key = String(params[0]);
    const value = String(params[1]);
    inMemoryData.config[key] = value;
    saveToDisk();
    return;
  }

  if (norm.startsWith('insert into notifications')) {
    const missed_count = Number(params[0]);
    const status_message = String(params[1]);
    const checked_at = String(params[2]);

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
    saveToDisk();
    return;
  }

  console.warn('[JSON DB - Run - Unsupported SQL statement]:', sql, params);
}

// Promise wrapper for retrieving a single row
export async function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  if (norm.startsWith('select value from config where key =')) {
    const key = String(params[0]);
    const val = inMemoryData.config[key];
    if (val !== undefined) {
      return { value: val } as unknown as T;
    }
    return undefined;
  }

  if (norm.startsWith('select day_id from progress where day_id =')) {
    const day_id = Number(params[0]);
    const found = inMemoryData.progress.find(p => p.day_id === day_id);
    if (found) {
      return { day_id: found.day_id } as unknown as T;
    }
    return undefined;
  }

  if (norm.startsWith('select missed_count, status_message, checked_at from notifications')) {
    if (inMemoryData.notifications.length > 0) {
      const last = inMemoryData.notifications[inMemoryData.notifications.length - 1];
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
export async function dbAll<T>(sql: string, params: any[] = []): Promise<T[]> {
  const norm = sql.trim().toLowerCase().replace(/\s+/g, ' ');

  if (norm.startsWith('select day_id from progress')) {
    return inMemoryData.progress.map(p => ({ day_id: p.day_id })) as unknown as T[];
  }

  console.warn('[JSON DB - All - Unsupported SQL Query]:', sql, params);
  return [];
}

