import { env } from '@/config/env.js';
import bcrypt from 'bcrypt';

export async function _hashPassword(password: string) {
  return bcrypt.hash(password, env.SALT_ROUND);
}

export async function _comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
