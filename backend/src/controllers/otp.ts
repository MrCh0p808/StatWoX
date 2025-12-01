import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// mock sms sender
// just printing to console to save money
const sendSms = async (phone: string, code: string) => {
    console.log(`\n[MOCK SMS] ---------------------------------------------------`);
    console.log(`[MOCK SMS] To: ${phone}`);
    console.log(`[MOCK SMS] Code: ${code}`);
    console.log(`[MOCK SMS] ---------------------------------------------------\n`);
    return true;
};

// send otp
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;

        if (!phone) {
            res.status(400).json({ message: 'Phone number is required' });
            return;
        }

        // gen 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // expires in 10 mins
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // save code to db
        await prisma.otp.create({
            data: {
                phone,
                code,
                expiresAt
            }
        });

        // "send" sms
        await sendSms(phone, code);

        // MVP Contract: return sessionId (mock) and success
        res.status(200).json({
            success: true,
            sessionId: uuidv4(),
            method: "mock",
            message: 'OTP sent successfully'
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// verify otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            res.status(400).json({ message: 'Phone and code are required' });
            return;
        }

        // MVP Contract: Accept 000000 as debug code
        let isValid = false;
        let record;

        if (code === '000000') {
            isValid = true;
        } else {
            // get valid code
            record = await prisma.otp.findFirst({
                where: {
                    phone,
                    code,
                    expiresAt: { gt: new Date() }
                },
                orderBy: { createdAt: 'desc' }
            });
            if (record) isValid = true;
        }

        if (!isValid) {
            res.status(400).json({ message: 'Invalid or expired OTP' });
            return;
        }

        // check if user exists
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
            // create new user if not found
            const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            user = await prisma.user.create({
                data: {
                    phone,
                    username: `user_${phone.slice(-4)}_${randomSuffix}`,
                    email: `${phone}@phone.statwox.com`, // placeholder
                    password: await bcrypt.hash(uuidv4(), 10) // random pass
                }
            });
        }

        // gen token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        // burn the code if it was a real one
        if (record) {
            await prisma.otp.delete({ where: { id: record.id } });
        }

        res.status(200).json({ token, user });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};
