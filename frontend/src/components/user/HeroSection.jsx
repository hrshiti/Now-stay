import React, { useState, useEffect } from 'react';
import { Search, Menu, Wallet, Smartphone, Download, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NowStayLogo from '../ui/NowStayLogo';
import MobileMenu from '../../components/ui/MobileMenu';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';
import HomeSearchModal from '../../components/modals/HomeSearchModal';
import { api } from '../../services/apiService';

const HeroSection = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [appLinks, setAppLinks] = useState([]);
    const [selectedAppModal, setSelectedAppModal] = useState(null);

    const placeholders = [
        "Search in Bucharest...",
        "Find luxury hotels...",
        "Book villas in Bali...",
        "Couple friendly stays...",
        "Search near Red Square..."
    ];

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) {
                    const walletData = await walletService.getWallet();
                    if (walletData.success && walletData.wallet) {
                        setWalletBalance(walletData.wallet.balance);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch wallet', error);
            }
        };

        const fetchAppLinks = async () => {
            try {
                const res = await api.get('/app-links');
                if (res.data && res.data.success) {
                    setAppLinks(res.data.appLinks || []);
                }
            } catch (error) {
                console.error('Failed to fetch app links', error);
            }
        };

        fetchWallet();
        fetchAppLinks();
    }, []);

    // Scroll Listener for Sticky & Header Logic
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            setIsSticky(scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSearchClick = () => {
        setIsSearchOpen(true);
    };

    return (
        <section className={`relative w-full px-4 pt-2 pb-1 flex flex-col gap-1.5 md:gap-3 md:pt-4 md:pb-6 bg-transparent transition-all duration-300`}>

            {/* 1. Header Row (Hides on Scroll) */}
            <div className={`flex md:hidden items-center justify-between relative py-2 transition-all duration-300 ${isSticky ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 mb-0'}`}>
                
                <div className="flex items-center gap-4">
                    {/* Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="p-1.5 rounded-full bg-white/40 hover:bg-white/60 transition shadow-sm"
                    >
                        <Menu size={18} className="text-surface" />
                    </button>

                    <div className="flex items-center">
                        <NowStayLogo size="md" />
                    </div>
                </div>

                {/* Wallet Balance Display */}
                <button
                    onClick={() => navigate('/wallet')}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm active:scale-95 transition-transform"
                >
                    <div className="w-5 h-5 bg-surface rounded-full flex items-center justify-center">
                        <Wallet size={10} className="text-white" />
                    </div>
                    <div className="flex flex-col items-start leading-none mr-0.5">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-wide">Wallet</span>
                        <span className="text-[10px] font-bold text-surface">
                            {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(walletBalance)}
                        </span>
                    </div>
                </button>
            </div>

            {/* App Links - Horizontal Scrollable Row for Mobile & Desktop */}
            {appLinks.length > 0 && !isSticky && (
                <div className="w-full flex justify-start items-start gap-4 overflow-x-auto no-scrollbar py-1 my-0.5 z-10 animate-fadeIn px-1 flex-nowrap">
                    {appLinks.map((app) => (
                        <button
                            key={app._id}
                            onClick={() => setSelectedAppModal(app)}
                            className="flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer group p-0.5 shrink-0"
                            title={`Download ${app.name}`}
                        >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[22%] overflow-hidden shadow-md border border-white/80 bg-white flex items-center justify-center group-hover:shadow-lg transition-all ring-1 ring-black/10">
                                <img
                                    src={app.logo}
                                    alt={app.name}
                                    className="w-full h-full object-cover rounded-[22%]"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/80?text=App';
                                    }}
                                />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-gray-800 tracking-tight text-center leading-tight max-w-[85px] sm:max-w-[100px] break-words whitespace-normal">
                                {app.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* 2. Search Bar - Sticky Logic */}
            <div className={`
                 w-full transition-all duration-300 z-50 flex justify-center mt-0.5
                 ${isSticky ? 'fixed top-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl shadow-md border-b border-surface/5' : 'relative'}
            `}>
                <div
                    onClick={handleSearchClick}
                    className={`
                    w-[90%] md:w-auto min-w-[320px] max-w-md
                    bg-white
                    ${isSticky ? 'rounded-full shadow-inner bg-gray-100/50 mx-auto' : 'rounded-[30px] shadow-lg border border-gray-100'}
                    flex items-center justify-between
                    px-2.5 py-2
                    relative
                    cursor-pointer
                    transition-all duration-300 transform active:scale-95
                `}>
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-11 h-11 md:w-12 md:h-12 bg-[#effaf8] rounded-full flex items-center justify-center shrink-0">
                            <Search size={20} className="text-[#008f81] stroke-[2.5]" />
                        </div>
                        
                        <div className="flex flex-col justify-center flex-1 overflow-hidden">
                            <span className="text-[15px] md:text-[17px] font-black text-gray-800 leading-tight truncate">Where to?</span>
                            <span className="text-[11px] md:text-[13px] font-medium text-gray-400 truncate">Anywhere • Any week • Add guests</span>
                        </div>
                        
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shrink-0 shadow-sm mr-1">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14"></line>
                                <line x1="4" y1="10" x2="4" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12" y2="3"></line>
                                <line x1="20" y1="21" x2="20" y2="16"></line>
                                <line x1="20" y1="12" x2="20" y2="3"></line>
                                <line x1="1" y1="14" x2="7" y2="14"></line>
                                <line x1="9" y1="8" x2="15" y2="8"></line>
                                <line x1="17" y1="16" x2="23" y2="16"></line>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder Spacer only when sticky to prevent content jump */}
            {isSticky && (
                <div className="h-11 w-full md:h-14"></div>
            )}

            {/* App Download Store Selector Popup Modal */}
            {selectedAppModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 text-center animate-scaleUp">
                        {/* Close Button */}
                        <button
                            onClick={() => setSelectedAppModal(null)}
                            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                        >
                            <X size={20} />
                        </button>

                        {/* App Header */}
                        <div className="flex flex-col items-center justify-center mb-6 pt-2">
                            <img
                                src={selectedAppModal.logo}
                                alt={selectedAppModal.name}
                                className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-100 shadow-md mb-3"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/80?text=App';
                                }}
                            />
                            <h3 className="text-xl font-black text-gray-900 leading-tight">
                                {selectedAppModal.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                Choose your store to download the mobile app
                            </p>
                        </div>

                        {/* Store Choice Buttons matching Image 2 */}
                        <div className="flex items-center justify-center gap-3 pt-2">
                            {/* Google Play Store */}
                            {selectedAppModal.playStoreUrl ? (
                                <a
                                    href={selectedAppModal.playStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setSelectedAppModal(null)}
                                    className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#1e293b] border border-gray-800 text-white shadow-md hover:shadow-lg active:scale-95 transition-all group"
                                >
                                    <img
                                        src="/WhatsApp_Image_2026-05-09_at_1.50.21_PM-removebg-preview.png"
                                        alt="Google Play"
                                        className="w-5 h-5 object-contain transition-transform group-hover:scale-110 shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">
                                        Google Play
                                    </span>
                                </a>
                            ) : (
                                <div className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 font-medium text-center">
                                    Google Play unavailable
                                </div>
                            )}

                            {/* Apple App Store */}
                            {selectedAppModal.appStoreUrl ? (
                                <a
                                    href={selectedAppModal.appStoreUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setSelectedAppModal(null)}
                                    className="flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0F172A] hover:bg-[#1e293b] border border-gray-800 text-white shadow-md hover:shadow-lg active:scale-95 transition-all group"
                                >
                                    <img
                                        src="/WhatsApp_Image_2026-05-11_at_12.14.22_PM-removebg-preview.png"
                                        alt="App Store"
                                        className="w-5 h-5 object-contain transition-transform group-hover:scale-110 shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">
                                        App Store
                                    </span>
                                </a>
                            ) : (
                                <div className="flex-1 p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-400 font-medium text-center">
                                    App Store unavailable
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            <HomeSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        </section>
    );
};

export default HeroSection;
