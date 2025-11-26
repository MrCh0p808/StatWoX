import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    // support both token shapes (legacy 'sub' and new 'userId')
    const userId = decoded.userId || decoded.sub;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    // augment request
    (req as any).userId = userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
// This middleware checks for a valid JWT in the Authorization header.