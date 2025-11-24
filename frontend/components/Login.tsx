
import React, { useState } from 'react';
import Logo from './Logo';
import { GoogleIcon } from './icons/GoogleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { API_BASE_URL } from '../constants';

interface LoginProps {
    onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // BACKEND NOTE: This bypasses the backend for testing.
    // You should remove or disable this button in production.
    const handleAdminLogin = () => {
        const mockToken = "mock-admin-token-" + Date.now();
        onLoginSuccess(mockToken);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        // Basic client-side validation
        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        // Hardcoded demo credentials for testing without a backend
        if (isLogin && formData.email === 'demo@statwox.com' && formData.password === 'password') {
            setTimeout(() => {
                onLoginSuccess('mock-demo-user-token');
                setIsLoading(false);
            }, 800);
            return;
        }

        // BACKEND NOTE: This determines which endpoint to hit.
        // Make sure your backend has routes for POST /api/auth/login and POST /api/auth/register
        const endpoint = isLogin ? '/login' : '/register';
        
        // Prepare the data to send to the server
        const payload = isLogin
            ? { email: formData.email, password: formData.password }
            : { email: formData.email, password: formData.password, username: formData.username };

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            if (isLogin) {
                // Success!Pass the token up to App.tsx to store it
                onLoginSuccess(data.token);
            } else {
                setSuccessMessage('Account created successfully! Please sign in.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3.5 transition duration-150 ease-in-out";
    const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-8 space-y-6 ring-1 ring-black/5">
                    <div className="flex justify-center mb-6">
                        <Logo size="xl" />
                    </div>
                    <h2 className="text-center text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isLogin ? 'Login To Continue' : 'Create Account'}
                    </h2>
                    {error && <div className="bg-red-50 border border-red-100 rounded-xl p-3"><p className="text-center text-sm font-medium text-red-600">{error}</p></div>}
                    {successMessage && <div className="bg-green-50 border border-green-100 rounded-xl p-3"><p className="text-center text-sm font-medium text-green-600">{successMessage}</p></div>}
                    
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div>
                                <label className={labelClasses}>Username</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleInputChange} 
                                    required 
                                    className={inputClasses}
                                    placeholder="johndoe"
                                />
                            </div>
                        )}
                        <div>
                            <label className={labelClasses}>Email address</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                required 
                                className={inputClasses}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Password</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    required 
                                    className={inputClasses + " pr-10"}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        {!isLogin && (
                            <div>
                                <label className={labelClasses}>Confirm Password</label>
                                <div className="relative">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleInputChange} 
                                        required 
                                        className={inputClasses + " pr-10"}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 hover:-translate-y-0.5"
                        >
                            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 text-gray-500 dark:text-gray-400 bg-white/0 backdrop-blur-md rounded">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all transform hover:-translate-y-0.5">
                            <GoogleIcon className="w-5 h-5 mr-2" />
                            <span>Google</span>
                        </button>
                        <button className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all transform hover:-translate-y-0.5">
                            <PhoneIcon className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                            <span>Phone</span>
                        </button>
                    </div>

                     <div className="mt-4">
                        <button
                            onClick={handleAdminLogin}
                            className="w-full inline-flex justify-center items-center py-3 px-4 border border-dashed border-indigo-300 dark:border-indigo-400/30 rounded-xl shadow-sm bg-indigo-50 dark:bg-indigo-500/10 text-sm font-bold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 focus:outline-none transition-colors"
                        >
                           <span>⚡ Developer Admin Access</span>
                        </button>
                    </div>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }} 
                            className="font-bold text-indigo-600 dark:text-blue-300 hover:text-indigo-500 dark:hover:text-white ml-1 transition-colors hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
