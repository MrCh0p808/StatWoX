import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

  try {
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const { email, name, sub } = googleRes.data;

    // MOCK MODE: Bypassing database for now
    // let user = await prisma.user.findUnique({ where: { email } });

    // In-memory mock user creation
    const mockUser = {
      id: `mock_google_${sub}`,
      email,
      username: name.replace(/\s+/g, "") + "_" + sub.slice(-5),
      password: "GOOGLE_USER"
    };

    console.log(`[MOCK GOOGLE LOGIN] User: ${email}`);

    const token = jwt.sign(
      { userId: mockUser.id, email: mockUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (error: any) {
    console.error("googleAuth error:", error?.response?.data ?? error);
    // Even if Google fails (e.g. invalid token from localhost), let's allow login for dev testing if needed
    // UNCOMMENT BELOW TO FORCE LOGIN ON ERROR FOR TESTING
    /*
    const token = jwt.sign(
        { userId: 'mock_fallback_user', email: 'test@example.com' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
    );
    return res.json({ token });
    */
    return res.status(500).json({ message: 'Google OAuth failed' });
  }
});

export default router;
