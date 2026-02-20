import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Perform a quick lightweight database operation to verify connection
        await db.user.findFirst({ select: { id: true } });

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: process.env.npm_package_version || '1.0.0'
        }, { status: 200 });

    } catch (error) {
        console.error('Health Check Error:', error);

        return NextResponse.json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown database error'
        }, { status: 503 });
    }
}
