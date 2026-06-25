import React, { useState, useEffect } from 'react';
import { Menu, Wallet, Bell, ChevronLeft, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NowStayLogo from '../../../components/ui/NowStayLogo';
import PartnerSidebar from './PartnerSidebar';
import { hotelService } from '../../../services/apiService';
import walletService from '../../../services/walletService';
import subscriptionService from '../../../services/subscriptionService';

const PartnerHeader = ({ title, subtitle, showMenu = true }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [subscription, setSubscription] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const fetchWallet = async () => {
            try {
                const walletData = await walletService.getWallet({ viewAs: 'partner' });
                if (walletData.success && walletData.wallet) {
                    setWalletBalance(walletData.wallet.balance);
                }
            } catch (error) {
                console.error('Failed to fetch wallet', error);
            }
        };

        const fetchNotifications = async () => {
            try {
                // Fetch Notifications
                const notifData = await hotelService.getNotifications(1, 1);
                if (notifData.success && notifData.meta) {
                    setUnreadCount(notifData.meta.unreadCount);
                }
            } catch (error) {
                console.error('Failed to fetch notifications', error);
            }
        };

        const fetchSubscription = async () => {
            try {
                const subData = await subscriptionService.getMySubscription();
                if (subData.success) {
                    setSubscription(subData.subscription);
                }
            } catch (error) {
                console.error('Failed to fetch subscription', error);
            }
        };

        fetchWallet();
        fetchNotifications();
        fetchSubscription();
    }, []);

    const token = localStorage.getItem('token');

    return (
        <>
            <div className="flex items-center justify-between h-24 px-4 pt-2 bg-white/50 backdrop-blur-sm sticky top-0 z-30 border-b border-gray-100/50">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {token ? (
                        showMenu ? (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition shadow-sm border border-gray-100 active:scale-95 shrink-0"
                            >
                                <Menu size={18} className="text-[#003836]" />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition shadow-sm border border-gray-100 active:scale-95 shrink-0"
                            >
                                <ChevronLeft size={18} className="text-[#003836]" />
                            </button>
                        )
                    ) : (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 rounded-full bg-white hover:bg-gray-100 transition shadow-sm border border-gray-100 active:scale-95 shrink-0"
                        >
                            <ChevronLeft size={18} className="text-[#003836]" />
                        </button>
                    )}

                    <NowStayLogo size="md" />
                </div>

                {token && (
                    <div className="flex items-center gap-1.5 sm:gap-2 z-20">
                        <button
                            onClick={() => navigate('/hotel/notifications')}
                            className="relative p-1.5 rounded-full bg-white hover:bg-gray-100 transition shadow-sm border border-gray-100 active:scale-95"
                        >
                            <Bell size={18} className="text-[#003836]" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/hotel/wallet')}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="w-5 h-5 bg-[#0F172A] rounded-full flex items-center justify-center shrink-0">
                                <Wallet size={10} className="text-white" />
                            </div>
                            <div className="flex flex-col items-start leading-none sm:mr-0.5">
                                <span className="hidden sm:inline text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Wallet</span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-[#003836]">
                                    {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }).format(walletBalance)}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/hotel/subscriptions')}
                            className={`flex items-center transition-all active:scale-95 ${
                                subscription 
                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-full sm:px-2 sm:py-1 p-1.5 shadow-sm' 
                                    : 'bg-white border border-gray-100 hover:bg-gray-50 rounded-full sm:px-2 sm:py-1 p-1.5 shadow-sm'
                            }`}
                            title={subscription ? `Subscription: ${subscription.planId?.name}` : 'No Active Subscription (Free Plan)'}
                        >
                            <div className={`rounded-full flex items-center justify-center shrink-0 ${
                                subscription 
                                    ? 'bg-amber-500 text-white w-5 h-5' 
                                    : 'bg-gray-100 text-gray-500 w-5 h-5'
                            }`}>
                                <Crown size={10} />
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-none ml-1.5 mr-0.5">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Subscription</span>
                                <span className={`text-[10px] font-bold ${
                                    subscription ? 'text-amber-600' : 'text-gray-500'
                                }`}>
                                    {subscription ? subscription.planId?.name : 'Free Plan'}
                                </span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Render Sidebar Global to Header */}
            <PartnerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </>
    );
};

export default PartnerHeader;
