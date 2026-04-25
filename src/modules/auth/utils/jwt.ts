import jwt from 'jsonwebtoken';

export function _generateJwtToken(payload: any, secret: string, opts: jwt.SignOptions) {
  return jwt.sign(payload, secret, opts);
}

export function _verifyJwtToken(token: string, secret: string) {
  return jwt.verify(token, secret);
}

export function _decodeJwtToken(token: string) {
  return jwt.decode(token);
}
