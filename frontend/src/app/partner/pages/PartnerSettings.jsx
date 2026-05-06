import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ChevronRight, CreditCard, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import PartnerHeader from '../components/PartnerHeader';
import { authService, hotelService, userService } from '../../../services/apiService';
import toast from 'react-hot-toast';

const SettingItem = ({ icon: Icon, label, type = "toggle", value, onChange }) => (
    <div className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
            <div className="text-gray-400">
                <Icon size={18} />
            </div>
            <span className="text-sm font-bold text-gray-700">{label}</span>
        </div>

        {type === "toggle" && (
            <button
                onClick={() => onChange(!value)}
                className={`w-10 h-6 rounded-full p-1 transition-colors ${value ? 'bg-[#0F172A]' : 'bg-gray-200'}`}
            >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </button>
        )}

        {type === "link" && (
            <ChevronRight size={16} className="text-gray-300" />
        )}

        {type === "value" && (
            <span className="text-xs font-bold text-gray-400">{value}</span>
        )}
    </div>
);

const PartnerSettings = () => {
    const listRef = useRef(null);
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            return {
                notifications: user.pushNotificationsEnabled !== false
            };
        }
        return { notifications: true };
    });
    const [updating, setUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [deletionReason, setDeletionReason] = useState('');
    const [deletionOtp, setDeletionOtp] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Sync with localStorage if it changes (e.g. background getMe finishes)
    useEffect(() => {
        const handleStorageChange = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setSettings(prev => ({
                    ...prev,
                    notifications: user.pushNotificationsEnabled !== false
                }));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        gsap.fromTo(listRef.current.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.4, ease: 'power2.out' }
        );
    }, []);

    const toggle = async (key) => {
        if (key === 'notifications') {
            const newValue = !settings.notifications;
            setSettings(prev => ({ ...prev, [key]: newValue }));
            
            try {
                setUpdating(true);
                const res = await hotelService.updateNotificationPreference(newValue);
                if (res.success) {
                    // Update local storage user object
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        user.pushNotificationsEnabled = newValue;
                        localStorage.setItem('user', JSON.stringify(user));
                    }
                    toast.success(`Notifications ${newValue ? 'enabled' : 'disabled'}`);
                }
            } catch (err) {
                // Revert on error
                setSettings(prev => ({ ...prev, [key]: !newValue }));
                toast.error('Failed to update preference');
            } finally {
                setUpdating(false);
            }
        } else {
            setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const handleLogout = () => {
        authService.logout();
        toast.success('Logged out successfully');
        navigate('/hotel/login');
    };

    const handleRequestDeletion = async () => {
        if (!deletionReason.trim()) {
            return toast.error('Please provide a reason for deletion');
        }

        try {
            setDeleteLoading(true);
            await userService.requestDeletion(deletionReason);
            setShowOtpStep(true);
            toast.success('Verification OTP sent to your email');
        } catch (error) {
            toast.error(error.message || 'Deletion request failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleVerifyDeletion = async () => {
        if (!deletionOtp || deletionOtp.length < 4) {
            return toast.error('Please enter a valid OTP');
        }

        try {
            setDeleteLoading(true);
            await userService.verifyDeletion(deletionOtp);
            toast.success('Account permanently deleted');
            authService.logout();
            window.location.href = '/hotel/login';
        } catch (error) {
            toast.error(error.message || 'Verification failed');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="Settings" subtitle="Preferences" />

            <main className="max-w-xl mx-auto px-4 pt-6">

                <div ref={listRef} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">

                    {/* Wallet Section */}
                    <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payments</span>
                    </div>
                    <Link to="/hotel/bank-details" className="block">
                        <SettingItem
                            icon={CreditCard}
                            label="Saved Bank Details"
                            type="link"
                        />
                    </Link>

                    {/* Account Section */}
                    <div className="bg-gray-50/50 px-4 py-2 border-b border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">General</span>
                    </div>
                    <SettingItem
                        icon={Bell}
                        label="Push Notifications"
                        value={settings.notifications}
                        onChange={() => !updating && toggle('notifications')}
                    />

                    <button 
                        onClick={handleLogout}
                        className="w-full text-left p-4 text-red-500 font-bold text-sm flex items-center gap-3 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 text-red-500 font-bold text-xs py-4 px-6 border border-red-50 rounded-[1.8rem] hover:bg-red-50 transition-all uppercase tracking-widest bg-white"
                    >
                        <Trash2 size={14} />
                        Delete Partner Account
                    </button>
                    <p className="mt-3 text-[9px] text-gray-400 text-center uppercase tracking-tighter px-4">
                        This action is irreversible. All properties and inventory will be deactivated.
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-400">NowStay Partner App v1.0.2</p>
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-sm rounded-[3rem] p-8 overflow-hidden relative shadow-2xl border-4 border-red-50"
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border-2 border-red-100/50">
                                        <AlertTriangle size={36} className="text-red-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-[#003836] mb-2 uppercase tracking-tight">
                                        {showOtpStep ? 'Verify OTP' : 'Delete Account?'}
                                    </h3>

                                    {!showOtpStep ? (
                                        <>
                                            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">
                                                Are you absolutely sure? This action is <span className="text-red-500 font-black">permanent</span> and will deactivate all your properties immediately.
                                            </p>
                                            <div className="w-full mb-6">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-2 ml-2">Reason for leaving</label>
                                                <textarea
                                                    value={deletionReason}
                                                    onChange={(e) => setDeletionReason(e.target.value)}
                                                    placeholder="Tell us why you want to delete your account..."
                                                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-[#003836] focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/30 transition-all resize-none h-24"
                                                />
                                            </div>
                                            <div className="flex flex-col w-full gap-3">
                                                <button
                                                    onClick={handleRequestDeletion}
                                                    disabled={deleteLoading}
                                                    className="w-full bg-red-500 text-white font-black py-4.5 rounded-[1.5rem] shadow-xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm uppercase tracking-widest"
                                                >
                                                    {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send Verification OTP'}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    disabled={deleteLoading}
                                                    className="w-full bg-gray-50 text-gray-600 font-black py-4 rounded-[1.5rem] active:scale-95 transition-all text-xs uppercase tracking-widest"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-500 leading-relaxed mb-6">
                                                Please enter the verification OTP sent to your registered email: <span className="font-bold text-[#0F172A]">{user.email}</span>
                                            </p>
                                            <div className="w-full mb-8">
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={deletionOtp}
                                                    onChange={(e) => setDeletionOtp(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="0000"
                                                    className="w-full text-center text-3xl font-black tracking-[0.5em] p-4 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-[#0F172A]/5 focus:border-[#0F172A]/20 transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col w-full gap-3">
                                                <button
                                                    onClick={handleVerifyDeletion}
                                                    disabled={deleteLoading}
                                                    className="w-full bg-[#0F172A] text-white font-black py-4.5 rounded-[1.5rem] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm uppercase tracking-widest"
                                                >
                                                    {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Permanently Delete'}
                                                </button>
                                                <button
                                                    onClick={() => setShowOtpStep(false)}
                                                    disabled={deleteLoading}
                                                    className="w-full bg-gray-50 text-gray-600 font-black py-4 rounded-[1.5rem] active:scale-95 transition-all text-xs uppercase tracking-widest"
                                                >
                                                    Back
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
};

export default PartnerSettings;
