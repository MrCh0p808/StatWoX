import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth';
import { db } from '@/lib/db';
import QRCode from 'qrcode';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        const user = await getUserFromToken(token);
        if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 });

        const survey = await db.survey.findUnique({ where: { id } });
        if (!survey) return NextResponse.json({ success: false, message: 'Survey not found' }, { status: 404 });
        if (survey.authorId !== user.id) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const surveyUrl = `${appUrl}/responder/${id}`;

        // Generate QR code as data URL (free, no external service)
        const qrDataUrl = await QRCode.toDataURL(surveyUrl, {
            width: 512,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        // Cache the QR code URL
        await db.survey.update({
            where: { id },
            data: { qrCodeUrl: qrDataUrl }
        });

        return NextResponse.json({
            success: true,
            data: { qrCode: qrDataUrl, surveyUrl }
        });
    } catch (error) {
        console.error('QR code error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
