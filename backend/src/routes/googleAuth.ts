import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

  try {
    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google Token: No email found' });
    }

    const { email, name, sub } = payload;

    // Find or create the user in the real database
    // We use upsert to handle both cases atomically
    const user = await prisma.user.upsert({
      where: { email },
      update: {}, // If they exist, we just log them in. No updates needed for now.
      create: {
        username: (name || "google_user").replace(/\s+/g, "") + "_" + (sub || "").slice(-5),
        email,
        password: "GOOGLE_USER_NO_PASSWORD", // Placeholder, they can't login with password unless they set one
        // We could store the googleId (sub) if we added a field to the schema, but email is unique enough for now.
      }
    });

    console.log(`[GOOGLE LOGIN] User: ${email} (${user.id})`);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.json({ token });
  } catch (error: any) {
    console.error("googleAuth error:", error?.message || error);
    return res.status(500).json({ message: 'Google OAuth failed' });
  }
});

export default router;
