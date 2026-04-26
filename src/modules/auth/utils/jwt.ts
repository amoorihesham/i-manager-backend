import jwt from 'jsonwebtoken';
import type { jwtPayloadType } from '../types/index.js';

export function _generateJwtToken(payload: jwtPayloadType, secret: string, opts: jwt.SignOptions): string {
  return jwt.sign(payload, secret, opts);
}

export function _verifyJwtToken(token: string, secret: string): string | jwtPayloadType {
  return jwt.verify(token, secret) as string | jwtPayloadType;
}

export function _decodeJwtToken(token: string): string | jwtPayloadType | null {
  return jwt.decode(token) as string | jwtPayloadType | null;
}
