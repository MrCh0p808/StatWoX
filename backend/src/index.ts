import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import surveyRoutes from './routes/surveys.js';
import feedRoutes from './routes/feed.js';
import googleAuth from './routes/googleAuth.js';

// Load environment variables
dotenv.config();

const allowedOrigin = [
    "http://localhost:3000",
    "http://localhost:5173",
    process.env.ALLOWED_ORIGIN
].filter(Boolean);
const app = express();

// Middleware
app.use(cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
}));
// Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleAuth);
app.use("/api/surveys", surveyRoutes);
app.use("/api/feed", feedRoutes);

// Simple health check route
app.get('/', (req, res) => {
    res.send('StatWoX API is running!');
});

// Only start the server if this file is run directly (for local development)
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app; // Export the app