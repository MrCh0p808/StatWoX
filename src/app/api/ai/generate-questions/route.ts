import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { generateQuestions } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const body = await request.json();
        const { topic, targetAudience, questionCount, questionTypes } = body;

        if (!topic?.trim()) {
            return NextResponse.json({ success: false, message: 'Topic is required' }, { status: 400 });
        }

        const questions = await generateQuestions(
            topic.trim(),
            targetAudience || 'general',
            Math.min(questionCount || 5, 15),
            questionTypes
        );

        return NextResponse.json({ success: true, data: { questions } });
    } catch (error: any) {
        console.error('AI generate error:', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'AI generation failed'
        }, { status: 500 });
    }
}
