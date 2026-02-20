import Pusher, { PresenceChannel, Members } from 'pusher-js'
import PusherServer from 'pusher'

// Client-side Pusher instance
let pusherClient: Pusher | null = null

export const getPusherClient = () => {
    if (!pusherClient && typeof window !== 'undefined') {
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

        if (!key) {
            console.warn('Pusher key not configured. Real-time features disabled.')
            return null
        }

        pusherClient = new Pusher(key, {
            cluster,
            authEndpoint: '/api/pusher/auth',
            auth: {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        })
    }
    return pusherClient
}

// Server-side Pusher instance
let pusherServer: PusherServer | null = null

export const getPusherServer = () => {
    if (!pusherServer) {
        const appId = process.env.PUSHER_APP_ID
        const key = process.env.NEXT_PUBLIC_PUSHER_KEY
        const secret = process.env.PUSHER_SECRET
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'

        if (!appId || !key || !secret) {
            console.warn('Pusher server credentials not configured.')
            return null
        }

        pusherServer = new PusherServer({
            appId,
            key,
            secret,
            cluster,
            useTLS: true,
        })
    }
    return pusherServer
}

// Channel names
export const CHANNELS = {
    SURVEY_RESPONSES: (surveyId: string) => `survey-${surveyId}`,
    USER_NOTIFICATIONS: (userId: string) => `user-${userId}-notifications`,
    USER_MESSAGES: (userId: string) => `user-${userId}-messages`,
    PRESENCE: 'presence-statwox',
} as const

// Event names
export const EVENTS = {
    NEW_RESPONSE: 'new-response',
    RESPONSE_UPDATE: 'response-update',
    NEW_NOTIFICATION: 'new-notification',
    NEW_MESSAGE: 'new-message',
    USER_TYPING: 'user-typing',
    USER_ONLINE: 'user-online',
    USER_OFFLINE: 'user-offline',
} as const

// Real-time subscription hooks (for React components)
export const subscribeToChannel = (
    channelName: string,
    eventName: string,
    callback: (data: unknown) => void
) => {
    const pusher = getPusherClient()
    if (!pusher) return () => { }

    const channel = pusher.subscribe(channelName)
    channel.bind(eventName, callback)

    return () => {
        channel.unbind(eventName, callback)
        pusher.unsubscribe(channelName)
    }
}

// Presence channel for online users
export const subscribeToPresence = (
    userId: string,
    userInfo: { name: string; avatarUrl?: string },
    onMemberAdded?: (member: { id: string; info: typeof userInfo }) => void,
    onMemberRemoved?: (memberId: string) => void
) => {
    const pusher = getPusherClient()
    if (!pusher) return () => { }

    const channel = pusher.subscribe(CHANNELS.PRESENCE) as PresenceChannel

    channel.bind('pusher:subscription_succeeded', (members: Members) => {
        // Presence channel joined
    })

    channel.bind('pusher:member_added', (member: { id: string; info: any }) => {
        onMemberAdded?.({
            id: member.id,
            info: member.info as typeof userInfo,
        })
    })

    channel.bind('pusher:member_removed', (member: { id: string; info: any }) => {
        onMemberRemoved?.(member.id)
    })

    return () => {
        pusher.unsubscribe(CHANNELS.PRESENCE)
    }
}

// Server-side event triggers
export const triggerEvent = async (
    channel: string,
    event: string,
    data: unknown
) => {
    const pusher = getPusherServer()
    if (!pusher) {
        console.warn('Pusher server not configured. Event not triggered.')
        return
    }

    await pusher.trigger(channel, event, data)
}

// Notify user of new response
export const notifyNewResponse = async (
    surveyId: string,
    responseId: string,
    responseCount: number
) => {
    await triggerEvent(
        CHANNELS.SURVEY_RESPONSES(surveyId),
        EVENTS.NEW_RESPONSE,
        { responseId, responseCount, timestamp: Date.now() }
    )
}

// Notify user of new notification
export const notifyUser = async (
    userId: string,
    notification: {
        id: string
        type: string
        title: string
        message: string
    }
) => {
    await triggerEvent(
        CHANNELS.USER_NOTIFICATIONS(userId),
        EVENTS.NEW_NOTIFICATION,
        notification
    )
}

// Send real-time message
export const sendRealtimeMessage = async (
    recipientId: string,
    message: {
        id: string
        senderId: string
        senderName: string
        content: string
        createdAt: string
    }
) => {
    await triggerEvent(
        CHANNELS.USER_MESSAGES(recipientId),
        EVENTS.NEW_MESSAGE,
        message
    )
}
