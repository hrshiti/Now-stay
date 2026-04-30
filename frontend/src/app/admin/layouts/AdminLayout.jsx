import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Building2, Calendar, Wallet,
    Settings, Bell, Search, LogOut, Menu, X, DollarSign, ClipboardCheck, Star, Tag, FileText, MessageSquare, CircleHelp, Home, ShieldCheck
} from 'lucide-react';

import NowStayLogo from '../../../components/ui/NowStayLogo';
import useAdminStore from '../store/adminStore';
import toast from 'react-hot-toast';
import adminService from '../../../services/adminService';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAdminStore(state => state.logout);

    // Notifications & Stats State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingPartners, setPendingPartners] = useState(0);
    const [pendingProperties, setPendingProperties] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        loadNotifications();
        loadStats();
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadNotifications = async () => {
        try {
            const data = await adminService.getNotifications(1, 5); // Fetch top 5 for dropdown
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.meta.unreadCount);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadStats = async () => {
        try {
            const data = await adminService.getDashboardStats();
            if (data.success) {
                setPendingPartners(data.stats.pendingPartners || 0);
                setPendingProperties(data.stats.pendingProperties || 0);
            }
        } catch (error) {
            console.error('Error loading sidebar stats:', error);
        }
    };

    const handleViewAll = async () => {
        setIsNotifOpen(false);
        try {
            await adminService.markAllNotificationsRead();
            setUnreadCount(0); // Optimistic update
            navigate('/admin/notifications');
        } catch (err) {
            navigate('/admin/notifications');
        }
    };

    const handleLogout = () => {
        logout();
        toast.success('Logged out successfully');
        navigate('/admin/login');
    };

    const MENU_ITEMS = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Users, label: 'User Management', path: '/admin/users' },
        { icon: Building2, label: 'Partner Management', path: '/admin/partners', badge: pendingPartners > 0, count: pendingPartners },
        { icon: ShieldCheck, label: 'Subscriptions', path: '/admin/subscriptions' },
        { icon: Home, label: 'Property Management', path: '/admin/properties', badge: pendingProperties > 0, count: pendingProperties },
        { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
        { icon: Bell, label: 'Notifications', path: '/admin/notifications', badge: unreadCount > 0 },
        { icon: Wallet, label: 'Finance & Payouts', path: '/admin/finance' },
        { icon: Tag, label: 'Offers & Coupons', path: '/admin/offers' },
        { icon: FileText, label: 'Legal & Content', path: '/admin/legal' },
        { icon: MessageSquare, label: 'Contact Messages', path: '/admin/contact-messages' },
        { icon: Tag, label: 'Categories', path: '/admin/categories' },
        { icon: CircleHelp, label: 'FAQs', path: '/admin/faqs' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="bg-black text-white flex flex-col h-full border-r border-gray-800 shadow-2xl z-20 transition-all duration-300 relative"
            >
                <div className="py-2 flex items-center justify-center bg-white border-b border-gray-800 transition-all duration-300">
                    <NowStayLogo size={isSidebarOpen ? "md" : "xs"} />
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative text-sm font-medium ${isActive
                                    ? 'bg-white text-black shadow-lg shadow-gray-900/10'
                                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={`shrink-0 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                                {isSidebarOpen && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="whitespace-nowrap flex-1 truncate"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                {item.badge && isSidebarOpen && (
                                    <span className={`ml-auto ${item.count ? 'min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white' : 'w-2 h-2'} bg-red-500 rounded-full shrink-0`}>
                                        {item.count || ''}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer / Toggle */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-900 text-gray-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`mt-2 w-full flex items-center gap-3 p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <LogOut size={20} />
                        {isSidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <h1 className="text-xl font-bold text-gray-800">
                            NowStay.in Admin
                        </h1>
                        <div className="hidden md:flex items-center relative max-w-md w-full ml-8">
                            <Search size={16} className="absolute left-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users, bookings, hotels..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4" ref={notifRef}>
                        <div className="relative">
                            <button
                                onClick={() => setIsNotifOpen(!isNotifOpen)}
                                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {isNotifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                                    >
                                        <div className="p-3 border-b flex justify-between items-center bg-gray-50/50">
                                            <h3 className="font-bold text-sm text-gray-800">Notifications</h3>
                                            {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.slice(0, 3).map((n) => (
                                                    <div key={n._id} className={`p-3 border-b hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                                                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">{n.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.body}</p>
                                                        <span className="text-[10px] text-gray-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-gray-400 text-sm">No notifications</div>
                                            )}
                                        </div>
                                        <div className="p-2 border-t bg-gray-50">
                                            <button
                                                onClick={handleViewAll}
                                                className="w-full text-center text-xs font-bold text-black hover:underline py-1"
                                            >
                                                View All Notifications
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 relative scroll-smooth bg-gray-50/50">
                    <div className="max-w-[1600px] mx-auto min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
