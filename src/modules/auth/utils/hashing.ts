import bcrypt from 'bcrypt';

export async function _hashPassword(password: string, saltRound: number): Promise<string> {
  return await bcrypt.hash(password, saltRound);
}

export async function _comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
