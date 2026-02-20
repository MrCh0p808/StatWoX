/**
 * Skip Logic Engine — evaluates conditional branching rules
 * to determine which questions are visible based on current answers.
 */
import type { SkipLogicRule } from '@/types';

interface QuestionWithLogic {
    id: string;
    order: number;
    page: number;
    logic?: SkipLogicRule[] | null;
    required: boolean;
    [key: string]: any;
}

/**
 * Evaluates a single skip logic rule against the current answers.
 */
export function evaluateRule(rule: SkipLogicRule, answerValue: any): boolean {
    const answer = typeof answerValue === 'string' ? answerValue : JSON.stringify(answerValue ?? '');

    switch (rule.condition) {
        case 'equals':
            return answer === rule.value;
        case 'notEquals':
            return answer !== rule.value;
        case 'contains':
            return answer.toLowerCase().includes((rule.value || '').toLowerCase());
        case 'gt':
            return parseFloat(answer) > parseFloat(rule.value);
        case 'lt':
            return parseFloat(answer) < parseFloat(rule.value);
        case 'isEmpty':
            return !answer || answer === '' || answer === '""';
        case 'isNotEmpty':
            return !!answer && answer !== '' && answer !== '""';
        default:
            return false;
    }
}

/**
 * Given a flat list of questions and the current answers map,
 * returns the subset of visible question IDs after evaluating all skip logic.
 * 
 * Logic: if ANY rule on a question evaluates to true, the respondent
 * should skip TO the targetQuestionId (hiding questions in between).
 */
export function computeVisibleQuestions(
    questions: QuestionWithLogic[],
    answers: Record<string, any>
): string[] {
    const sorted = [...questions].sort((a, b) => a.order - b.order);
    const visible: string[] = [];
    let skipToId: string | null = null;

    for (const q of sorted) {
        // If we're skipping to a target, hide everything until we reach it
        if (skipToId) {
            if (q.id === skipToId) {
                skipToId = null; // Found the target, stop skipping
            } else {
                continue; // Still skipping
            }
        }

        visible.push(q.id);

        // Evaluate this question's logic rules
        if (q.logic && Array.isArray(q.logic) && q.logic.length > 0) {
            const answer = answers[q.id];
            for (const rule of q.logic) {
                if (evaluateRule(rule, answer)) {
                    skipToId = rule.targetQuestionId;
                    break;
                }
            }
        }
    }

    return visible;
}

/**
 * Filter questions for a specific page, respecting skip logic.
 */
export function getVisibleQuestionsForPage(
    questions: QuestionWithLogic[],
    answers: Record<string, any>,
    pageNumber: number
): QuestionWithLogic[] {
    const visibleIds = new Set(computeVisibleQuestions(questions, answers));
    return questions
        .filter(q => q.page === pageNumber && visibleIds.has(q.id))
        .sort((a, b) => a.order - b.order);
}

/**
 * Get all unique page numbers that have at least one visible question.
 */
export function getVisiblePages(
    questions: QuestionWithLogic[],
    answers: Record<string, any>
): number[] {
    const visibleIds = new Set(computeVisibleQuestions(questions, answers));
    const pages = new Set<number>();
    for (const q of questions) {
        if (visibleIds.has(q.id)) {
            pages.add(q.page);
        }
    }
    return Array.from(pages).sort((a, b) => a - b);
}
