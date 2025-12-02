import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { sendOtp, verifyOtp } from "../controllers/otp.js";
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// MOCK USER STORE REMOVED
// We are now using the real database via Prisma.

/**
 * POST /api/auth/register
 * This route handles new user sign-ups.
 */
// POST /api/auth/google
// body: { credential: "<id_token from client>" }
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    // Verify using Google's tokeninfo endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const resp = await axios.get(verifyUrl);
    const payload = resp.data;

    // Validate audience
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.warn("Google token audience mismatch", payload.aud);
      return res.status(401).json({ message: "Invalid Google token (aud mismatch)" });
    }

    const email = payload.email;
    const sub = payload.sub; // google user id
    if (!email || !sub) return res.status(400).json({ message: "Invalid token payload" });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0],
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for OAuth users
        }
      });
    }

    // issue JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err: any) {
    console.error("googleAuth:", err?.response?.data || err.message || err);
    return res.status(500).json({ message: "Google auth verification failed" });
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
