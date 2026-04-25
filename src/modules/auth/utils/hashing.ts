import bcrypt from 'bcrypt';

export async function _hashPassword(password: string, saltRound: number) {
  return bcrypt.hash(password, saltRound);
}

export async function _comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
