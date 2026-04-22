import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2, Shield, User, Gift } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NowStayLogo from '../../components/ui/NowStayLogo';
import { authService } from '../../services/apiService';
import toast from 'react-hot-toast';

const UserSignup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1); // 1: Enter Details, 2: Enter OTP
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        referralCode: ''
    });
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);

    // Pre-fill phone if coming from login or capture referral code
    useEffect(() => {
        if (location.state?.phone) {
            setFormData(prev => ({ ...prev, phone: location.state.phone }));
        }

        // Check for stored referral code
        const storedCode = localStorage.getItem('referralCode');
        if (storedCode && !formData.referralCode) {
            console.log(`[REFERRAL_DEBUG] Found stored code in localStorage: ${storedCode}`);
            setFormData(prev => ({ ...prev, referralCode: storedCode }));
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
    }, [step, resendTimer === 0]); // Re-run when step changes or timer hits 0

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || formData.name.length < 3) {
            setError('Please enter your full name');
            return;
        }

        if (formData.phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            await authService.sendOtp(formData.phone, 'register', 'user', formData.email);
            setResendTimer(120);
            setCanResend(false);
            setStep(2);
        } catch (err) {
            // Check if account already exists
            const errorMessage = err.message || '';
            const isDuplicate = err.requiresLogin || err.status === 409 || errorMessage.toLowerCase().includes('already exists') || errorMessage.toLowerCase().includes('already registered');

            if (isDuplicate) {
                setError(`${errorMessage} Redirecting to login...`);
                setTimeout(() => {
                    navigate('/login', { state: { phone: formData.phone, from: location.state?.from } });
                }, 2000);
            } else {
                setError(errorMessage || 'Failed to send OTP');
            }
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
            await authService.sendOtp(formData.phone, 'register');
            setResendTimer(120);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']); // Clear OTP
            toast.success('OTP sent successfully!');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
            toast.error(err.message || 'Failed to resend OTP');
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
            // Send name (required), phone, otp, and email (optional)
            const payload = {
                phone: formData.phone,
                otp: otpString,
                name: formData.name,
                email: formData.email || undefined, // Only send if provided
                referralCode: formData.referralCode || undefined
            };
            console.log(`[REFERRAL_DEBUG] Verifying OTP with payload:`, payload);
            await authService.verifyOtp(payload);

            // Register FCM token for newly created user
            try {
                window.dispatchEvent(new CustomEvent('fcm:register'));
            } catch (fcmErr) {
                console.warn('[FCM] Could not dispatch register event after signup', fcmErr);
            }

            // Clear stored referral code after successful use
            console.log(`[REFERRAL_DEBUG] Registration successful, clearing localStorage referralCode`);
            localStorage.removeItem('referralCode');
            const redirectTo = location.state?.from?.pathname || '/';
            const redirectState = location.state?.from?.state || {};
            navigate(redirectTo, { replace: true, state: redirectState });
        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-emerald-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-sm z-10"
            >
                {/* Unified Glassmorphic Card */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-6 md:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="inline-block mb-3"
                        >
                            <NowStayLogo size="lg" />
                        </motion.div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Create Account</h1>
                        <p className="text-gray-400 text-[11px] font-medium mt-1">Join thousands of happy travelers</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <form onSubmit={handleSendOTP} className="space-y-4">
                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                            Full Name
                                        </label>
                                        <div className="relative group">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-surface transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[0-9]/g, '') })}
                                                placeholder="Sakshi"
                                                className="w-full pl-11 pr-4 py-3 bg-white/50 border-2 border-transparent rounded-[1.2rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-gray-800 text-sm placeholder:text-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                            Phone Number
                                        </label>
                                        <div className="relative group">
                                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-surface transition-colors" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                                placeholder="9876543210"
                                                maxLength={10}
                                                className="w-full pl-11 pr-4 py-3 bg-white/50 border-2 border-transparent rounded-[1.2rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-gray-800 text-sm placeholder:text-gray-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                                            Email <span className="text-[9px] font-medium opacity-60">(Optional)</span>
                                        </label>
                                        <div className="relative group">
                                            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-surface transition-colors" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                                                placeholder="you@example.com"
                                                className="w-full pl-11 pr-4 py-3 bg-white/50 border-2 border-transparent rounded-[1.2rem] focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold text-gray-800 text-sm placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    {/* Referral Code (Extra Compact) */}
                                    <div className="bg-emerald-50/50 p-3 rounded-[1.2rem] border border-emerald-100">
                                        <label className="block text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1.5 ml-1">
                                            Referral (Optional)
                                        </label>
                                        <div className="relative">
                                            <Gift size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                                            <input
                                                type="text"
                                                value={formData.referralCode}
                                                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                                                placeholder="FRIEND100"
                                                className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-xl focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-emerald-200 font-bold tracking-widest text-emerald-900 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-500 text-[10px] font-black text-center bg-red-50 py-2 rounded-xl"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-[1.4rem] font-black shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span className="text-sm">Continue</span>
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
                                <div className="text-center mb-4">
                                    <div className="w-10 h-10 bg-emerald-50/80 rounded-[0.8rem] flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-sm">
                                        <Shield size={20} className="text-emerald-600" />
                                    </div>
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Verify OTP</h2>
                                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                        Code sent to <span className="text-gray-900 font-black">+91 {formData.phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div className="flex gap-1 justify-center">
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
                                                className="w-10 h-11 text-center text-lg font-black border-2 border-gray-100 rounded-xl focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all bg-white/50"
                                            />
                                        ))}
                                    </div>

                                    <div className="text-center h-5 flex items-center justify-center">
                                        {canResend ? (
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                className="text-emerald-600 text-[10px] font-black hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"
                                            >
                                                Resend OTP
                                            </button>
                                        ) : (
                                            <p className="text-gray-400 text-[10px] font-bold">
                                                Resend OTP in <span className="text-emerald-600 font-black tabular-nums">{Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}</span>
                                            </p>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-red-500 text-[10px] font-black text-center bg-red-50 py-1.5 rounded-xl"
                                        >
                                            {error}
                                        </motion.p>
                                    )}

                                    <div className="space-y-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-[1.2rem] font-black shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-black text-sm"
                                        >
                                            {loading ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-full text-gray-400 text-[10px] font-bold hover:text-emerald-600 transition-colors py-1"
                                        >
                                            Change Details
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer link in card */}
                    <div className="mt-6 pt-6 border-t border-gray-100/50 text-center">
                        <p className="text-gray-400 text-xs font-medium">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login', { state: { from: location.state?.from } })}
                                className="text-emerald-600 font-black hover:underline"
                            >
                                Login
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UserSignup;
