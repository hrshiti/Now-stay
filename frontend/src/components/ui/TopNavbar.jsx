import React from 'react';
import { User, Globe } from 'lucide-react';
import logo from '../../assets/rokologin-removebg-preview.png';
import { Link } from 'react-router-dom';

const TopNavbar = () => {
    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || 'User';

    return (
        <nav className="hidden md:flex w-full h-24 bg-white/95 backdrop-blur-md border-b border-gray-100 px-8 justify-between items-center fixed top-0 z-50">

            {/* Logo */}
            <Link to="/">
                <div className="flex flex-col items-start leading-tight group">
                    <span className="text-2xl font-black tracking-tighter text-gray-900">
                        NOW<span className="text-teal-600">STAY.in</span>
                    </span>
                    <div className="h-0.5 w-6 bg-teal-600 rounded-full group-hover:w-full transition-all duration-300"></div>
                </div>
            </Link>

            {/* Desktop Links */}
            <div className="flex items-center gap-8">
                <Link to="/" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                    Home
                </Link>
                <Link to="/listings" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                    Search
                </Link>
                <Link to="/bookings" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                    Bookings
                </Link>
                <Link to="/wallet" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                    Wallet
                </Link>
                <Link to="/refer" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                    Refer & Earn
                </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                <Link
                    to="/saved-places"
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
                >
                    <Globe size={18} className="text-surface" />
                </Link>

                <Link
                    to="/settings"
                    className="pl-3 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full flex items-center gap-3 hover:border-surface transition group"
                >
                    <div className="w-8 h-8 rounded-full bg-surface text-white flex items-center justify-center font-bold text-xs">
                        {userName.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-surface group-hover:text-surface/80">
                        {userName.split(' ')[0]}
                    </span>
                </Link>
            </div>

        </nav>
    );
};

export default TopNavbar;
