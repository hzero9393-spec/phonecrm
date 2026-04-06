import { createClient, Client } from '@libsql/client';

// ============================================================
// Database connection factory
// ============================================================

const globalForDb = globalThis as unknown as { _phonecrmClient: Client | undefined };

function createLibsqlClient(): Client {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';

  if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
    return createClient({
      url: dbUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || '',
    });
  }

  // Local SQLite file via libsql
  return createClient({ url: dbUrl });
}

function getClient(): Client {
  if (process.env.NODE_ENV !== 'production') {
    if (!globalForDb._phonecrmClient) {
      globalForDb._phonecrmClient = createLibsqlClient();
    }
    return globalForDb._phonecrmClient;
  }
  return createLibsqlClient();
}

/** Get the raw libsql Client for executing SQL queries */
export function getDb(): Client {
  return getClient();
}

/** Convert SQLite boolean (0/1) to JS boolean */
export function toBool(val: unknown): boolean {
  return val === 1 || val === true || val === '1';
}

/** Convert JS boolean to SQLite boolean (0/1) */
export function fromBool(val: unknown): number {
  return val ? 1 : 0;
}
