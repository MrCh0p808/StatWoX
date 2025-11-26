import { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// I'm extending the default Express Request because I want to attach the 'userId' to it.
// This way, other parts of my app know who is making the request.
export interface AuthRequest extends ExpressRequest {
    userId?: string;
}

// This middleware checks if the user is logged in before letting them access protected routes.
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // I expect the token to be in the Authorization header (e.g., "Bearer <token>")
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If there's no token, I can't let them pass.
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    // Extracting the actual token string (removing "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // Verifying the token using my secret key.
        // If it's valid, it returns the data I put inside it (like userId).
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

        // Attaching the userId to the request object so the next function can use it.
        req.userId = decoded.userId;

        // Moving on to the next step!
        next();
    } catch (error) {
        // If the token is fake or expired, I reject the request.
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};