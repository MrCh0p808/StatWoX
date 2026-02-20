/**
 * Webhook utility — fires POST requests to configured webhook URLs
 * with HMAC-SHA256 signature verification.
 */
import { createHmac } from 'crypto';

export interface WebhookPayload {
    event: 'response.created' | 'survey.published' | 'survey.closed';
    surveyId: string;
    data: Record<string, any>;
    timestamp: string;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload verification.
 */
function generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Fire a webhook to the target URL with retry logic.
 * Free-tier: no external service needed, just native fetch.
 */
export async function fireWebhook(
    url: string,
    secret: string | null,
    payload: WebhookPayload,
    maxRetries = 3
): Promise<boolean> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-StatWoX-Event': payload.event,
        'X-StatWoX-Timestamp': payload.timestamp,
    };

    if (secret) {
        headers['X-StatWoX-Signature'] = generateSignature(body, secret);
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers,
                body,
                signal: AbortSignal.timeout(10000), // 10s timeout
            });

            if (res.ok) return true;

            console.warn(`Webhook attempt ${attempt} failed: ${res.status}`);
        } catch (error) {
            console.warn(`Webhook attempt ${attempt} error:`, error);
        }

        // Exponential backoff
        if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
    }

    console.error(`Webhook delivery failed after ${maxRetries} attempts: ${url}`);
    return false;
}
