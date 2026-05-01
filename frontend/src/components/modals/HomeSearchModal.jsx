import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Calendar, Users, PawPrint } from 'lucide-react';
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
            // Pre-fill from sessionStorage if available
            try {
                const savedSearch = JSON.parse(sessionStorage.getItem('homeSearchData'));
                if (savedSearch) {
                    if (savedSearch.destination) setDestination(savedSearch.destination);
                    if (savedSearch.dates) setDates(savedSearch.dates);
                    if (savedSearch.guests) setGuests(savedSearch.guests);
                    if (savedSearch.pets !== undefined) setPets(savedSearch.pets);
                }
            } catch (e) {}
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSearch = () => {
        // Save to sessionStorage
        sessionStorage.setItem('homeSearchData', JSON.stringify({
            destination,
            dates,
            guests,
            pets
        }));

        onClose();
        navigate(`/search${destination ? `?search=${encodeURIComponent(destination)}` : ''}`);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#F8FAFC] rounded-[24px] z-[90] p-5 shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="space-y-4 mt-2">
                            {/* Destination */}
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10B981]">
                                    <MapPin size={20} className="stroke-[2]" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search destination (e.g. Goa)"
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3.5 bg-white border border-gray-100 outline-none text-gray-700 font-medium rounded-2xl shadow-sm placeholder:text-gray-400"
                                />
                                {destination && (
                                    <button onClick={() => setDestination('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block pl-1">Check-in</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10B981]">
                                            <Calendar size={18} />
                                        </div>
                                        <input
                                            type="date"
                                            value={dates.checkIn}
                                            onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
                                            className="w-full pl-9 pr-3 py-3 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block pl-1">Check-out</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10B981]">
                                            <Calendar size={18} />
                                        </div>
                                        <input
                                            type="date"
                                            value={dates.checkOut}
                                            onChange={(e) => setDates({ ...dates, checkOut: e.target.value })}
                                            className="w-full pl-9 pr-3 py-3 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guests */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block pl-1">Adults</label>
                                    <div className="relative">
                                        <select
                                            value={guests.adults}
                                            onChange={(e) => setGuests({ ...guests, adults: parseInt(e.target.value) })}
                                            className="w-full pl-4 pr-8 py-3 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm appearance-none text-sm"
                                        >
                                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block pl-1">Children</label>
                                    <div className="relative">
                                        <select
                                            value={guests.children}
                                            onChange={(e) => setGuests({ ...guests, children: parseInt(e.target.value) })}
                                            className="w-full pl-4 pr-8 py-3 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm appearance-none text-sm"
                                        >
                                            {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 block pl-1">Rooms</label>
                                    <div className="relative">
                                        <select
                                            value={guests.rooms}
                                            onChange={(e) => setGuests({ ...guests, rooms: parseInt(e.target.value) })}
                                            className="w-full pl-4 pr-8 py-3 bg-white border border-gray-100 outline-none text-gray-800 font-bold rounded-2xl shadow-sm appearance-none text-sm"
                                        >
                                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pets Toggle */}
                            <div className="flex items-center justify-between bg-[#F1F5F9] rounded-2xl p-4 border border-[#e0f2f0]">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-[#F1F5F9] rounded-lg text-[#10B981]">
                                        <PawPrint size={16} />
                                    </div>
                                    <span className="text-[#0F172A] font-medium text-sm">Travelling with pets?</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" value="" className="sr-only peer" checked={pets} onChange={() => setPets(!pets)} />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                                </label>
                            </div>

                            {/* Search Button */}
                            <button
                                onClick={handleSearch}
                                className="w-full bg-[#10B981] text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#10B981]/20 active:scale-95 transition-transform mt-2"
                            >
                                <Search size={20} />
                                Search Hotels
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HomeSearchModal;
