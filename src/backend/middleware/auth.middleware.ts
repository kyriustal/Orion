import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config/jwt';

// Estendendo o Request do Express para incluir o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        org_id: string;
        role: string;
        email: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado. Token ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      org_id: decoded.org_id,
      role: decoded.role,
      email: decoded.email
    };
    return next();
  } catch (err: any) {
    console.error('JWT AUTH ERROR:', err.message);
    return res.status(401).json({
      error: 'Token inválido ou expirado.',
      details: err.message,
      code: err.name // ex: TokenExpiredError, JsonWebTokenError
    });
  }
};
