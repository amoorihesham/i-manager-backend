import type { Database } from '@/db/connection.js';

export const authService = (db: Database): { register: () => Promise<void>; login: () => Promise<void> } => ({
  register: async () => {},
  login: async () => {},
});
