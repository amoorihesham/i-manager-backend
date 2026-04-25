import { Pool, type PoolConfig } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schemas/index.js';

export type Database = NodePgDatabase<typeof schema>;

let db: Database | null = null;

export const createDatabaseConnection = (options: PoolConfig): Database => {
  if (db === null) {
    const pool = new Pool(options);
    db = drizzle(pool, { schema });
  }

  return db;
};

export const getDatabase = (): Database => {
  if (db === null) {
    throw new Error('Database connection is not established');
  }
  return db;
};
