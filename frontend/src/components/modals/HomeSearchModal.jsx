import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Calendar, Users, PawPrint, Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomeSearchModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const [destination, setDestination] = useState("");
    const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
    const [guests, setGuests] = useState({ rooms: 1, adults: 2, children: 0 });
    const [pets, setPets] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.lenis?.stop();
            try {
                const savedSearch = JSON.parse(sessionStorage.getItem('homeSearchData'));
                if (savedSearch) {
                    if (savedSearch.destination) setDestination(savedSearch.destination);
                    if (savedSearch.dates) setDates(savedSearch.dates);
                    if (savedSearch.guests) setGuests(savedSearch.guests);
                    if (savedSearch.pets !== undefined) setPets(savedSearch.pets);
                }
            } catch (e) { }
        } else {
            document.body.style.overflow = 'unset';
            window.lenis?.start();
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.lenis?.start();
        };
    }, [isOpen]);

    const handleSearch = () => {
        sessionStorage.setItem('homeSearchData', JSON.stringify({
            destination,
            dates,
            guests,
            pets
        }));

        onClose();
        navigate(`/search${destination ? `?search=${encodeURIComponent(destination)}` : ''}`);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto no-scrollbar">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 my-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-5 sm:px-6 py-6 sm:py-8 text-white relative">
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 sm:right-4 sm:top-4 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-sm"
                            >
                                <X size={18} sm:size={20} />
                            </button>
                            <h2 className="text-xl sm:text-2xl font-black mb-1">Plan Your Stay</h2>
                            <p className="text-emerald-50/80 text-xs sm:text-sm font-medium">Find the perfect place to call home</p>
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-6 space-y-4 sm:y-5 bg-[#fcfdfe]">
                            {/* Destination */}
                            <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 tracking-wider ml-1">Destination</label>
                                <div className="relative group">
                                    <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors group-focus-within:text-emerald-600">
                                        <MapPin size={20} sm:size={22} className="stroke-[2.5]" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Where are you going?"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        className="w-full pl-11 sm:pl-12 pr-11 sm:pr-12 py-3.5 sm:py-4 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all placeholder:text-gray-300 text-sm sm:text-base"
                                    />
                                    {destination && (
                                        <button 
                                            onClick={() => setDestination('')} 
                                            className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                                        >
                                            <X size={16} sm:size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 tracking-wider ml-1">Check-in</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Calendar size={16} sm:size={18} className="stroke-[2.5]" />
                                        </div>
                                        <input
                                            type="date"
                                            value={dates.checkIn}
                                            onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
                                            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm focus:border-emerald-500/30 transition-all text-xs sm:text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 tracking-wider ml-1">Check-out</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                            <Calendar size={16} sm:size={18} className="stroke-[2.5]" />
                                        </div>
                                        <input
                                            type="date"
                                            value={dates.checkOut}
                                            onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
                                            className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm focus:border-emerald-500/30 transition-all text-xs sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guests Grid */}
                            <div className="grid grid-cols-2 min-[440px]:grid-cols-3 gap-3">
                                {[
                                    { label: 'Adults', key: 'adults', min: 1 },
                                    { label: 'Children', key: 'children', min: 0 },
                                    { label: 'Rooms', key: 'rooms', min: 1 }
                                ].map((item) => (
                                    <div key={item.key} className="space-y-1.5 sm:space-y-2">
                                        <label className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 tracking-wider ml-1">{item.label}</label>
                                        <div className="relative flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
                                            <button
                                                onClick={() => setGuests({ ...guests, [item.key]: Math.max(item.min, guests[item.key] - 1) })}
                                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-30"
                                                disabled={guests[item.key] <= item.min}
                                            >
                                                <Minus size={12} sm:size={14} strokeWidth={3} />
                                            </button>
                                            <span className="font-black text-gray-800 text-xs sm:text-sm">{guests[item.key]}</span>
                                            <button
                                                onClick={() => setGuests({ ...guests, [item.key]: guests[item.key] + 1 })}
                                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm"
                                            >
                                                <Plus size={12} sm:size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pets Toggle */}
                            <div className="flex items-center justify-between bg-emerald-50/40 rounded-2xl p-3 sm:p-4 border border-emerald-100/50">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                                        <PawPrint size={18} sm:size={20} className="stroke-[2.5]" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-gray-900 font-bold text-xs sm:text-sm truncate">Travelling with pets?</p>
                                        <p className="text-emerald-700/60 text-[9px] sm:text-[11px] font-medium leading-none">Pet-friendly options available</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input type="checkbox" value="" className="sr-only peer" checked={pets} onChange={() => setPets(!pets)} />
                                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                </label>
                            </div>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 sm:py-4.5 rounded-[16px] sm:rounded-[20px] font-black text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] active:scale-[0.98] transition-all mt-2 sm:mt-4"
                            >
                                <Search size={20} sm:size={22} strokeWidth={3} />
                                Explore Stays
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default HomeSearchModal;

