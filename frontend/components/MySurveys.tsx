
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
        className={`group relative w-full flex flex-col items-center text-center p-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-sm hover:shadow-2xl overflow-hidden ${colorClass}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative p-5 bg-gray-50 dark:bg-white/5 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            {icon}
        </div>

        <div className="relative">
            <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-[12rem] mx-auto">{description}</p>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div
                        className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2.5rem] w-full max-w-4xl p-12 relative shadow-2xl ring-1 ring-black/5 transform transition-all animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-8 right-8 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                        >
                            <XIcon />
                        </button>

                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-black mb-4 text-gray-900 dark:text-white tracking-tight">Create New</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-md mx-auto">
                                Choose a format to start gathering insights from your audience.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CreationCard
                                title="Form"
                                description="Capture data, registrations, and applications."
                                icon={<DocumentTextIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />}
                                onClick={() => handleCreateStart('form')}
                                colorClass="hover:border-blue-500/50 hover:shadow-blue-500/20 dark:hover:bg-blue-500/10"
                            />
                            <CreationCard
                                title="Survey"
                                description="Deep research with logic and branching."
                                icon={<svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                                onClick={() => handleCreateStart('survey')}
                                colorClass="hover:border-purple-500/50 hover:shadow-purple-500/20 dark:hover:bg-purple-500/10"
                            />
                            <CreationCard
                                title="Poll"
                                description="Quick single-question voting for instant engagement."
                                icon={<svg className="w-10 h-10 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                                onClick={() => handleCreateStart('poll')}
                                colorClass="hover:border-pink-500/50 hover:shadow-pink-500/20 dark:hover:bg-pink-500/10"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
