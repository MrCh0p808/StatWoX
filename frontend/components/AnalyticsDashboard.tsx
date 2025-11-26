
import React, { useState, useEffect } from 'react';
import type { View, Question } from '../types';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { TableCellsIcon } from './icons/TableCellsIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ShareModal } from './ShareModal';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { apiFetch } from '../utils/api';

interface AnalyticsDashboardProps {
    surveyId: string | null;
    onNavigate: (view: View) => void;
}

// --- MOCK DATA TYPES ---
// BACKEND NOTE: These types should also match your API response for analytics.
interface AnalyticsQuestion extends Question {
    stats?: { label: string; count: number; percentage: number }[]; // For charts
    recentAnswers?: string[]; // For text
}

interface SurveyAnalyticsData {
    id: string;
    title: string;
    totalResponses: number;
    completionRate: number;
    avgTime: string;
    questions: AnalyticsQuestion[];
    individualResponses: any[]; // For table
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ surveyId, onNavigate }) => {
    const [data, setData] = useState<SurveyAnalyticsData | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isShareOpen, setIsShareOpen] = useState(false);

    useEffect(() => {
        const loadAnalytics = async () => {
            if (!surveyId) return;
            setIsLoading(true);
            try {
                const result = await apiFetch(`/surveys/${surveyId}/analytics`);
                setData(result);
            } catch (err) {
                console.error("Failed to load analytics", err);
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnalytics();
    }, [surveyId]);

    const handleExport = () => {
        if (!data) return;
        // Client-side CSV generation. 
        // For large datasets, you might want to handle this on the server.
        const headers = ['Response ID', 'Date', 'Status', ...data.questions.map(q => q.title)];
        const rows = data.individualResponses.map(r => [r.id, r.date, r.status, r.q1, r.q2, r.q3]);
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += headers.join(",") + "\r\n";
        rows.forEach(rowArray => {
            const row = rowArray.join(",");
            csvContent += row + "\r\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `survey_results_${surveyId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl">
                    <div className="mx-auto h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                        <DocumentTextIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">No Data Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">This survey doesn't have any responses yet.</p>
                    <button onClick={() => onNavigate('surveys')} className="mt-6 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all">Go Back</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-full pb-20">
                {/* Sticky Header */}
                <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 shadow-sm transition-all">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={() => onNavigate('surveys')}
                                className="mr-4 p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div className="truncate">
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white truncate tracking-tight">{data.title}</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Analytics & Reports</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setIsShareOpen(true)}
                                className="flex items-center px-5 py-2.5 border border-indigo-600 dark:border-indigo-500 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm transition-all active:scale-95"
                            >
                                <ShareIcon className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all active:scale-95"
                            >
                                <DownloadIcon className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in-up">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg border border-white/60 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-lg ring-1 ring-black/5 hover:-translate-y-1 transition-transform">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Responses</p>
                            <p className="mt-3 text-5xl font-black text-indigo-600 dark:text-indigo-400 font-sans tracking-tight">{data.totalResponses}</p>
                            <p className="mt-2 text-sm text-green-600 font-bold flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                +12% this week
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg border border-white/60 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-lg ring-1 ring-black/5 hover:-translate-y-1 transition-transform">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completion Rate</p>
                            <p className="mt-3 text-5xl font-black text-purple-600 dark:text-purple-400 font-sans tracking-tight">{data.completionRate}%</p>
                            <p className="mt-2 text-sm text-gray-500 font-medium">87 dropped off</p>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/60 backdrop-blur-lg border border-white/60 dark:border-white/5 rounded-3xl p-8 shadow-xl dark:shadow-lg ring-1 ring-black/5 hover:-translate-y-1 transition-transform">
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Time</p>
                            <p className="mt-3 text-5xl font-black text-pink-600 dark:text-pink-400 font-sans tracking-tight">{data.avgTime}</p>
                            <p className="mt-2 text-sm text-gray-500 font-medium">Seconds faster than avg</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex items-center py-4 px-2 border-b-4 font-bold text-sm transition-all ${activeTab === 'overview'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                            >
                                <ChartBarIcon className="w-5 h-5 mr-2" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('responses')}
                                className={`flex items-center py-4 px-2 border-b-4 font-bold text-sm transition-all ${activeTab === 'responses'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                            >
                                <TableCellsIcon className="w-5 h-5 mr-2" />
                                Individual Responses
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="fade-in">
                        {activeTab === 'overview' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {data.questions.map((q, index) => (
                                    <div key={q.id} className="bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl p-8 shadow-lg dark:shadow-sm ring-1 ring-black/5">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-start">
                                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black px-2.5 py-1 rounded-lg mr-3 mt-0.5">Q{index + 1}</span>
                                            {q.title}
                                        </h3>

                                        {(q.type === 'multipleChoice' || q.type === 'rating' || q.type === 'yesNo') && q.stats ? (
                                            <div className="space-y-5">
                                                {q.stats.map((stat, i) => (
                                                    <div key={i} className="relative group">
                                                        <div className="flex justify-between text-sm mb-2">
                                                            <span className="font-bold text-gray-700 dark:text-gray-300">{stat.label}</span>
                                                            <span className="text-gray-500 dark:text-gray-400 font-bold">{stat.count} ({stat.percentage}%)</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
                                                            <div
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-md"
                                                                style={{ width: `${stat.percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Recent Answers</div>
                                                <div className="max-h-64 overflow-y-auto hide-scrollbar space-y-3 pr-2">
                                                    {q.recentAnswers?.map((ans, i) => (
                                                        <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 italic font-medium">
                                                            "{ans}"
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="text-indigo-600 dark:text-indigo-400 text-sm font-black hover:underline mt-2 uppercase tracking-wide">View all</button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Responses Table
                            <div className="bg-white dark:bg-gray-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl dark:shadow-sm ring-1 ring-black/5">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                            <tr>
                                                <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Response ID</th>
                                                <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date</th>
                                                <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</th>
                                                <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Q1 Answer</th>
                                                <th scope="col" className="px-8 py-5 text-left text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {data.individualResponses.map((resp) => (
                                                <tr key={resp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-indigo-600 dark:text-indigo-400">{resp.id}</td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">{resp.date}</td>
                                                    <td className="px-8 py-5 whitespace-nowrap">
                                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-black rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 uppercase tracking-wide">
                                                            {resp.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs font-medium">{resp.q1}</td>
                                                    <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">
                                                        <button className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold transition-colors">View Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ShareModal surveyId={surveyId || ''} isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />
        </>
    );
};
