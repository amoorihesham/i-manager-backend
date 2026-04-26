import { STATUS_CODES } from '@/config/constants.js';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    const { name } = this.constructor;
    this.name = name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(STATUS_CODES.NOT_FOUND, 'NOT_FOUND', message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(STATUS_CODES.BAD_REQUEST, code, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(STATUS_CODES.UNAUTHORIZED, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden') {
    super(STATUS_CODES.FORBIDDEN, 'FORBIDDEN', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(STATUS_CODES.CONFLICT, code, message);
  }
}

export class PlanLimitExceededError extends HttpError {
  public readonly upgradeUrl: string;
  constructor(message: string, upgradeUrl = '/billing/checkout') {
    super(STATUS_CODES.PAYMENT_REQUIRED, 'PLAN_LIMIT_EXCEEDED', message);
    this.upgradeUrl = upgradeUrl;
  }
}
