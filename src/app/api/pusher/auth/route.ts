import { NextRequest, NextResponse } from 'next/server'
import Pusher from 'pusher'
import { extractTokenFromHeader, getUserFromToken } from '@/lib/auth'
import { db } from '@/lib/db'

const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
    useTLS: true,
})

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        const token = extractTokenFromHeader(authHeader)

        let user = null;
        if (token) {
            user = await getUserFromToken(token);
        }

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.formData()
        const socketId = body.get('socket_id') as string
        const channel = body.get('channel_name') as string

        if (!socketId || !channel) {
            return NextResponse.json(
                { error: 'Missing socket_id or channel_name' },
                { status: 400 }
            )
        }

        const userId = user.id

        // Presence channel - all authenticated users can join
        if (channel.startsWith('presence-')) {
            const authResponse = pusher.authorizeChannel(socketId, channel, {
                user_id: userId,
                user_info: {
                    name: user.name || 'Anonymous',
                    avatarUrl: user.image,
                },
            })
            return NextResponse.json(authResponse)
        }

        // Private user channels - only the user can access their own
        if (channel.startsWith('private-user-')) {
            const channelUserId = channel.replace('private-user-', '').replace('-notifications', '').replace('-messages', '')

            if (channelUserId !== userId) {
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 }
                )
            }

            const authResponse = pusher.authorizeChannel(socketId, channel)
            return NextResponse.json(authResponse)
        }

        // Survey channels - verify ownership for private surveys
        if (channel.startsWith('private-survey-')) {
            const surveyId = channel.replace('private-survey-', '')
            const survey = await db.survey.findUnique({
                where: { id: surveyId },
                select: { authorId: true, isPublic: true }
            })

            if (!survey) {
                return NextResponse.json(
                    { error: 'Survey not found' },
                    { status: 404 }
                )
            }

            if (!survey.isPublic && survey.authorId !== userId) {
                return NextResponse.json(
                    { error: 'Forbidden' },
                    { status: 403 }
                )
            }

            const authResponse = pusher.authorizeChannel(socketId, channel)
            return NextResponse.json(authResponse)
        }

        return NextResponse.json(
            { error: 'Unauthorized channel' },
            { status: 403 }
        )
    } catch (error) {
        console.error('Pusher auth error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

