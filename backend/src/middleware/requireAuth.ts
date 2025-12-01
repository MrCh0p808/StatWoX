import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// This middleware is very similar to the other auth middleware, but it's stricter.
// It ensures that a valid token is present and that it contains a user ID.
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Grabbing the token part
  const token = authHeader.split(" ")[1];

  try {
    // Verifying the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // I support both 'userId' (my new standard) and 'sub' (standard JWT subject)
    // just in case we have old tokens floating around.
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Attaching the user ID to the request so controllers can use it
    (req as any).userId = userId;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};