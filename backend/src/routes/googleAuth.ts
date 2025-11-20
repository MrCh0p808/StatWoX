import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

router.post('/'), async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Missing Google credential' });

  try {
    // Verify the Google token
    const googleRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const { email, name, sub } = googleRes.data;

    // Check existing user
    let user = await prisma.user.findUnique({ where: { email } });

    // Create user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: name.replace(/\s+/g, "") + "_" + sub.slice(-5),
          password: "GOOGLE_USER",
        }
      });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Google OAuth failed' });
  }
});

export default router;
