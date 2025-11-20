import React from 'react';
import type { Survey } from '../types';

interface SurveyCardProps {
    survey: Survey;
}

export const SurveyCard: React.FC<SurveyCardProps> = ({ survey }) => (
    <div
        className="group relative bg-white dark:bg-gray-900/40 dark:backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-xl shadow-indigo-500/5 dark:shadow-none transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-95 cursor-pointer text-gray-900 dark:text-white h-full flex flex-col justify-between overflow-hidden"
        role="button"
        tabIndex={0}
        aria-label={`View survey: ${survey.title}`}
    >
        {/* Top Accent Gradient */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
            survey.category === 'poll' ? 'from-pink-500 to-rose-500' :
            survey.category === 'form' ? 'from-blue-500 to-cyan-500' :
            'from-indigo-500 to-violet-500'
        }`}></div>

        <div>
            <div className="flex justify-between items-start mb-5 pt-2">
                <div className={`p-2.5 rounded-2xl shadow-sm ${
                    survey.category === 'poll' ? 'bg-pink-50 text-pink-600 dark:bg-pink-500/20 dark:text-pink-300' :
                    survey.category === 'form' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300' :
                    'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300'
                }`}>
                    {survey.category === 'poll' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    {survey.category === 'form' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    {(survey.category === 'survey' || !survey.category) && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H17z" /></svg>}
                </div>
                {survey.status && (
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                        survey.status === 'Published' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' 
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                        {survey.status}
                    </span>
                )}
            </div>
            <h3 className="text-xl font-black leading-tight text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{survey.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">By {survey.author || 'Unknown'}</p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <span className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 h-8 px-3 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300">
                    {survey.responses.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Responses</span>
            </div>
            <div className="text-gray-300 dark:text-gray-600">
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
        </div>
    </div>
);
