import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Clock,
    Star,
    CheckCircle, XCircle, AlertCircle, Ticket, MessageSquare, X
} from 'lucide-react';
import { bookingService, reviewService } from '../../services/apiService';
import AuthRequired from '../../components/ui/AuthRequired';
import toast from 'react-hot-toast';

const BookingsPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('upcoming');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Modal State
    const [reviewModalData, setReviewModalData] = useState(null);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
    const [submitReviewLoading, setSubmitReviewLoading] = useState(false);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewModalData) return;
        
        setSubmitReviewLoading(true);
        try {
            await reviewService.createReview({
                propertyId: reviewModalData.propertyId,
                ...reviewData
            });
            toast.success('Review submitted successfully!');
            setReviewModalData(null);
            setReviewData({ rating: 5, comment: '' });
        } catch (error) {
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitReviewLoading(false);
        }
    };

    // Filter Tabs Configuration
    const tabs = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'ongoing', label: 'Ongoing' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ];

    // Fetch Bookings when Active Tab Changes
    useEffect(() => {
        if (!localStorage.getItem('token')) {
            setLoading(false);
            return;
        }
        const fetchBookings = async () => {
            try {
                setLoading(true);
                // Backend now handles filtering via 'type' query param
                const data = await bookingService.getMyBookings(activeTab);
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch bookings", err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [activeTab]);

    if (!localStorage.getItem('token')) {
        return <AuthRequired title="My Bookings" message="Sign in to view and manage your property bookings, upcoming stays, and past history." />;
    }

    const getStatusBadge = (status, paymentStatus) => {
        const s = (status || '').toLowerCase();

        if (s === 'confirmed' || s === 'pending') {
            if (paymentStatus === 'paid') {
                return <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Paid</span>;
            }
            if (paymentStatus === 'partial') {
                return <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Partially Paid</span>;
            }
            return <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><AlertCircle size={10} /> Pay at Hotel</span>;
        }
        if (s === 'pending_payment') {
            return <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> Payment Pending</span>;
        }
        if (s === 'checked_in') {
            return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={10} /> Ongoing</span>;
        }
        if (s === 'completed' || s === 'checked_out') {
            return <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={10} /> Completed</span>;
        }
        if (s === 'cancelled' || s === 'no_show' || s === 'rejected') {
            return <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><XCircle size={10} /> {s === 'no_show' ? 'No Show' : 'Cancelled'}</span>;
        }
        return <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full">{status}</span>;
    };

    return (
        <div className="min-h-screen bg-emerald-100">
            {/* Header with Scrollable Tabs */}
            <div className="sticky top-0 bg-surface text-white px-5 pt-10 pb-6 rounded-b-3xl shadow-lg shadow-surface/20 z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black mb-1">My Bookings</h1>
                        <p className="text-xs text-white/80 font-medium tracking-wide">Manage your stays and trips</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-black/20 p-1 rounded-2xl flex items-center justify-between backdrop-blur-sm overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-surface shadow-sm scale-[0.98]'
                                : 'text-white/70 hover:bg-white/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-6 pb-32">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-8 h-8 border-4 border-surface border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (bookings.length === 0) ? (
                        // Empty State
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center py-16"
                        >
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Ticket size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-surface mb-1">No {activeTab} bookings</h3>
                            <p className="text-[11px] text-gray-400 text-center max-w-[240px] mb-5">
                                {activeTab === 'upcoming' && "Your upcoming trips will appear here."}
                                {activeTab === 'ongoing' && "Currently active stays will show here."}
                                {activeTab === 'completed' && "Your past stays history is empty."}
                                {activeTab === 'cancelled' && "No cancelled bookings found."}
                            </p>
                            {activeTab !== 'cancelled' && (
                                <button
                                    onClick={() => navigate('/listings')}
                                    className="bg-surface text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow-lg shadow-surface/30 active:scale-95 transition-transform"
                                >
                                    Explore Hotels
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        // Bookings List
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {bookings.map((booking, index) => {
                                const hotel = booking.propertyId || {};
                                const bookingStatus = booking.bookingStatus || booking.status || 'pending';
                                const checkInDate = booking.checkInDate || booking.checkIn;
                                const checkOutDate = booking.checkOutDate || booking.checkOut;
                                const checkIn = checkInDate ? new Date(checkInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';
                                const checkOut = checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';

                                const propertyImage = hotel.propertyImages?.[0] || hotel.images?.[0]?.url || hotel.images?.[0] || hotel.coverImage || 'https://via.placeholder.com/150';

                                return (
                                    <motion.div
                                        key={booking._id || booking.id || index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() =>
                                            navigate(`/booking/${booking._id}`, {
                                                state: { booking: booking }
                                            })
                                        }
                                        className="bg-white rounded-xl overflow-hidden shadow-md shadow-gray-200/50 border border-gray-100 cursor-pointer active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex h-28">
                                            {/* IMAGE SAME */}
                                            <div className="w-24 bg-gray-200 shrink-0 relative">
                                                <img
                                                    src={propertyImage}
                                                    alt={hotel.propertyName || hotel.name || 'Hotel'}
                                                    className={`w-full h-full object-cover ${activeTab === 'cancelled' ? 'grayscale' : ''
                                                        }`}
                                                />
                                                <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                    <Star size={8} fill="currentColor" />
                                                    {hotel.avgRating > 0
                                                        ? Number(hotel.avgRating).toFixed(1)
                                                        : 'New'}
                                                </div>
                                            </div>

                                            {/* CONTENT */}
                                            <div className="flex-1 p-3 flex flex-col justify-start">
                                                <div className="flex justify-between items-start mb-1">
                                                    {getStatusBadge(
                                                        bookingStatus,
                                                        booking.paymentStatus
                                                    )}
                                                    <span className="text-[9px] text-gray-400 font-medium tracking-wide">
                                                        #{booking.bookingId || booking._id?.slice(-6)}
                                                    </span>
                                                </div>

                                                {/* ✅ FIXED PROPERTY NAME */}
                                                <h3 className="font-bold text-surface text-sm leading-tight line-clamp-2 break-words min-h-[32px]">
                                                    {hotel.propertyName ||
                                                        hotel.name ||
                                                        'Unknown Property'}
                                                </h3>

                                                <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mb-1">
                                                    <MapPin size={9} />
                                                    {`${hotel.address?.city || ''}, ${hotel.address?.state || ''
                                                        }`
                                                        .replace('undefined', '')
                                                        .replace(/^, /, '')
                                                        .replace(/, $/, '') || 'Location'}
                                                </p>

                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <div className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-semibold text-gray-700">
                                                        {checkIn}
                                                    </div>
                                                    <span className="text-gray-300">→</span>
                                                    <div className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md font-semibold text-gray-700">
                                                        {checkOut}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50 flex justify-between items-center">
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                Total Amount
                                            </p>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-surface leading-none">
                                                    ₹{booking.totalAmount?.toLocaleString()}
                                                </p>
                                                {(booking.paymentMethod === 'prepaid' && booking.remainingAmount > 0) && (
                                                    <p className="text-[9px] font-bold text-orange-600 mt-0.5">
                                                        To Pay at Hotel: ₹{booking.remainingAmount?.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Write a Review - only for completed stays */}
                                        {(bookingStatus === 'completed' || bookingStatus === 'checked_out') && (
                                            <div
                                                className="border-t border-gray-100 px-3 py-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setReviewModalData({ propertyId: hotel._id });
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-surface/5 border border-surface/15 text-surface text-[11px] font-bold hover:bg-surface hover:text-white transition-all active:scale-95"
                                                >
                                                    <MessageSquare size={12} />
                                                    Write a Review
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                );

                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Review Modal */}
            <AnimatePresence>
                {reviewModalData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setReviewModalData(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="flex justify-between items-center p-5 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-surface">Rate your stay</h3>
                                <button
                                    onClick={() => setReviewModalData(null)}
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleReviewSubmit} className="p-5">
                                <div className="flex justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={36}
                                                className={`${reviewData.rating >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} transition-colors`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Your Experience</label>
                                    <textarea
                                        value={reviewData.comment}
                                        onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                        placeholder="Tell us about your stay, room cleanliness, staff behavior..."
                                        rows={4}
                                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-surface/20 focus:border-surface outline-none text-sm resize-none bg-gray-50 focus:bg-white transition-all"
                                        required
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={submitReviewLoading}
                                    className="w-full py-3.5 bg-surface text-white rounded-xl font-bold text-sm shadow-lg shadow-surface/30 active:scale-[0.98] transition-all flex items-center justify-center"
                                >
                                    {submitReviewLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Submit Review'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookingsPage;
