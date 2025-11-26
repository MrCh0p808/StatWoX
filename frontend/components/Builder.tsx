
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { CheckIcon } from './icons/CheckIcon';
import { PlusIcon } from './icons/PlusIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { BuilderQuestion } from './BuilderQuestion';
import { PhoneIcon } from './icons/PhoneIcon';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import type { View, SurveyDraft, Question, QuestionType, SurveyCategory } from '../types';
import { apiFetch } from '../utils/api';

interface BuilderProps {
    category: SurveyCategory;
    onNavigate: (view: View) => void;
}

export const Builder: React.FC<BuilderProps> = ({ category, onNavigate }) => {
    const [draft, setDraft] = useState<SurveyDraft>({
        id: `draft-${Date.now()}`,
        category: category,
        title: category === 'poll' ? 'Untitled Poll' : (category === 'form' ? 'Untitled Form' : 'Untitled Survey'),
        description: '',
        questions: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    // Initial Question Setup: ensures user sees at least one question when they start
    useEffect(() => {
        if (draft.questions.length === 0) {
            if (category === 'poll') {
                addQuestion('multipleChoice');
            } else if (category === 'form') {
                addQuestion('shortText');
            } else {
                addQuestion('multipleChoice');
            }
        }
    }, []);

    const getSaveButtonText = () => {
        if (isSaving) return 'Processing...';
        switch (category) {
            case 'poll': return 'Launch Poll';
            case 'form': return 'Publish Form';
            default: return 'Save Survey';
        }
    };

    // --- Actions ---

    const addQuestion = (type: QuestionType = 'shortText') => {
        if (category === 'poll' && draft.questions.length >= 1) return;

        const newQuestion: Question = {
            id: `q-${Date.now()}`,
            type,
            title: '',
            required: false,
            options: (type === 'multipleChoice') ? ['Option 1', 'Option 2'] : undefined
        };
        setDraft(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion]
        }));
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setDraft(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
        }));
    };

    const deleteQuestion = (id: string) => {
        if (window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
            setDraft(prev => ({
                ...prev,
                questions: prev.questions.filter(q => q.id !== id)
            }));
        }
    };

    const moveQuestion = (id: string, direction: 'up' | 'down') => {
        setDraft(prev => {
            const index = prev.questions.findIndex(q => q.id === id);
            if (index === -1) return prev;
            if (direction === 'up' && index === 0) return prev;
            if (direction === 'down' && index === prev.questions.length - 1) return prev;

            const newQuestions = [...prev.questions];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];

            return { ...prev, questions: newQuestions };
        });
    };

    // BACKEND NOTE: This is where you save the survey to your database.
    const handleSave = async () => {
        setIsSaving(true);

        try {
            const response = await apiFetch('/surveys', {
                method: 'POST',
                body: JSON.stringify(draft)
            });

            if (!response.ok) throw new Error("Failed to save survey");

        } catch (err) {
            console.error(err);
            alert("Failed to save survey");
            setIsSaving(false);
            return;
        }

        setIsSaving(false);
        alert(`${category === 'poll' ? 'Poll Launched' : 'Saved'} Successfully!`);
        onNavigate('surveys');
    };

    // --- Toolbox Renders (Sticky Bottom) ---

    const renderToolbox = () => {
        if (isPreview) return null;
        if (category === 'poll' && draft.questions.length >= 1) return null;

        let tools = null;

        // Logic to show different buttons based on the mode (Poll/Form/Survey)
        if (category === 'poll') {
            tools = (
                <>
                    <button onClick={() => addQuestion('multipleChoice')} className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-indigo-500" />Choice
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 my-1 mx-1 h-6"></div>
                    <button onClick={() => addQuestion('yesNo')} className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <CheckIcon className="w-4 h-4 mr-2 text-indigo-500" />Yes / No
                    </button>
                </>
            );
        } else if (category === 'form') {
            tools = (
                <>
                    <button onClick={() => addQuestion('shortText')} className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <PlusIcon className="w-3 h-3 mr-1 text-indigo-500" />Text
                    </button>
                    <button onClick={() => addQuestion('email')} className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <AtSymbolIcon className="w-3 h-3 mr-1 text-indigo-500" />Email
                    </button>
                    <button onClick={() => addQuestion('phoneNumber')} className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <PhoneIcon className="w-3 h-3 mr-1 text-indigo-500" />Phone
                    </button>
                    <button onClick={() => addQuestion('multipleChoice')} className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <DocumentTextIcon className="w-3 h-3 mr-1 text-indigo-500" />Select
                    </button>
                    <button onClick={() => addQuestion('date')} className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <svg className="w-3 h-3 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Date
                    </button>
                </>
            );
        } else {
            tools = (
                <>
                    <button onClick={() => addQuestion('shortText')} className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <PlusIcon className="w-4 h-4 mr-2 text-indigo-500" />Text
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 my-1 mx-1 h-6"></div>
                    <button onClick={() => addQuestion('multipleChoice')} className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-indigo-500" />Choice
                    </button>
                    <div className="w-px bg-gray-300 dark:bg-gray-600 my-1 mx-1 h-6"></div>
                    <button onClick={() => addQuestion('rating')} className="flex items-center px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        Rating
                    </button>
                </>
            );
        }

        return (
            <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-600 rounded-full shadow-2xl p-1.5 pointer-events-auto ring-1 ring-black/10 transform transition-transform hover:scale-105 flex items-center">
                    <span className="pl-4 pr-2 text-xs font-black text-gray-400 uppercase tracking-wider">Add</span>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mr-1"></div>
                    {tools}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-full pb-32 relative">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button
                        onClick={() => onNavigate('surveys')}
                        className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ArrowLeftIcon className="mr-2 w-5 h-5" />
                        <span className="hidden sm:inline font-bold">Back</span>
                    </button>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${isPreview ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            {isPreview ? <EyeOffIcon className="w-4 h-4 mr-2" /> : <EyeIcon className="w-4 h-4 mr-2" />}
                            {isPreview ? 'Edit' : 'Preview'}
                        </button>

                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all active:scale-95"
                        >
                            {isSaving ? 'Saving...' : (
                                <>
                                    <CheckIcon className="mr-2 w-4 h-4" />
                                    {getSaveButtonText()}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 transition-opacity animate-fade-in-up ${isPreview ? 'opacity-90' : 'opacity-100'}`}>
                {/* Title Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t-4 border-t-indigo-500 border-x border-b border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-none p-10 ring-1 ring-black/5">
                    {isPreview ? (
                        <>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{draft.title || 'Untitled'}</h1>
                            {draft.description && <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{draft.description}</p>}
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={draft.title}
                                onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
                                placeholder={category === 'poll' ? "Poll Question" : "Survey Title"}
                                className="block w-full border-0 border-b-2 border-gray-100 dark:border-gray-700 bg-transparent py-2 px-0 text-4xl font-black text-gray-900 dark:text-white placeholder-gray-300 focus:border-indigo-500 focus:ring-0 transition-colors"
                            />
                            <textarea
                                value={draft.description}
                                onChange={(e) => setDraft(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Description (Optional)"
                                rows={category === 'poll' ? 1 : 2}
                                className="mt-6 block w-full border-0 border-b border-gray-100 dark:border-gray-700 bg-transparent py-2 px-0 text-lg text-gray-600 dark:text-gray-300 placeholder-gray-400 focus:border-indigo-500 focus:ring-0 resize-none transition-colors font-medium"
                            />
                        </>
                    )}
                </div>

                {/* Questions List */}
                <div className="space-y-6">
                    {draft.questions.map((q, index) => (
                        <div key={q.id} className={isPreview ? "pointer-events-none" : ""}>
                            <BuilderQuestion
                                question={q}
                                index={index}
                                totalQuestions={draft.questions.length}
                                category={category}
                                onUpdate={updateQuestion}
                                onDelete={deleteQuestion}
                                onMove={moveQuestion}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Render Floating Toolbox */}
            {renderToolbox()}
        </div>
    );
};
