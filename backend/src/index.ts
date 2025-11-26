import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import surveyRoutes from "./routes/surveys.js";
import feedRoutes from "./routes/feed.js";
import googleAuth from "./routes/googleAuth.js";

// Loading my environment variables from the .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Setting up CORS so my frontend can talk to this backend
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || "*", // Allowing all origins for now if not specified
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
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