
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';
import { GoogleIcon } from './icons/GoogleIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeOffIcon } from './icons/EyeOffIcon';
import { API_BASE_URL } from '../constants';

// Defining what props this component needs. It just needs a function to call when login works.
interface LoginProps {
    onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    // State to track if we are in "Login" mode or "Sign Up" mode
    const [isLogin, setIsLogin] = useState(true);

    // State to track if we are using Phone Login instead of Email
    const [isPhoneLogin, setIsPhoneLogin] = useState(false);

    // Keeping all my form inputs in one place so it's cleaner
    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '', phone: '', otp: '' });

    // Toggles for showing/hiding the password text
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Error message to show the user if something goes wrong
    const [error, setError] = useState('');

    // Loading state to disable buttons while we wait for the server
    const [isLoading, setIsLoading] = useState(false);

    // Success message for when things go right (like sending an OTP)
    const [successMessage, setSuccessMessage] = useState('');

    // Tracks if the OTP code has been sent to the user's phone
    const [otpSent, setOtpSent] = useState(false);

    // Helper function to update form data when the user types
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // This effect sets up the Google Login button.
    // It runs whenever we switch modes (like going to Phone login and back).
    React.useEffect(() => {
        // @ts-ignore
        if (window.google && !isPhoneLogin) {
            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: "1004303380810-vpe899e2sdqhike9s948q8146e5v9p37.apps.googleusercontent.com", // I need to put the real ID here later
                callback: handleGoogleCallback
            });
            // @ts-ignore
            window.google.accounts.id.renderButton(
                document.getElementById("google-btn"),
                { theme: "outline", size: "large", width: "100%" }
            );
        }
    }, [isPhoneLogin]);

    // What happens when Google says "Login Successful"
    const handleGoogleCallback = async (response: any) => {
        try {
            // Send the Google token to my backend to verify it
            const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });
            const data = await res.json();
            if (data.token) {
                // If backend gives me a token, I'm logged in!
                onLoginSuccess(data.token);
            } else {
                setError("Google Login Failed");
            }
        } catch (err) {
            console.error(err);
            setError("Google Login Failed");
        }
    };

    // Special handler for the Phone Login flow
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // If OTP is already sent, I need to verify it. If not, I need to send it.
            const endpoint = otpSent ? '/otp/verify' : '/otp/send';
            const payload = otpSent
                ? { phone: formData.phone, code: formData.otp }
                : { phone: formData.phone };

            const res = await fetch(`${API_BASE_URL}/api/auth${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Something went wrong');

            if (!otpSent) {
                // Code sent! Now show the OTP input field
                setOtpSent(true);
                setSuccessMessage(`Code sent to ${formData.phone}`);
            } else {
                // Code verified! Log the user in
                onLoginSuccess(data.token);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Main handler for Email/Password Login and Register
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // If we are in phone mode, use the other function
        if (isPhoneLogin) return handlePhoneSubmit(e);

        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        // Simple check to make sure passwords match during sign up
        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        // Decide which backend endpoint to hit
        const endpoint = isLogin ? '/login' : '/register';
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
                // Login worked! Let the app know.
                onLoginSuccess(data.token);
            } else {
                // Registration worked! Ask them to sign in now.
                setSuccessMessage('Welcome aboard! Please sign in to start your journey.');
                setIsLogin(true);
            }
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Styling for inputs to keep them consistent
    const inputClasses = "mt-1 block w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3.5 transition duration-200 ease-in-out hover:shadow-md";
    const labelClasses = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 ml-1";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background blobs to make it look fancy */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/30 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Main Card Container with entry animation */}
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-indigo-500/20 p-8 space-y-6 ring-1 ring-black/5">
                    <div className="flex justify-center mb-2">
                        {/* The Logo component handles its own sizing */}
                        <Logo size="xxl" className="transform hover:scale-105 transition-transform duration-300" />
                    </div>

                    {/* Animated Header Text */}
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={isPhoneLogin ? 'phone' : (isLogin ? 'login' : 'register')}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="text-center text-3xl font-black text-gray-900 dark:text-white tracking-tight"
                        >
                            {isPhoneLogin ? (otpSent ? 'Enter Verification Code' : 'Mobile Access') : (isLogin ? 'Welcome Back, Legend!' : 'Join the Revolution')}
                        </motion.h2>
                    </AnimatePresence>

                    {/* Error and Success Messages with slide animation */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl p-3"
                            >
                                <p className="text-center text-sm font-medium text-red-600">{error}</p>
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-green-50/80 backdrop-blur-sm border border-green-100 rounded-xl p-3"
                            >
                                <p className="text-center text-sm font-medium text-green-600">{successMessage}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* This AnimatePresence handles the sliding between different forms */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isPhoneLogin ? 'phone-form' : (isLogin ? 'login-form' : 'register-form')}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                {isPhoneLogin ? (
                                    <>
                                        {!otpSent ? (
                                            <div>
                                                <label className={labelClasses}>Phone Number</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <PhoneIcon className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                        className={inputClasses + " pl-10"}
                                                        placeholder="+1 (555) 000-0000"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className={labelClasses}>Verification Code</label>
                                                <input
                                                    type="text"
                                                    name="otp"
                                                    value={formData.otp}
                                                    onChange={handleInputChange}
                                                    required
                                                    className={inputClasses + " text-center tracking-[0.5em] text-2xl font-mono"}
                                                    placeholder="000000"
                                                    maxLength={6}
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
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
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 focus:outline-none transition-colors"
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
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-indigo-500 focus:outline-none transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* The main action button with hover effects */}
                        <motion.button
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/30 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (isPhoneLogin ? (otpSent ? 'Verify & Access' : 'Send Verification Code') : (isLogin ? 'Sign In' : 'Create Account'))}
                        </motion.button>
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
                        <div id="google-btn" className={isPhoneLogin ? 'hidden' : 'block'}></div>
                        {isPhoneLogin && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setIsPhoneLogin(false); setOtpSent(false); }}
                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <span className="mr-2">📧</span> Email
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setIsPhoneLogin(!isPhoneLogin); setOtpSent(false); }}
                            className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isPhoneLogin ? 'col-span-2' : ''}`}
                        >
                            <PhoneIcon className="h-5 w-5 mr-2 text-gray-500" />
                            {isPhoneLogin ? 'Cancel' : 'Phone'}
                        </motion.button>
                    </div>

                    {!isPhoneLogin && (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                            {isLogin ? "New to the platform?" : "Already a member?"}
                            <button
                                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}
                                className="font-bold text-indigo-600 dark:text-blue-300 hover:text-indigo-500 dark:hover:text-white ml-1 transition-colors hover:underline focus:outline-none"
                            >
                                {isLogin ? 'Join now' : 'Sign in'}
                            </button>
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
