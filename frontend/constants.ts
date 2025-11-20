
import type { Survey } from './types';

// BACKEND NOTE: This is temporary mock data for the Home Feed.
// Later, you should create an endpoint like GET /api/feed to return this data dynamically.
export const mockPublicSurveys: { featured: Survey[], trending: Survey[], quickPolls: Survey[] } = {
    featured: [
        { id: '101', title: 'Community Gaming Habits', responses: 1205, author: 'GameDev Weekly' },
        { id: '102', title: 'Future of Remote Work', responses: 876, author: 'Workplace Insights' },
        { id: '103', title: 'Annual Developer Ecosystem', responses: 3450, author: 'CodeStack' },
    ],
    trending: [
        { id: '201', title: 'What\'s your favorite JS Framework?', responses: 982, author: 'Frontend Masters' },
        { id: '202', title: 'AI in Creative Arts: A Poll', responses: 765, author: 'ArtGen' },
        { id: '203', title: 'The Ultimate Pizza Topping Duel', responses: 5432, author: 'FoodieFun' },
    ],
    quickPolls: [
        { id: '301', title: 'Tabs vs. Spaces?', responses: 11034, author: 'DevHumor' },
        { id: '302', title: 'Is a hotdog a sandwich?', responses: 9001, author: 'The Big Questions' },
        { id: '303', title: 'Light Mode or Dark Mode?', responses: 2348, author: 'UI/UX Collective' },
    ]
};

// --- GLOBAL CONFIG ---
// BACKEND NOTE: Change this URL to point to your real backend server (e.g., http://localhost:3000 or your cloud URL).
// @ts-ignore
export const API_BASE_URL = window.STATWOX_API_URL || 'http://localhost:5000';
