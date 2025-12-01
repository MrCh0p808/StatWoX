import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// extending request to add userId
// so other parts know who's calling
export interface AuthRequest extends ExpressRequest {
    userId?: string;
}

// middleware to check if user is logged in
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // expect token in auth header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // no token, no pass
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    // get the token string
    const token = authHeader.split(' ')[1];

    try {
        // verify token with secret
        // if valid, get the data inside
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        // attach userId to request
        req.userId = decoded.userId;

        // move on
        next();
    } catch (error) {
        // fake or expired token
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};