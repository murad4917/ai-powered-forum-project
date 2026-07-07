import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../utils/errors/index.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};
