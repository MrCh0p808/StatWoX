import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import surveyRoutes from "./routes/surveys.js";
import feedRoutes from "./routes/feed.js";
import notificationRoutes from "./routes/notifications.js";
import googleAuth from "./routes/googleAuth.js";
import healthRoutes from "./routes/health.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuth);
app.use("/api/surveys", surveyRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", healthRoutes);

app.get('/', (req, res) => {
    res.send('StatWoX API is running!');
});

if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export default app;