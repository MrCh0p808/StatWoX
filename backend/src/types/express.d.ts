// backend/src/types/express.d.ts
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}
// This file extends the Express Request interface to include a userId property.