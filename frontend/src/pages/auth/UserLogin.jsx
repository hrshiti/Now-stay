import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, Loader2, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NowStayLogo from '../../components/ui/NowStayLogo';
import { authService } from '../../services/apiService';
import toast from 'react-hot-toast';

const UserLogin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);

    // Pre-fill phone if coming from signup
    useEffect(() => {
        if (location.state?.phone) {
            setPhone(location.state.phone);
        }
    }, [location]);

    // Timer countdown effect
    useEffect(() => {
        let interval;
        if (step === 2 && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer === 0]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        try {
            setLoading(true);
            await authService.sendOtp(phone, 'login');
            setResendTimer(120);
            setCanResend(false);
            setStep(2);
        } catch (err) {
            // Check if account doesn't exist or is blocked
            if (err.isBlocked || err.response?.data?.isBlocked || err.status === 403) {
                setError(err.message || 'Your account has been blocked by admin. Please contact support.');
            } else if (err.requiresRegistration || err.response?.data?.requiresRegistration || err.status === 404) {
                setError('Account not found. Redirecting to signup...');
                setTimeout(() => {
                    navigate('/signup', { state: { phone } });
                }, 1500);
            } else {
                setError(err.message || 'Failed to send OTP');
            }
            console.error('Send OTP Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return; // Only allow numbers

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        try {
            setLoading(true);
            setError('');
            await authService.sendOtp(phone, 'login');
            setResendTimer(120);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']); // Clear OTP
            toast.success('OTP sent successfully!');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        try {
            setLoading(true);
            await authService.verifyOtp({ phone, otp: otpString });

            // Trigger FCM token re-registration in App.jsx using the cached token
            // This avoids requesting permission again and ensures the token is saved for the now-logged-in user
            try {
                window.dispatchEvent(new CustomEvent('fcm:register'));
            } catch (fcmError) {
                console.warn('[FCM] Could not dispatch register event', fcmError);
            }

            // Redirect back to the page the user was trying to access, or home
            const redirectTo = location.state?.from?.pathname || '/';
            navigate(redirectTo, { replace: true });
        } catch (err) {
            // Check if account is blocked or not found
            if (err.isBlocked || err.response?.data?.isBlocked || err.status === 403) {
                setError(err.message || 'Your account has been blocked by admin. Please contact support.');
            } else if (err.requiresRegistration || err.response?.data?.requiresRegistration || err.status === 404) {
                setError('Account not found. Redirecting to signup...');
                setTimeout(() => {
                    navigate('/signup', { state: { phone } });
                }, 1500);
            } else {
                setError(err.message || 'Verification failed');
            }
            console.error('Verify OTP Error:', err);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-emerald-100 flex items-center justify-center p-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Main Glassmorphic Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-8 md:p-10">
                    {/* Logo & Header */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                            className="inline-block mb-4"
                        >
                            <NowStayLogo size="lg" />
                        </motion.div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-400 text-xs font-medium mt-1">Login to continue your journey</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 block ml-2">
                                            Phone Number
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-surface transition-colors">
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                placeholder="9876543210"
                                                maxLength={10}
                                                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-black text-gray-800 text-lg placeholder:text-gray-300 shadow-sm"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-red-500 text-[11px] font-black text-center bg-red-50/80 backdrop-blur-sm border border-red-100 py-2.5 rounded-xl"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-[1.5rem] font-black tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {loading ? (
                                            <Loader2 size={24} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span className="text-sm">Send OTP</span>
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="text-center mb-6">
                                    <div className="w-12 h-12 bg-emerald-50/80 rounded-[1rem] flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-sm">
                                        <Shield size={22} className="text-emerald-600" />
                                    </div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Enter OTP</h2>
                                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                                        Code sent to <span className="text-gray-900 font-black">+91 {phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="tel"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                className="w-10 h-12 text-center text-lg font-black border-2 border-gray-100 rounded-xl focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all bg-white/50"
                                            />
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        {canResend ? (
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                className="text-emerald-600 text-[11px] font-black hover:text-emerald-700 transition-colors bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm animate-bounce"
                                            >
                                                Resend Code
                                            </button>
                                        ) : (
                                            <p className="text-gray-400 text-[11px] font-bold bg-gray-50/80 inline-block px-4 py-1.5 rounded-full border border-gray-100">
                                                Resend in <span className="text-emerald-600 font-black tabular-nums">{Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}</span>
                                            </p>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-500 text-[11px] font-black text-center bg-red-50 py-2.5 rounded-xl border border-red-100"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <div className="space-y-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-[1.5rem] font-black text-sm shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {loading ? (
                                                <Loader2 size={24} className="animate-spin" />
                                            ) : (
                                                'Verify & Login'
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-full text-gray-400 text-[10px] font-bold hover:text-emerald-600 transition-colors pt-1"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sign Up Link */}
                    <div className="mt-6 pt-6 border-t border-gray-100/50 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            New to Now Stay?{' '}
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-emerald-600 font-black hover:underline"
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UserLogin;
