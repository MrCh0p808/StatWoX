'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Mail, Phone, User, ArrowLeft, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

export function LoginForm() {
    const router = useRouter();
    const { setToken, setUser } = useAuthStore();
    const [isLogin, setIsLogin] = useState(true);
    const [isPhoneMode, setIsPhoneMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phone: '',
        otp: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin
                ? { email: formData.email, password: formData.password }
                : { email: formData.email, password: formData.password, username: formData.username };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                if (isLogin) {
                    setToken(data.data.token);
                    setUser(data.data.user);
                    router.push('/feed');
                } else {
                    setSuccess('Account created! Please log in.');
                    setIsLogin(true);
                }
            } else {
                setError(data.message || 'An error occurred');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!otpSent) {
                const response = await fetch('/api/auth/otp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: formData.phone }),
                });

                const data = await response.json();

                if (data.success) {
                    setOtpSent(true);
                    setSuccess('OTP sent to your phone!');
                } else {
                    setError(data.message || 'Failed to send OTP');
                }
            } else {
                const response = await fetch('/api/auth/otp/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: formData.phone, code: formData.otp }),
                });

                const data = await response.json();

                if (data.success) {
                    setToken(data.data.token);
                    setUser(data.data.user);
                    router.push('/feed');
                } else {
                    setError(data.message || 'Invalid OTP');
                }
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-[#111827]/80 backdrop-blur-xl rounded-3xl border border-[#1e3a5f] p-8 shadow-2xl shadow-[#00d4ff]/5 relative overflow-hidden">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#00d4ff]/20 via-[#0066ff]/20 to-[#00ff88]/20 opacity-50 blur-xl" />

                    <div className="text-center mb-8 relative flex flex-col items-center">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="w-[280px] h-auto mx-auto mb-6 flex justify-center drop-shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                        >
                            <img src="/logo.png" alt="StatWoX Logo" className="w-full h-auto object-contain pointer-events-none" />
                        </motion.div>
                        <p className="text-[#94a3b8]">Create surveys, gather insights</p>
                    </div>

                    <Tabs defaultValue="email" className="mb-6">
                        <TabsList className="grid w-full grid-cols-2 bg-[#1e3a5f]/30 h-12 p-1">
                            <TabsTrigger
                                value="email"
                                onClick={() => { setIsPhoneMode(false); setOtpSent(false); }}
                                className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d4ff] data-[state=active]:to-[#0066ff] data-[state=active]:text-white text-[#94a3b8] transition-all"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </TabsTrigger>
                            <TabsTrigger
                                value="phone"
                                onClick={() => setIsPhoneMode(true)}
                                className="flex items-center gap-2 h-10 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#00d4ff] data-[state=active]:to-[#0066ff] data-[state=active]:text-white text-[#94a3b8] transition-all"
                            >
                                <Phone className="w-4 h-4" />
                                Phone
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="email">
                            <AnimatePresence mode="wait">
                                <motion.form
                                    key={isLogin ? 'login' : 'register'}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleEmailSubmit}
                                    className="space-y-4"
                                >
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Label htmlFor="username" className="text-[#94a3b8] text-sm">Username</Label>
                                            <div className="relative mt-1.5">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                                <Input
                                                    id="username"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleChange}
                                                    placeholder="johndoe"
                                                    className="pl-10 bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-11 transition-all"
                                                    required
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    <div>
                                        <Label htmlFor="email" className="text-[#94a3b8] text-sm">Email</Label>
                                        <div className="relative mt-1.5">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                placeholder="you@example.com"
                                                className="pl-10 bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-11 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="password" className="text-[#94a3b8] text-sm">Password</Label>
                                        <div className="relative mt-1.5">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] pr-10 focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-11 transition-all"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#00d4ff] transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Label htmlFor="confirmPassword" className="text-[#94a3b8] text-sm">Confirm Password</Label>
                                            <Input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="••••••••"
                                                className="mt-1.5 bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-11 transition-all"
                                                required
                                            />
                                        </motion.div>
                                    )}

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                        {success && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                                            >
                                                <CheckCircle className="w-4 h-4 shrink-0" />
                                                {success}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:from-[#00c8ff] hover:to-[#0088ff] text-white shadow-lg shadow-[#00d4ff]/25 h-11 font-medium btn-hover-lift relative overflow-hidden group"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <motion.span
                                                    initial={{ y: 0 }}
                                                    whileHover={{ y: -2 }}
                                                    className="flex items-center justify-center gap-2"
                                                >
                                                    {isLogin ? 'Sign In' : 'Create Account'}
                                                    <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </motion.span>
                                            </>
                                        )}
                                    </Button>
                                </motion.form>
                            </AnimatePresence>

                            <p className="mt-6 text-center text-sm text-[#94a3b8]">
                                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                <button
                                    onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                                    className="text-[#00d4ff] hover:text-[#00c8ff] font-medium transition-colors hover:underline underline-offset-4"
                                >
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-[#64748b] bg-[#1e3a5f]/30 rounded-lg py-2 px-3">
                                    💡 Demo: <span className="text-[#94a3b8]">demo@statwox.com</span> / <span className="text-[#94a3b8]">Demo1234</span>
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="phone">
                            <form onSubmit={handlePhoneSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="phone" className="text-[#94a3b8] text-sm">Phone Number</Label>
                                    <div className="relative mt-1.5">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 000-0000"
                                            className="pl-10 bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-11 transition-all"
                                            required
                                            disabled={otpSent}
                                        />
                                    </div>
                                </div>

                                {otpSent && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                    >
                                        <Label htmlFor="otp" className="text-[#94a3b8] text-sm">Verification Code</Label>
                                        <Input
                                            id="otp"
                                            name="otp"
                                            type="text"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            placeholder="Enter 6-digit code"
                                            className="mt-1.5 bg-[#0a0e1a] border-[#1e3a5f] text-white placeholder:text-[#64748b] text-center text-2xl tracking-widest focus:border-[#00d4ff] focus:ring-1 focus:ring-[#00d4ff]/50 h-14 transition-all"
                                            maxLength={6}
                                            required
                                        />
                                    </motion.div>
                                )}

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-red-400 text-sm flex items-center gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {error}
                                    </motion.p>
                                )}
                                {success && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-green-400 text-sm flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        {success}
                                    </motion.p>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0066ff] hover:from-[#00c8ff] hover:to-[#0088ff] text-white shadow-lg shadow-[#00d4ff]/25 h-11 font-medium btn-hover-lift"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : null}
                                    {otpSent ? 'Verify Code' : 'Send Code'}
                                </Button>

                                {otpSent && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => { setOtpSent(false); setFormData({ ...formData, otp: '' }); }}
                                        className="w-full text-[#94a3b8] hover:text-white hover:bg-[#1e3a5f]/50 h-11"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Change Phone Number
                                    </Button>
                                )}
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>
            </motion.div>
        </div>
    );
}
