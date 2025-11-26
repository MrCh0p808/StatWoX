import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { SurveyCard } from './SurveyCard';
import { mockPublicSurveys } from '../constants';
import type { HomeFeedTab, Survey, View } from '../types';
import { SearchIcon } from './icons/SearchIcon';

// Update FeedRow to accept onNavigate
const FeedRow: React.FC<{ surveys: Survey[], onSelect: (id: string) => void }> = ({ surveys, onSelect }) => {
    if (surveys.length === 0) {
        return (
            <div className="text-center py-12 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 font-medium">No surveys found in this category yet.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later or create your own!</p>
            </div>
        );
    }
    return (
        <div className="relative md:pl-2 lg:pl-0">
            <div className="grid grid-cols-1 gap-6 md:flex md:overflow-x-auto md:space-x-6 md:pb-6 md:scroll-smooth hide-scrollbar md:[scroll-snap-type:x_mandatory]">
                <div className="hidden md:block md:flex-shrink-0 md:w-2 lg:w-0"></div>
                {surveys.map(survey => (
                    <div key={survey.id} className="md:w-80 md:flex-shrink-0 md:[scroll-snap-align:start]" onClick={() => onSelect(survey.id)}>
                        <SurveyCard survey={survey} />
                    </div>
                ))}
                <div className="hidden md:block md:flex-shrink-0 md:w-2 lg:w-0"></div>
            </div>
            <div className="absolute top-0 right-0 bottom-6 w-16 bg-gradient-to-l from-gray-200/50 dark:from-slate-900/50 to-transparent pointer-events-none hidden md:block"></div>
        </div>
    );
};

interface HomeFeedProps {
    onNavigate?: (view: View, surveyId?: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ onNavigate }) => {
    const [activeTab, setActiveTab] = useState<HomeFeedTab>('featured');
    const tabs: { id: HomeFeedTab, label: string }[] = [
        { id: 'featured', label: 'Featured' },
        { id: 'trending', label: 'Trending' },
        { id: 'quickPolls', label: 'Quick Polls' },
    ];

    const handleSurveyClick = (id: string) => {
        if (onNavigate) {
            onNavigate('responder', id);
        }
    };

    const [featured, setFeatured] = useState<Survey[]>([]);
    const [trending, setTrending] = useState<Survey[]>([]);
    const [quickPolls, setQuickPolls] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFeed = async () => {
            try {
                const data = await apiFetch('/feed');
                setFeatured(data.featured || []);
                setTrending(data.trending || []);
                setQuickPolls(data.quickPolls || []);
            } catch (err) {
                console.error("Failed to load feed", err);
            } finally {
                setLoading(false);
            }
        };
        loadFeed();
    }, []);

    const renderContent = () => {
        if (loading) return <div className="text-center py-10">Loading...</div>;
        switch (activeTab) {
            case 'featured': return <FeedRow surveys={featured} onSelect={handleSurveyClick} />;
            case 'trending': return <FeedRow surveys={trending} onSelect={handleSurveyClick} />;
            case 'quickPolls': return <FeedRow surveys={quickPolls} onSelect={handleSurveyClick} />;
            default: return null;
        }
    };

    return (
        <div className="w-full py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Home Feed</h1>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">Discover popular surveys and trending polls.</p>
                </div>

                <div className="w-full max-w-lg lg:max-w-md">
                    <label htmlFor="search" className="sr-only">Search</label>
                    <div className="relative text-gray-500 dark:text-gray-400 focus-within:text-indigo-500 dark:focus-within:text-indigo-400">
                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center"><SearchIcon /></div>
                        <input id="search" className="block w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm py-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 sm:text-sm transition-all shadow-sm text-gray-900 dark:text-white font-medium" placeholder="Search for topics, tags, or users..." type="search" name="search" />
                    </div>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map(tab =>
                        (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap pb-4 px-1 border-b-4 font-bold text-sm transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <div className="mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:px-0 lg:px-0">
                <div key={activeTab} className="fade-in">{renderContent()}</div>
            </div>
        </div>
    );
};
