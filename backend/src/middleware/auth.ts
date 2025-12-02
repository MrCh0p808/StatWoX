import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends ExpressRequest {
    userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token required' });
    }

    const token = authHeader.split(' ')[1];

    // Dev bypass for local testing only
    if (process.env.NODE_ENV === 'development' && token === 'dev-token-bypass') {
        req.userId = 'dev_user_id';
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};