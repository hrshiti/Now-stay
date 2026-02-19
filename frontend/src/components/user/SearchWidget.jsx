import React, { useState } from 'react';
import { Search, Calendar, User, Check, Building2, MapPin, PawPrint, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const SearchWidget = ({ onClose }) => {
    const navigate = useNavigate();

    // Default dates: Today and Tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [location, setLocation] = useState('');
    const [checkIn, setCheckIn] = useState(format(today, 'yyyy-MM-dd'));
    const [checkOut, setCheckOut] = useState(format(tomorrow, 'yyyy-MM-dd'));

    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [rooms, setRooms] = useState(1);
    const [isPetFriendly, setIsPetFriendly] = useState(false);

    // Toggle for Guest Selection Modal/Dropdown (simplifying to inline for now as per image)
    // The image shows inline selectors for adults/children/rooms

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.append('search', location);
        params.append('checkIn', checkIn);
        params.append('checkOut', checkOut);
        params.append('guests', (adults + children).toString()); // Total guests
        params.append('adults', adults.toString());
        params.append('children', children.toString());
        params.append('rooms', rooms.toString());
        if (isPetFriendly) params.append('petFriendly', 'true');

        navigate(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-5 space-y-4">

            {/* Conditional Close Button */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors z-50"
                >
                    <X size={20} />
                </button>
            )}

            {/* 1. Destination Input */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-teal-600 group-focus-within:text-teal-700 transition-colors" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-200 text-gray-900 font-medium"
                    placeholder="Search destination (e.g. Goa)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* 2. Date Inputs (Grid) */}
            <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 ml-1">Check-in</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        <input
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className="block w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-semibold text-gray-800"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                        />
                    </div>
                </div>

                <div className="relative group">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1 ml-1">Check-out</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        <input
                            type="date"
                            min={checkIn} // Can't check out before check in
                            className="block w-full pl-9 pr-2 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-semibold text-gray-800"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Guests & Rooms (Grid) */}
            <div className="grid grid-cols-3 gap-3">
                {/* Adults */}
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-200 flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Adults</label>
                    <select
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="bg-transparent font-bold text-gray-800 text-sm outline-none w-full"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>

                {/* Children */}
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-200 flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Children</label>
                    <select
                        value={children}
                        onChange={(e) => setChildren(Number(e.target.value))}
                        className="bg-transparent font-bold text-gray-800 text-sm outline-none w-full"
                    >
                        {[0, 1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>

                {/* Rooms */}
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-200 flex flex-col">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">Rooms</label>
                    <select
                        value={rooms}
                        onChange={(e) => setRooms(Number(e.target.value))}
                        className="bg-transparent font-bold text-gray-800 text-sm outline-none w-full"
                    >
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 4. Pet Friendly Toggle */}
            <div className="flex items-center justify-between bg-teal-50/50 p-3 rounded-xl border border-teal-100/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                        <PawPrint size={14} />
                    </div>
                    <span className="text-sm font-medium text-teal-900">Travelling with pets?</span>
                </div>

                <button
                    onClick={() => setIsPetFriendly(!isPetFriendly)}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${isPetFriendly ? 'bg-teal-600' : 'bg-gray-300'}`}
                >
                    <span
                        className={`absolute left-0.5 top-0.5 inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${isPetFriendly ? 'translate-x-4' : 'translate-x-0'}`}
                    />
                </button>
            </div>

            {/* 5. Search Button */}
            <button
                onClick={handleSearch}
                className="w-full bg-teal-700 hover:bg-teal-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
            >
                <Search size={20} className="stroke-[2.5]" />
                <span>Search Hotels</span>
            </button>

        </div>
    );
};

export default SearchWidget;
