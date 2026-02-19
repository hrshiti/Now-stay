import React, { useState, useEffect } from 'react';
import { Search, Menu, Wallet } from 'lucide-react';
import MobileMenu from '../../components/ui/MobileMenu';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';
import SearchWidget from './SearchWidget';

const HeroSection = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false); // New State for Modal

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
        <section className={`relative w-full pb-2 flex flex-col gap-4 md:gap-6 bg-transparent`}>

            {/* 1. Header Row (Hides when Sticky Header appears) */}
            <div className={`
                flex md:hidden items-center justify-between relative h-20 px-5 pt-4 transition-opacity duration-300 z-40
                ${isSticky ? 'opacity-0 pointer-events-none' : 'opacity-100'}
            `}>
                {/* Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 rounded-full bg-white/40 hover:bg-white/60 transition shadow-sm backdrop-blur-md"
                >
                    <Menu size={20} className="text-surface" />
                </button>

                {/* Logo */}
                <div className="flex flex-col items-start leading-none ml-3">
                    <span className="text-xl font-black tracking-tighter text-slate-900 flex items-center gap-0.5">
                        NOW<span className="text-teal-600">STAY</span>
                    </span>
                    <div className="h-1 w-6 bg-teal-600 rounded-full"></div>
                </div>

                <div className="flex-1" />

                {/* Search Trigger Icon (Header) */}
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="mr-3 p-2 rounded-full bg-white/40 hover:bg-white/60 transition shadow-sm backdrop-blur-md"
                >
                    <Search size={20} className="text-surface" />
                </button>

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

            {/* 2. Compact Search Trigger (Hero Area) - Replaces Large Widget */}
            <div className="w-full z-10 px-5 mt-2">
                <div
                    onClick={() => setIsSearchOpen(true)}
                    className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all hover:shadow-xl"
                >
                    <div className="p-2.5 bg-teal-50 rounded-xl">
                        <Search size={20} className="text-teal-600" />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <span className="text-sm font-bold text-gray-800">Where to?</span>
                        <span className="text-xs text-gray-400">Anywhere • Any week • Add guests</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-full border border-gray-100">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* 3. Sticky Header Search (Appears on Scroll) */}
            <div className={`
                 fixed top-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl shadow-md border-b border-surface/5 z-50 transform transition-transform duration-300
                 ${isSticky ? 'translate-y-0' : '-translate-y-full'}
            `}>
                <div
                    onClick={handleSearchClick}
                    className={`
                    w-full 
                    bg-gray-100/50
                    h-10 rounded-full shadow-inner mx-auto max-w-7xl
                    flex items-center 
                    px-3 md:px-4
                    gap-2 md:gap-3
                    cursor-pointer
                `}>
                    <Search size={18} className="text-gray-400" />
                    <span className="text-gray-400 font-normal text-xs md:text-sm truncate flex-1">
                        Search hotels, dates, guests...
                    </span>
                </div>
            </div>

            {/* 4. MODAL OVERLAY (The Real Search Widget) */}
            {isSearchOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-teal-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <SearchWidget onClose={() => setIsSearchOpen(false)} />
                    </div>
                    {/* Background click closes modal */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsSearchOpen(false)} />
                </div>
            )}

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        </section>
    );
};

export default HeroSection;
