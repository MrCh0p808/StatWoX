/**
 * AI Wrapper - Hooks up to ZhiPu GLM-5 API.
 * Uses the free-tier model (glm-4-flash) so we don't burn cash.
 * Requires ZHIPU_API_KEY in .env.
 */

const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface GLMResponse {
    choices: { message: { content: string } }[];
    usage: { total_tokens: number };
}

/**
 * Send a chat completion request to GLM-5.
 */
export async function chatCompletion(
    messages: ChatMessage[],
    options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
        throw new Error('ZHIPU_API_KEY not configured. AI features require a free ZhiPu API key.');
    }

    const res = await fetch(`${ZHIPU_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'glm-4-flash',  // GLM free-tier model
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2048,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`GLM API error (${res.status}): ${error}`);
    }

    const data: GLMResponse = await res.json();
    return data.choices[0]?.message?.content || '';
}

/**
 * Generate survey questions from a topic description.
 */
export async function generateQuestions(
    topic: string,
    targetAudience: string = 'general',
    count: number = 5,
    types: string[] = ['multipleChoice', 'shortText', 'rating']
): Promise<any[]> {
    // SEC-006: Input length limits to prevent prompt injection
    if (topic.length > 500) {
        throw new Error('Topic description must be 500 characters or fewer');
    }
    if (targetAudience.length > 100) {
        throw new Error('Target audience must be 100 characters or fewer');
    }
    count = Math.min(Math.max(1, count), 20); // Cap between 1-20

    const safeTopic = topic.replace(/[<>{}]/g, ''); // Strip dangerous chars
    const safeAudience = targetAudience.replace(/[<>{}]/g, '');

    const prompt = `Generate ${count} survey questions about "${safeTopic}" for ${safeAudience} audience.

Return ONLY a valid JSON array. Each question object must have:
- "title": string (the question text)
- "type": one of ${JSON.stringify(types)}
- "required": boolean
- "options": string array (only for multipleChoice/checkbox types, omit for others)
- "description": optional helper text

Example format:
[{"title":"How satisfied are you?","type":"rating","required":true,"description":"Rate 1-5"}]`;

    const response = await chatCompletion([
        { role: 'system', content: 'You are a survey design expert. Always respond with valid JSON arrays only, no markdown or extra text.' },
        { role: 'user', content: prompt }
    ], { temperature: 0.8 });

    try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON array found');
        return JSON.parse(jsonMatch[0]);
    } catch {
        throw new Error('Failed to parse AI response as JSON');
    }
}

/**
 * Generate a natural language summary of survey responses.
 */
export async function generateSummary(
    surveyTitle: string,
    questionBreakdowns: { title: string; type: string; distribution: Record<string, number> }[]
): Promise<{ summary: string; keyFindings: string[]; recommendations: string[] }> {
    const dataDescription = questionBreakdowns.map(q =>
        `Question: "${q.title}"(${q.type}) \nResponses: ${JSON.stringify(q.distribution)} `
    ).join('\n\n');

    const prompt = `Analyze these survey results for "${surveyTitle}" and provide insights.

        ${dataDescription}

Return ONLY valid JSON with this structure:
    { "summary": "2-3 sentence overview", "keyFindings": ["finding1", "finding2", "finding3"], "recommendations": ["rec1", "rec2"] } `;

    const response = await chatCompletion([
        { role: 'system', content: 'You are a data analyst. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
    ], { temperature: 0.5 });

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch {
        return {
            summary: 'Unable to generate AI summary.',
            keyFindings: [],
            recommendations: []
        };
    }
}

/**
 * Analyze sentiment of open-text responses.
 */
export async function analyzeSentiment(
    texts: string[]
): Promise<{ positive: number; negative: number; neutral: number; averageScore: number }> {
    if (texts.length === 0) {
        return { positive: 0, negative: 0, neutral: 0, averageScore: 0 };
    }

    // Batch texts (max 20 at a time for token efficiency)
    const batch = texts.slice(0, 20);
    const prompt = `Classify each text as positive, negative, or neutral.Return ONLY a JSON array of sentiments.

        Texts:
${batch.map((t, i) => `${i + 1}. "${t}"`).join('\n')}

Return format: ["positive", "negative", "neutral", ...]`;

    const response = await chatCompletion([
        { role: 'system', content: 'You are a sentiment classifier. Respond only with a JSON array of strings.' },
        { role: 'user', content: prompt }
    ], { temperature: 0.1 });

    try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('No JSON found');
        const sentiments: string[] = JSON.parse(jsonMatch[0]);

        let positive = 0, negative = 0, neutral = 0;
        for (const s of sentiments) {
            if (s.toLowerCase().includes('positive')) positive++;
            else if (s.toLowerCase().includes('negative')) negative++;
            else neutral++;
        }

        const total = positive + negative + neutral;
        return {
            positive,
            negative,
            neutral,
            averageScore: total > 0 ? ((positive - negative) / total + 1) / 2 : 0.5
        };
    } catch {
        return { positive: 0, negative: 0, neutral: texts.length, averageScore: 0.5 };
    }
}

/**
 * Generate a follow-up question based on current answers.
 */
export async function generateFollowUp(
    questionTitle: string,
    answer: string
): Promise<{ title: string; type: string } | null> {
    const prompt = `The user answered "${answer}" to the question "${questionTitle}".
Generate ONE clarifying follow - up question.Return ONLY JSON: { "title": "...", "type": "shortText" } `;

    try {
        const response = await chatCompletion([
            { role: 'system', content: 'You are a survey assistant. Respond only with JSON.' },
            { role: 'user', content: prompt }
        ], { temperature: 0.7, maxTokens: 256 });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch {
        return null;
    }
}
