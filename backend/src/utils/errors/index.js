import { StatusCodes } from 'http-status-codes';

class CustomAPIError extends Error {
  constructor(message) {
    super(message);
  }
}

export class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST; // 400
  }
}

export class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND; // 404
  }
}

export class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED; // 401
  }
}

export class ServiceUnavailableError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.SERVICE_UNAVAILABLE; // 503
  }
}

export default CustomAPIError;
