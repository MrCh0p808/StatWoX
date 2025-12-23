import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";
import { sendOtp, verifyOtp } from "../controllers/otp.js";

const router = Router();
const prisma = new PrismaClient();

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
}
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// I verify the token securely with Google's library here to check who the user is
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "Missing Google credential" });

  try {
    // checking the token against my client id to make sure it's valid
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google Token: No email found" });
    }

    const { email, name, sub } = payload;

    // using upsert here so I don't need to check if the user exists first - it handles finding or creating automatically
    const user = await prisma.user.upsert({
      where: { email },
      update: {}, // if they are already here, I just log them in without changing anything
      create: {
        username: (name || "google_user").replace(/\s+/g, "") + "_" + (sub || "").slice(-5),
        email,
        password: "GOOGLE_USER_NO_PASSWORD", // setting a dummy password since they logged in with google, they can set a real one later if they want
      }
    });

    console.log(`[GOOGLE LOGIN] User: ${email} (${user.id})`);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err: any) {
    console.error("Google auth error:", err?.message || err);
    return res.status(500).json({ message: "Google OAuth failed" });
  }
});

// standard email and password login flow
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

// standard registration flow
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
