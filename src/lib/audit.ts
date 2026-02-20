/**
 * Audit Logger - Tracks DB mutations for compliance.
 * Cheap & cheerful: dumps straight to Postgres under the free tier.
 */
import { db } from '@/lib/db';

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'close' | 'export' | 'login' | 'invite';
export type AuditEntityType = 'survey' | 'question' | 'response' | 'workspace' | 'user' | 'template';

export async function logAudit(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    userId: string,
    metadata?: Record<string, any>,
    ipAddress?: string
): Promise<void> {
    try {
        await db.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                userId,
                metadata: metadata || undefined,
                ipAddress: ipAddress || undefined,
            }
        });
    } catch (error) {
        // Non-blocking: audit failures should not break the main operation
        console.error('Audit log error:', error);
    }
}
