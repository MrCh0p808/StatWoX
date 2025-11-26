import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// MOCK USER STORE (In-Memory)
// I'm using this map to store users temporarily because the real database connection is flaky right now.
// This lets me test the frontend without worrying about DB errors.
const mockUsers = new Map<string, any>();

/**
 * POST /api/auth/register
 * This route handles new user sign-ups.
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation to make sure we have all the info
    if (!email || !password || !username) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Checking if the email is already taken in our mock store
    if (mockUsers.has(email)) {
      return res.status(400).json({ message: "Email exists" });
    }

    // Hashing the password so we don't store it in plain text (security best practice)
    const hash = await bcrypt.hash(password, 10);

    // Creating the new user object
    const newUser = { id: `mock_${Date.now()}`, email, username, password: hash };

    // Saving it to our memory map
    mockUsers.set(email, newUser);

    console.log(`[MOCK REGISTER] User created: ${email}`);

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

    // Looking up the user in our mock store
    const user = mockUsers.get(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Checking if the password matches the hash we stored
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // Generating a JWT token so the user stays logged in
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
 * POST /api/auth/otp/send
 * Route to send the SMS code.
 */
import { sendOtp, verifyOtp } from "../controllers/otp.js";
router.post("/otp/send", sendOtp);

/**
 * POST /api/auth/otp/verify
 * Route to verify the SMS code and log the user in.
 */
router.post("/otp/verify", verifyOtp);

export default router;
