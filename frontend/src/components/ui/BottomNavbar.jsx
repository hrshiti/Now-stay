import React from 'react';
import { Home, Briefcase, Navigation, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const BottomNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { name: 'Home', icon: Home, route: '/' },
        { name: 'Bookings', icon: Briefcase, route: '/bookings' },
        { name: 'Near By', icon: Navigation, route: null, handler: 'nearBy' },
        { name: 'Profile', icon: User, route: '/profile/edit' },
    ];

    const getActiveTab = (path) => {
        if (path === '/') return 'Home';
        if (path.includes('bookings')) return 'Bookings';
        if (path.includes('search') && new URLSearchParams(location.search).get('lat')) return 'Near By';
        if (path.includes('profile')) return 'Profile';
        return 'Home';
    };

    const activeTab = getActiveTab(location.pathname);

    const handleNearBy = async () => {
        try {
            toast.loading('Getting your location...');
            const loc = await propertyService.getCurrentLocation();
            toast.dismiss();
            navigate(`/search?lat=${loc.lat}&lng=${loc.lng}&radius=50&sort=distance`);
        } catch (error) {
            toast.dismiss();
            toast.error('Could not get location. Please enable permissions.');
        }
    };

    const handleNavClick = (item) => {
        if (item.handler === 'nearBy') {
            handleNearBy();
        } else {
            navigate(item.route);
        }
    };

    return (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 print:hidden">
            <div className="
        bg-white/95 backdrop-blur-2xl 
        border border-white/40 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)]
        rounded-[24px]
        flex justify-between items-center 
        px-3 py-3
      ">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item)}
                            className="relative flex flex-col items-center justify-center w-full gap-1 p-1"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute inset-x-2 inset-y-0 bg-accent/15 rounded-xl -z-10"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <Icon
                                size={22}
                                className={`transition-colors duration-200 ${isActive ? 'text-surface fill-surface/10' : 'text-gray-400'}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />

                            <span className={`text-[9px] font-bold tracking-wide transition-colors duration-200 ${isActive ? 'text-surface' : 'text-gray-400'}`}>
                                {item.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavbar;
