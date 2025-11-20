import React, { useState } from 'react';
import type { ProfileTab } from '../types';
import { UserIcon } from './icons/UserIcon';
import { GoogleIcon } from './icons/GoogleIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { KeyIcon } from './icons/KeyIcon';
import { PlusIcon } from './icons/PlusIcon';
import { TrashIcon } from './icons/TrashIcon';

export const Profile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('account');
    const inputClasses = "mt-1 block w-full bg-white/50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3.5 text-gray-900 dark:text-white transition-colors";
    const disabledInputClasses = "mt-1 block w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-500 dark:text-gray-400 cursor-not-allowed p-3.5 transition-colors";
    const cardClasses = "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-none overflow-hidden ring-1 ring-black/5 transition-all hover:shadow-2xl";
    const cardHeaderClasses = "p-8 border-b border-gray-100 dark:border-white/5";
    const cardFooterClasses = "p-6 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-white/5 flex justify-end";

    const renderTabContent = () => {
        if (activeTab === 'security') {
            return (
                <div className="flex flex-col gap-8 max-w-3xl animate-fade-in-up">
                    <div className={cardClasses}>
                        <div className={cardHeaderClasses}><h3 className="text-xl font-black text-gray-900 dark:text-white">Change Password</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Update your password for enhanced security.</p></div>
                        <div className="p-8"><div className="grid grid-cols-1 gap-y-6"><div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Current Password</label><input type="password" className={inputClasses} /></div><div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New Password</label><input type="password" className={inputClasses} /></div></div></div>
                        <div className={cardFooterClasses}><button className="px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">Save Changes</button></div>
                    </div>
                    <div className={`${cardClasses} border-red-200 dark:border-red-900/30`}>
                        <div className={cardHeaderClasses}><h3 className="text-xl font-black text-red-600 dark:text-red-400">Danger Zone</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Permanently delete your account and all associated data.</p></div>
                        <div className="p-8 flex items-center justify-between"><p className="text-sm text-gray-600 dark:text-gray-400 font-medium">This action is irreversible.</p><button className="px-6 py-3 border border-red-200 dark:border-red-800 text-sm font-bold rounded-xl shadow-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all hover:-translate-y-0.5 active:scale-95">Delete Account</button></div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'billing') {
            return (
                <div className="flex flex-col gap-8 animate-fade-in-up">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Free', 'Pro', 'Team'].map((plan) => (
                            <div key={plan} className={`relative p-8 rounded-3xl border transition-all hover:-translate-y-1 hover:shadow-xl ${plan === 'Free' ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50 shadow-lg shadow-indigo-500/10' : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-white/60 dark:border-white/10'}`}>
                                {plan === 'Free' && <div className="absolute top-0 right-0 -mt-3 -mr-3 px-4 py-1.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md">CURRENT</div>}
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{plan}</h3>
                                <p className="text-4xl font-black mt-4 text-gray-800 dark:text-white">{plan === 'Free' ? '$0' : (plan === 'Pro' ? '$29' : '$99')}<span className="text-base font-bold text-gray-500 dark:text-gray-400">/mo</span></p>
                                <ul className="mt-8 space-y-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                    <li className="flex items-center"><span className="mr-3 text-green-500 font-bold">✓</span> {plan === 'Free' ? '100 Responses/mo' : (plan === 'Pro' ? 'Unlimited Responses' : 'Unlimited + API Access')}</li>
                                    <li className="flex items-center"><span className="mr-3 text-green-500 font-bold">✓</span> {plan === 'Free' ? 'Basic Analytics' : 'Advanced Analytics'}</li>
                                </ul>
                                <button className={`mt-8 w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${plan === 'Free' ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/30'}`}>
                                    {plan === 'Free' ? 'Current Plan' : 'Upgrade'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className={cardClasses}>
                         <div className={cardHeaderClasses}><h3 className="text-xl font-black text-gray-900 dark:text-white">Usage</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Your monthly consumption.</p></div>
                         <div className="p-8">
                             <div className="mb-3 flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300"><span>Responses</span><span>85 / 100</span></div>
                             <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                                 <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-4 rounded-full shadow-md" style={{ width: '85%' }}></div>
                             </div>
                             <p className="mt-3 text-xs font-medium text-gray-500">Resets in 14 days.</p>
                         </div>
                    </div>
                </div>
            );
        }

        if (activeTab === 'api') {
             return (
                <div className="flex flex-col gap-8 max-w-4xl animate-fade-in-up">
                    <div className={cardClasses}>
                        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <div><h3 className="text-xl font-black text-gray-900 dark:text-white">API Keys</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage access to the StatWoX API.</p></div>
                            <button className="flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                                <PlusIcon className="w-5 h-5 mr-2" /> Generate New Key
                            </button>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key Prefix</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr>
                                        <td className="px-8 py-5 text-sm font-bold text-gray-900 dark:text-white">Production App</td>
                                        <td className="px-8 py-5 text-sm text-gray-500 font-mono bg-gray-50 dark:bg-gray-900/50 rounded-lg">stwx_prod_...</td>
                                        <td className="px-8 py-5 text-sm font-medium text-gray-500">Oct 24, 2024</td>
                                        <td className="px-8 py-5 text-right">
                                            <button className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 animate-fade-in-up">
                <div className="lg:col-span-1 space-y-6">
                    <div>
                         <h3 className="text-xl font-black text-gray-900 dark:text-white">Profile Picture</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Update your avatar.</p>
                    </div>
                    <div className="flex items-center space-x-5 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-white/10 shadow-lg">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-md"><UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-300" /></div>
                        <button className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all active:scale-95 bg-white dark:bg-gray-800">Change</button>
                    </div>
                </div>
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className={cardClasses}>
                        <div className={cardHeaderClasses}><h3 className="text-xl font-black text-gray-900 dark:text-white">User Details</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Edit your public profile info.</p></div>
                        <div className="p-8"><div className="grid grid-cols-1 gap-y-6"><div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Username</label><input type="text" defaultValue="V3ND377A" className={inputClasses} /></div><div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label><input type="email" disabled defaultValue="v3nd377a@example.com" className={disabledInputClasses} /></div></div></div>
                        <div className={cardFooterClasses}><button className="px-6 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">Save Changes</button></div>
                    </div>
                    <div className={cardClasses}>
                        <div className={cardHeaderClasses}><h3 className="text-xl font-black text-gray-900 dark:text-white">Connected Accounts</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage third-party connections.</p></div>
                        <div className="p-8"><button className="w-full flex items-center justify-center space-x-3 px-5 py-3 border border-gray-200 dark:border-gray-600 text-sm font-bold rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 text-gray-700 dark:text-gray-200"><GoogleIcon /><span>Connect with Google</span></button></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Profile Settings</h1>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">Manage your account, security preferences, and personal data.</p>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-10 overflow-x-auto hide-scrollbar gap-6">
                <button onClick={() => setActiveTab('account')} className={`pb-4 px-2 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${activeTab === 'account' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Account</button>
                <button onClick={() => setActiveTab('security')} className={`pb-4 px-2 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${activeTab === 'security' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Security</button>
                <button onClick={() => setActiveTab('billing')} className={`pb-4 px-2 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${activeTab === 'billing' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>Billing & Usage</button>
                <button onClick={() => setActiveTab('api')} className={`pb-4 px-2 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${activeTab === 'api' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>API Keys</button>
            </div>
            <div className="fade-in">{renderTabContent()}</div>
        </div>
    );
};
