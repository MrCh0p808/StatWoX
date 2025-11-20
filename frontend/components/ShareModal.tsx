
import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface ShareModalProps {
    surveyId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ surveyId, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'embed' | 'email'>('link');
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    if (!isOpen) return null;

    const surveyLink = `https://statwox.com/s/${surveyId}`;
    const embedCode = `<iframe src="${surveyLink}" width="100%" height="600" frameborder="0"></iframe>`;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleEmailSend = (e: React.FormEvent) => {
        e.preventDefault();
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Share Survey</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <XIcon />
                    </button>
                </div>
                
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button onClick={() => setActiveTab('link')} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'link' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Link</button>
                    <button onClick={() => setActiveTab('qr')} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'qr' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>QR Code</button>
                    <button onClick={() => setActiveTab('embed')} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'embed' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Embed</button>
                    <button onClick={() => setActiveTab('email')} className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'email' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>Email</button>
                </div>

                <div className="p-8">
                    {activeTab === 'link' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Share this link directly with your respondents.</p>
                            <div className="flex items-center space-x-2">
                                <input type="text" readOnly value={surveyLink} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                <button 
                                    onClick={() => handleCopy(surveyLink)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex items-center"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'qr' && (
                        <div className="flex flex-col items-center space-y-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">Scan this code to access the survey instantly.</p>
                            <div className="bg-white p-4 rounded-xl shadow-inner">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(surveyLink)}`} 
                                    alt="Survey QR Code" 
                                    className="w-48 h-48"
                                />
                            </div>
                            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">Download SVG</button>
                        </div>
                    )}

                    {activeTab === 'embed' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Copy and paste this code into your website's HTML.</p>
                            <div className="relative">
                                <textarea 
                                    readOnly 
                                    value={embedCode} 
                                    rows={4}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <button 
                                    onClick={() => handleCopy(embedCode)}
                                    className="absolute top-2 right-2 p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                >
                                    {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'email' && (
                        <form onSubmit={handleEmailSend} className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Invite people directly via email.</p>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Recipients (comma separated)</label>
                                <textarea 
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="jane@example.com, john@example.com"
                                    rows={3}
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={emailSent}
                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors flex justify-center items-center"
                            >
                                {emailSent ? (
                                    <>
                                        <CheckIcon className="w-4 h-4 mr-2" /> Sent Successfully
                                    </>
                                ) : (
                                    <>
                                        <EnvelopeIcon className="w-4 h-4 mr-2" /> Send Invitations
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
