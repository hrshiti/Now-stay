import React, { useState, useEffect, useRef } from 'react';
import { Bell, LogOut, ChevronRight, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { authService, hotelService } from '../../../services/apiService';
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

                <div className="mt-6 text-center">
                    <p className="text-[10px] text-gray-400">NowStay Partner App v1.0.2</p>
                </div>

            </main>
        </div>
    );
};

export default PartnerSettings;
