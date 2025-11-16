import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import surveyRoutes from './routes/surveys';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);

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