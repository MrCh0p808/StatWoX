import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { sendOtp, verifyOtp } from "../controllers/otp.js";

const router = Router();
const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// MOCK USER STORE REMOVED
// We are now using the real database via Prisma.

/**
 * POST /api/auth/register
 * This route handles new user sign-ups.
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // check required fields
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" });
    }

    // hash password
    const hash = await bcrypt.hash(password, 10);

    // create user
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hash,
      },
    });

    console.log(`[REGISTER] User created: ${email} (${newUser.id})`);

    return res.status(201).json({ id: newUser.id });
  } catch (err: any) {
    console.error("register:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/login
 * This route handles user login.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (err: any) {
    console.error("login:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/google
 * Handles Google OAuth login.
 */
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    // verify token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ message: "Invalid token" });

    const { email, name, sub: googleId } = payload;

    // find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // create new user
      // password is required by schema, so generate a random one
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await prisma.user.create({
        data: {
          email,
          username: name || `user_${googleId.slice(-4)}`,
          password: randomPassword,
        },
      });
    }

    // generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (err: any) {
    console.error("google login:", err);
    res.status(500).json({ message: "Google login failed" });
  }
});

/**
 * POST /api/auth/otp/send
 * Route to send the SMS code.
 */
router.post("/otp/send", sendOtp);

/**
 * POST /api/auth/otp/verify
 * Route to verify the SMS code and log the user in.
 */
router.post("/otp/verify", verifyOtp);

export default router;
