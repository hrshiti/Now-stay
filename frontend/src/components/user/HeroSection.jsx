import React, { useState, useEffect } from 'react';
import { Search, Menu, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NowStayLogo from '../ui/NowStayLogo';
import MobileMenu from '../../components/ui/MobileMenu';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';
import HomeSearchModal from '../../components/modals/HomeSearchModal';

const HeroSection = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);

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
        fetchWallet();
    }, []);

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
        fetchWallet();
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
        <section className={`relative w-full px-5 pt-4 pb-2 flex flex-col gap-4 md:gap-6 md:pt-8 md:pb-10 bg-transparent transition-all duration-300`}>

            {/* 1. Header Row (Hides on Scroll) */}
            <div className={`flex md:hidden items-center justify-between relative h-24 transition-all duration-300 ${isSticky ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 mb-0'}`}>
                
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

            {/* 2. Search Bar - Sticky Logic */}
            <div className={`
                 w-full transition-all duration-300 z-50 flex justify-center mt-2
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

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            
            <HomeSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

        </section>
    );
};

export default HeroSection;
