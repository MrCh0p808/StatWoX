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

// Google Auth: Verify token and return JWT
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "Missing credential" });

    // Verify via Google tokeninfo
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
    const resp = await axios.get(verifyUrl);
    const payload = resp.data;

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      console.warn("Audience mismatch", payload.aud);
      return res.status(401).json({ message: "Invalid token audience" });
    }

    const { email, sub } = payload;
    if (!email || !sub) return res.status(400).json({ message: "Invalid payload" });

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: email.split("@")[0],
          password: await bcrypt.hash(Math.random().toString(36), 10),
        }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    return res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err: any) {
    console.error("Google auth error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Verification failed" });
  }
});

// Standard Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, username, password: hash },
    });

    return res.status(201).json({ id: newUser.id });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// OTP Routes
router.post("/otp/send", sendOtp);
router.post("/otp/verify", verifyOtp);

export default router;
