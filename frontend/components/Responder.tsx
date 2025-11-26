
import React, { useState, useEffect } from 'react';
import type { View, SurveyDraft, Question, SurveyCategory } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ResponderQuestion } from './ResponderQuestion';

interface ResponderProps {
    surveyId: string | null;
    onNavigate: (view: View) => void;
}

export const Responder: React.FC<ResponderProps> = ({ surveyId, onNavigate }) => {
    const [survey, setSurvey] = useState<SurveyDraft | null>(null);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        // BACKEND NOTE: Fetch the specific survey by ID from your database.
        const fetchSurvey = async () => {
            setIsLoading(true);

            try {
                const res = await fetch(`/api/surveys/${surveyId}`);
                if (!res.ok) throw new Error("Survey not found");
                const data = await res.json();
                setSurvey(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSurvey();
    }, [surveyId]);

    const handleAnswerChange = (questionId: string, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        // Clear error if exists when user starts typing
        if (errors[questionId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    const handleSubmit = async () => {
        if (!survey) return;

        // Frontend Validation: check if required fields are filled
        const newErrors: Record<string, string> = {};
        let hasError = false;

        survey.questions.forEach(q => {
            if (q.required && (!answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0))) {
                newErrors[q.id] = 'This field is required';
                hasError = true;
            }
        });

        if (hasError) {
            setErrors(newErrors);
            // Scroll to first error for better UX
            const firstErrorId = Object.keys(newErrors)[0];
            const element = document.getElementById(`question-${firstErrorId}`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/surveys/${surveyId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers })
            });

            if (!res.ok) throw new Error("Failed to submit");

        } catch (err) {
            alert("Error submitting response");
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(false);
        setIsCompleted(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!survey) return <div className="text-center py-20 text-gray-500 font-bold">Survey not found.</div>;

    if (isCompleted) {
        return (
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-10 text-center ring-1 ring-black/5 animate-fade-in-up">
                    <div className="mx-auto h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-8 shadow-lg">
                        <CheckIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Thank You!</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-10 text-lg font-medium">
                        Your response has been successfully recorded.
                    </p>
                    <button
                        onClick={() => onNavigate('feed')}
                        className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl shadow-lg text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105 active:scale-95"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Poll Layout (Centered Card) vs Survey/Form Layout (Standard)
    const isPoll = survey.category === 'poll';

    return (
        <div className={`min-h-full pb-20 ${isPoll ? 'flex items-center justify-center' : ''}`}>
            {/* Navigation Header - Only show for non-polls or if back navigation is needed */}
            <div className={`fixed top-0 left-0 right-0 z-10 p-4 ${isPoll ? '' : 'bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 transition-all'}`}>
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => onNavigate('feed')}
                        className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors px-4 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-bold"
                    >
                        <ArrowLeftIcon className="mr-2 w-5 h-5" />
                        <span>Exit</span>
                    </button>
                </div>
            </div>

            <div className={`w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 ${isPoll ? '' : 'pt-28'}`}>
                {/* Header */}
                <div className={`text-center animate-fade-in-up ${isPoll ? 'mb-8' : 'mb-12'}`}>
                    <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4 drop-shadow-sm">
                        {survey.title}
                    </h1>
                    {survey.description && !isPoll && (
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                            {survey.description}
                        </p>
                    )}
                </div>

                {/* Questions */}
                <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {survey.questions.map((q) => (
                        <div key={q.id} id={`question-${q.id}`}>
                            <ResponderQuestion
                                question={q}
                                value={answers[q.id]}
                                onChange={(val) => handleAnswerChange(q.id, val)}
                                error={errors[q.id]}
                            />
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="pt-10 flex justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed ${isPoll
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                    >
                        {isSubmitting ? 'Submitting...' : (isPoll ? 'Vote Now' : 'Submit Response')}
                    </button>
                </div>
            </div>
        </div>
    );
};
