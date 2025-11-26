
import React, { useState, useEffect } from 'react';
import { SurveyCard } from './SurveyCard';
import { API_BASE_URL } from '../constants';
import type { Survey, View, SurveyCategory } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface MySurveysProps {
    onNavigate: (view: View, param?: any) => void;
}

interface CreationCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    colorClass: string;
}

const CreationCard: React.FC<CreationCardProps> = ({ title, description, icon, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className={`group w-full text-left p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-3xl transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-xl ${colorClass}`}
    >
        <div className="flex items-start">
            <div className="p-4 bg-white/50 dark:bg-white/10 rounded-2xl mr-5 shadow-inner">
                {icon}
            </div>
            <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 font-medium leading-relaxed">{description}</p>
            </div>
        </div>
    </button>
);

export const MySurveys: React.FC<MySurveysProps> = ({ onNavigate }) => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchSurveys = async () => {
            try {
                const token = localStorage.getItem('statwox_token');
                if (!token) {
                    throw new Error('Authentication token not found.');
                }

                // BACKEND NOTE: This is where you should call your real API.
                // Uncomment the code below when your backend is ready.
                const response = await fetch(`${API_BASE_URL}/api/surveys`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch surveys.');
                }
                const data = await response.json();
                setSurveys(data);



            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSurveys();
    }, []);

    const handleCreateStart = (category: SurveyCategory) => {
        setIsCreateModalOpen(false);
        // Navigate to the builder to start creating
        onNavigate('builder', category);
    };

    const handleSurveyClick = (surveyId: string) => {
        // Navigate to analytics when clicking a card
        onNavigate('analytics', surveyId);
    };

    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-200 dark:border-gray-700 pb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">My Surveys</h1>
                        <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">Manage your existing forms, polls, and surveys.</p>
                    </div>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg dark:shadow-none">
                    <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
                            {surveys.length}
                        </span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</span>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/30 text-white bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-95 transition-all"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create New
                    </button>
                </div>

                {/* Content Area */}
                {isLoading && <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div></div>}

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                        <p className="text-red-600 dark:text-red-400 font-bold">{error}</p>
                    </div>
                )}

                {!isLoading && !error && surveys.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-3xl text-center shadow-sm">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <DocumentTextIcon className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mr-0" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No content yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium mb-8">
                            Your dashboard is looking a bit empty. Start creating to gather insights from your audience.
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-8 py-4 border border-transparent shadow-xl text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transform hover:scale-105 transition-all"
                        >
                            <PlusIcon className="mr-2 h-6 w-6" />
                            Create Your First Survey
                        </button>
                    </div>
                )}

                {!isLoading && !error && surveys.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                        {surveys.map(survey => (
                            <div key={survey.id} onClick={() => handleSurveyClick(survey.id)} className="h-full">
                                <SurveyCard survey={survey} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                    <div className="bg-white dark:bg-gray-900 border border-white/20 dark:border-gray-700 rounded-3xl w-full max-w-3xl p-10 relative shadow-2xl ring-1 ring-black/5 transform transition-all scale-100">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <XIcon />
                        </button>
                        <h2 className="text-3xl font-black mb-3 text-center text-gray-900 dark:text-white">Create New</h2>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">Select the type of content you want to build</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CreationCard
                                title="Form"
                                description="Registration & data collection."
                                icon={<DocumentTextIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-0" />}
                                onClick={() => handleCreateStart('form')}
                                colorClass="hover:shadow-blue-500/20 hover:border-blue-200 dark:hover:border-blue-800"
                            />
                            <CreationCard
                                title="Survey"
                                description="Research & deep feedback."
                                icon={<svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                onClick={() => handleCreateStart('survey')}
                                colorClass="hover:shadow-purple-500/20 hover:border-purple-200 dark:hover:border-purple-800"
                            />
                            <CreationCard
                                title="Poll"
                                description="Quick single-question vote."
                                icon={<svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                onClick={() => handleCreateStart('poll')}
                                colorClass="hover:shadow-pink-500/20 hover:border-pink-200 dark:hover:border-pink-800"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
