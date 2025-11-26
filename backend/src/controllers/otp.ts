import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// MOCK STORAGE (In-Memory)
// This is where I store the OTP codes temporarily since the database is offline.
const mockOtpStore = new Map<string, { code: string, expiresAt: Date }>();
// This stores the user details for phone login users.
const mockUserStore = new Map<string, any>();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Mock function to send SMS
// Instead of paying for Twilio, I'm just printing the code to the console.
// This is great for testing without spending money.
const sendSms = async (phone: string, code: string) => {
    console.log(`\n[MOCK SMS] ---------------------------------------------------`);
    console.log(`[MOCK SMS] To: ${phone}`);
    console.log(`[MOCK SMS] Code: ${code}`);
    console.log(`[MOCK SMS] ---------------------------------------------------\n`);
    return true;
};

// Controller to handle sending the OTP
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone } = req.body;

        if (!phone) {
            res.status(400).json({ message: 'Phone number is required' });
            return;
        }

        // Generating a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Setting expiration to 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Saving the code to my mock store so I can check it later
        mockOtpStore.set(phone, { code, expiresAt });

        // "Sending" the SMS (printing to console)
        await sendSms(phone, code);

        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};

// Controller to verify the OTP code
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            res.status(400).json({ message: 'Phone and code are required' });
            return;
        }

        // Retrieving the stored code for this phone number
        const record = mockOtpStore.get(phone);

        if (!record) {
            res.status(400).json({ message: 'No OTP found for this number' });
            return;
        }

        // Checking if the code matches
        if (record.code !== code) {
            res.status(400).json({ message: 'Invalid code' });
            return;
        }

        // Checking if the code has expired
        if (new Date() > record.expiresAt) {
            res.status(400).json({ message: 'OTP expired' });
            return;
        }

        // Checking if this user already exists in my mock store
        let user = mockUserStore.get(phone);

        if (!user) {
            // If not, create a new mock user for them
            user = {
                id: `mock_user_${Date.now()}`,
                phone,
                username: `user_${phone.slice(-4)}`,
                email: `${phone}@phone.statwox.com`,
            };
            mockUserStore.set(phone, user);
        }

        // Generating the login token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Removing the used OTP so it can't be used again
        mockOtpStore.delete(phone);

        res.status(200).json({ token, user });
    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};
