import React from 'react';
import type { Question, QuestionType, SurveyCategory } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XIcon } from './icons/XIcon';
import { GripVerticalIcon } from './icons/GripVerticalIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { AtSymbolIcon } from './icons/AtSymbolIcon';
import { CheckIcon } from './icons/CheckIcon';

interface BuilderQuestionProps {
    question: Question;
    index: number;
    totalQuestions: number;
    category: SurveyCategory;
    onUpdate: (id: string, updates: Partial<Question>) => void;
    onDelete: (id: string) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
}

export const BuilderQuestion: React.FC<BuilderQuestionProps> = ({
    question,
    index,
    totalQuestions,
    category,
    onUpdate,
    onDelete,
    onMove
}) => {
    const inputClasses = "block w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm p-2.5 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors";
    const labelClasses = "block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";

    // Helper to restrict type changing based on category
    const renderTypeOptions = () => {
        if (category === 'poll') {
            return (
                <>
                    <option value="multipleChoice">Multiple Choice</option>
                    <option value="yesNo">Yes / No</option>
                </>
            );
        }
        if (category === 'form') {
            return (
                <>
                    <option value="shortText">Short Text</option>
                    <option value="longText">Paragraph</option>
                    <option value="email">Email Address</option>
                    <option value="phoneNumber">Phone Number</option>
                    <option value="date">Date Picker</option>
                    <option value="multipleChoice">Dropdown/Choice</option>
                </>
            );
        }
        // Survey (Default)
        return (
            <>
                <option value="shortText">Short Text</option>
                <option value="longText">Long Text</option>
                <option value="multipleChoice">Multiple Choice</option>
                <option value="rating">Rating Scale</option>
                <option value="date">Date Picker</option>
            </>
        );
    };

    const handleAddOption = () => {
        const currentOptions = question.options || [];
        onUpdate(question.id, { options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
    };

    const handleUpdateOption = (optIndex: number, value: string) => {
        const currentOptions = question.options || [];
        const newOptions = [...currentOptions];
        newOptions[optIndex] = value;
        onUpdate(question.id, { options: newOptions });
    };

    const handleRemoveOption = (optIndex: number) => {
        const currentOptions = question.options || [];
        const newOptions = currentOptions.filter((_, i) => i !== optIndex);
        onUpdate(question.id, { options: newOptions });
    };

    return (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-sm p-6 relative group transition-all hover:shadow-md ring-1 ring-black/5">
            {/* Header Controls */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-2 text-gray-400 cursor-move">
                     <GripVerticalIcon />
                     <span className="text-sm font-medium">
                         {category === 'poll' ? 'Poll Question' : `Q${index + 1}`}
                     </span>
                </div>
                <div className="flex items-center space-x-2">
                    {category !== 'poll' && (
                        <>
                            <button
                                onClick={() => onMove(question.id, 'up')}
                                disabled={index === 0}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronUpIcon />
                            </button>
                            <button
                                onClick={() => onMove(question.id, 'down')}
                                disabled={index === totalQuestions - 1}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronDownIcon />
                            </button>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-2"></div>
                        </>
                    )}
                    <button
                        onClick={() => onDelete(question.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        <TrashIcon />
                    </button>
                </div>
            </div>

            {/* Main Edit Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-2">
                    <label className={labelClasses}>
                        {category === 'form' ? 'Field Label' : 'Question Title'}
                    </label>
                    <input
                        type="text"
                        value={question.title}
                        onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                        placeholder={category === 'form' ? "e.g., Full Name" : "e.g., What is your favorite color?"}
                        className={`${inputClasses} font-medium text-lg`}
                        autoFocus
                    />
                </div>
                <div>
                    <label className={labelClasses}>Type</label>
                    <select
                        value={question.type}
                        onChange={(e) => onUpdate(question.id, { type: e.target.value as QuestionType })}
                        className={inputClasses}
                    >
                        {renderTypeOptions()}
                    </select>
                </div>
            </div>

            {/* Dynamic Content based on Type */}
            <div className="space-y-4">
                {question.type === 'shortText' && (
                    <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-900/30">
                        <span className="text-sm text-gray-400">Short text input...</span>
                    </div>
                )}
                
                {question.type === 'longText' && (
                    <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-900/30 h-24">
                        <span className="text-sm text-gray-400">Long text area...</span>
                    </div>
                )}

                {question.type === 'email' && (
                    <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-900/30 flex items-center text-gray-400">
                         <AtSymbolIcon className="w-5 h-5 mr-2" />
                        <span>user@example.com</span>
                    </div>
                )}

                {question.type === 'phoneNumber' && (
                    <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-900/30 flex items-center text-gray-400">
                         <PhoneIcon className="w-5 h-5 mr-2" />
                        <span>+1 (555) 000-0000</span>
                    </div>
                )}

                {question.type === 'multipleChoice' && (
                    <div className="space-y-3">
                        {question.options?.map((option, i) => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleUpdateOption(i, e.target.value)}
                                    className="flex-1 bg-transparent border-b border-gray-200 dark:border-gray-700 py-1 px-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <button 
                                    onClick={() => handleRemoveOption(i)}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            className="flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline mt-2 pl-7 font-medium"
                        >
                            <PlusIcon className="w-4 h-4 mr-1" /> Add Option
                        </button>
                    </div>
                )}

                {question.type === 'yesNo' && (
                     <div className="flex space-x-4">
                        <div className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-center text-gray-500 dark:text-gray-300 text-sm">Yes</div>
                        <div className="flex-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-center text-gray-500 dark:text-gray-300 text-sm">No</div>
                     </div>
                )}

                 {question.type === 'rating' && (
                    <div className="flex items-center space-x-2 p-4 justify-center bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-gray-100 dark:border-gray-800">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                    </div>
                )}

                {question.type === 'date' && (
                     <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-md bg-gray-50/50 dark:bg-gray-900/30 flex items-center text-gray-400">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>Month, Day, Year</span>
                    </div>
                )}
            </div>

            {/* Footer Settings */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end">
                <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={question.required}
                            onChange={(e) => onUpdate(question.id, { required: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-300">Required</span>
                    </label>
                </div>
            </div>
        </div>
    );
};
