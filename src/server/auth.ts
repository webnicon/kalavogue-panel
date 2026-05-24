import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { LocalDB } from './db.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

// Generate token using settings JWT secret
export function generateToken(payload: { id: string; username: string; email: string; role: string }): string {
  const db = LocalDB.get();
  const secret = db.settings.jwtSecret || 'woo-admin-jwt-top-secret-key-123456789-abcde';
  const timeoutInMins = db.settings.sessionTimeout || 60;
  return jwt.sign(payload, secret, { expiresIn: `${timeoutInMins}m` });
}

// Token validation middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or invalid' });
  }

  const db = LocalDB.get();
  const secret = db.settings.jwtSecret || 'woo-admin-jwt-top-secret-key-123456789-abcde';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token expired or invalid signature' });
    }
    req.user = decoded as AuthenticatedRequest['user'];
    next();
  });
}

// Role based validation middleware generator
export function requireRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized credentials scope' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Insufficient permissions. Role '${req.user.role}' is blocked from this action.`
      });
    }

    next();
  };
}
