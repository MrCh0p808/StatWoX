import React from 'react';
import type { Question } from '../types';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { PhoneIcon } from './icons/PhoneIcon';

interface ResponderQuestionProps {
    question: Question;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

export const ResponderQuestion: React.FC<ResponderQuestionProps> = ({ question, value, onChange, error }) => {
    const baseInputClasses = `block w-full bg-white/50 dark:bg-gray-900/50 border rounded-xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
        error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
        : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500'
    }`;
    
    const labelClasses = "block text-base font-bold text-gray-800 dark:text-gray-100 mb-3";

    const renderInput = () => {
        switch (question.type) {
            case 'shortText':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseInputClasses}
                        placeholder="Type your answer here..."
                    />
                );
            case 'longText':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${baseInputClasses} min-h-[120px] resize-y`}
                        placeholder="Type your answer here..."
                    />
                );
            case 'email':
                return (
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <AtSymbolIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="email"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className={`${baseInputClasses} pl-12`}
                            placeholder="name@example.com"
                        />
                    </div>
                );
            case 'phoneNumber':
                return (
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <PhoneIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="tel"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            className={`${baseInputClasses} pl-12`}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={baseInputClasses}
                    />
                );
            case 'multipleChoice':
                return (
                    <div className="space-y-3">
                        {question.options?.map((option, idx) => (
                            <label key={idx} className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${value === option ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500 shadow-md' : 'bg-white/30 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                                <input
                                    type="radio"
                                    name={question.id}
                                    value={option}
                                    checked={value === option}
                                    onChange={(e) => onChange(e.target.value)}
                                    className="h-5 w-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-gray-900 dark:text-gray-200 font-medium">{option}</span>
                            </label>
                        ))}
                    </div>
                );
            case 'yesNo':
                 return (
                    <div className="flex gap-4">
                        {['Yes', 'No'].map((option) => (
                             <button
                                key={option}
                                type="button"
                                onClick={() => onChange(option)}
                                className={`flex-1 py-3 px-4 rounded-xl border font-bold transition-all active:scale-95 ${
                                    value === option 
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg transform scale-[1.02]' 
                                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                 );
            case 'rating':
                return (
                    <div className="flex justify-center space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                                key={rating}
                                type="button"
                                onClick={() => onChange(rating)}
                                className={`p-2 rounded-full transition-all transform hover:scale-125 active:scale-90 focus:outline-none ${
                                    (value || 0) >= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                                }`}
                            >
                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-none p-8 ring-1 ring-black/5 transition-all hover:shadow-2xl">
            <label className={labelClasses}>
                {question.title}
                {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {question.helpText && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium">{question.helpText}</p>}
            
            {renderInput()}
            
            {error && (
                <p className="mt-3 text-sm text-red-500 font-bold animate-pulse flex items-center">
                    <span className="mr-2">●</span> {error}
                </p>
            )}
        </div>
    );
};
