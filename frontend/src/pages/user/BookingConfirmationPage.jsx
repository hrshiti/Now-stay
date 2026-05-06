import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    CheckCircle, XCircle, MapPin, Calendar, Users, FileText,
    Phone, Navigation, Share2, Home, Download, Printer, ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { bookingService } from '../../services/apiService';
import BookingInvoice from '../../components/BookingInvoice';
import { X } from 'lucide-react';

const BookingConfirmationPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize with state if available, else null
    const [booking, setBooking] = useState(location.state?.booking || null);
    const [loading, setLoading] = useState(!location.state?.booking);
    const [imgError, setImgError] = useState(false);

    const animate = location.state?.animate;
    const [showInvoice, setShowInvoice] = useState(false);

    useEffect(() => {
        const loadBooking = async () => {
            // If no Booking in state and no ID in URL, redirect
            if (!id && !booking) {
                navigate('/');
                return;
            }

            // Always fetch fresh data to ensure we have all nested fields (like invoiceTerms, ownerSignature)
            try {
                if (!booking) setLoading(true);
                const data = await bookingService.getBookingDetail(id);
                setBooking(data);
            } catch (error) {
                console.error("Failed to load booking:", error);
                if (!booking) { // Only error out if we don't have fallback state data
                    toast.error("Could not load booking details");
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        loadBooking();
    }, [id, navigate]);

    useEffect(() => {
        // Only show confetti for confirmed bookings (not cancelled)
        if (booking && animate) {
            const status = (booking.bookingStatus || booking.status || 'pending').toLowerCase();
            const cancelled = status === 'cancelled' || status === 'no_show' || status === 'rejected';
            
            if (!cancelled) {
                const end = Date.now() + 3000;
                const colors = ['#10B981', '#3B82F6', '#F59E0B'];

                (function frame() {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: colors
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: colors
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
        }
    }, [booking, animate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-emerald-100">
                <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading Booking...</p>
                </div>
            </div>
        );
    }

    if (!booking) return null;

    // Derived Data Safe Access
    const property = booking.propertyId || {};
    const room = booking.roomTypeId || {};
    const user = booking.userId || {};

    // Fallback to localStorage for email/phone if not populated in booking response
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const userEmail = user.email || storedUser.email || '';
    const userPhone = user.phone || user.mobile || storedUser.phone || storedUser.mobile || '';

    // Merged user object for invoice - booking.userId is now fully populated from backend
    const invoiceUser = {
        name: user.name || storedUser.name || booking.guestDetails?.name || 'Valued Guest',
        email: userEmail || booking.guestDetails?.email || '',
        phone: userPhone || booking.guestDetails?.phone || '',
    };

    // Determine booking status for conditional rendering
    const bookingStatus = (booking.bookingStatus || booking.status || 'pending').toLowerCase();
    const isCancelled = bookingStatus === 'cancelled' || bookingStatus === 'no_show' || bookingStatus === 'rejected';
    const isConfirmed = bookingStatus === 'confirmed' || bookingStatus === 'pending' || bookingStatus === 'awaiting_payment';

    const handleDirections = () => {
        const propAddress = property.address?.fullAddress ||
            `${property.address?.street || ''}, ${property.address?.city || ''}, ${property.address?.state || ''}` ||
            property.address;

        if (property.location?.coordinates && property.location.coordinates.length === 2) {
            const [lng, lat] = property.location.coordinates;
            window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
            return;
        }

        if (propAddress) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(propAddress)}`, '_blank');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const downloadUrl = `${apiUrl}/bookings/${booking._id}/receipt`;
            
            // Create a temporary link and click it to trigger browser download
            const link = document.createElement('a');
            link.href = downloadUrl;
            // Since it's a GET request that requires Auth, we might need a different approach if the backend doesn't support query param tokens.
            // But usually for downloads, we can use window.open or a blob.
            // Let's use a blob approach to include the token in headers.
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) throw new Error('Download failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            link.href = url;
            link.download = `receipt-${booking.bookingId || 'booking'}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Invoice download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download invoice');
        }
    };

    // Single contact number: property (partner-entered) first, else partner account phone
    const contactPhone = (property.contactNumber || property.partnerId?.phone || '').replace(/\D/g, '') || null;

    return (
        <div className="min-h-screen bg-emerald-100 pb-12 print:bg-white print:min-h-0 print:pb-0">
            {/* Global Print Styles for Strict Isolation */}
            <style>
                {`
                @media print {
                    body * { visibility: hidden !important; }
                    .print-area, .print-area * { visibility: visible !important; }
                    .print-area { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important; 
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                    }
                    @page { size: auto; margin: 5mm; }
                }
                `}
            </style>
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 print:hidden shadow-sm shadow-emerald-900/5">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/50 rounded-full transition-all active:scale-90 flex items-center gap-1.5 text-gray-700">
                        <ChevronLeft size={20} />
                        <span className="hidden sm:inline font-bold text-sm">Back</span>
                    </button>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">
                        {isCancelled ? 'Booking Details' : 'Booking Confirmation'}
                    </h1>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={handleDownload} 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-surface flex items-center justify-center"
                            title="Download Invoice"
                        >
                            <Download size={20} />
                        </button>
                        <button onClick={() => setShowInvoice(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600" title="View Professional Invoice">
                            <FileText size={20} />
                        </button>
                        <button onClick={handlePrint} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600" title="Print Page">
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 print:hidden">

                {/* Print-Only Invoice Header */}
                <div className="hidden print:flex items-end justify-between border-b-2 border-gray-100 pb-4 mb-4">
                    <div>
                        <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">NOWSTAY<span className="text-emerald-400">.in</span></h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Official Booking Invoice</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold mb-0.5">Generated On</p>
                        <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* 1. Status Message */}
                <div className={`relative bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-emerald-900/5 border border-white/50 text-center ${isCancelled ? 'border-red-100' : ''} print:p-0 print:shadow-none print:border-none print:bg-transparent`}>
                    {isCancelled ? (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-red-600 print:hidden"></div>
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                                <XCircle size={40} className="text-red-600" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 print:text-xl print:text-left print:mb-1">Booking Cancelled!</h1>
                            <p className="text-gray-500 max-w-md mx-auto print:mx-0 print:text-sm print:text-left">
                                Your reservation ID is <span className="font-mono font-bold text-gray-800">#{booking.bookingId || booking._id?.slice(-8).toUpperCase()}</span>.
                                {booking.cancellationReason && (
                                    <span className="block mt-2 text-sm text-gray-600 print:mt-1">
                                        Reason: <span className="font-medium">{booking.cancellationReason}</span>
                                    </span>
                                )}
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600 print:hidden"></div>
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce print:hidden">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-2 print:text-xl print:text-left print:mb-1">Booking Confirmed!</h1>
                            <p className="text-gray-500 max-w-md mx-auto print:mx-0 print:text-sm print:text-left">
                                Your reservation ID is <span className="font-mono font-bold text-gray-800">#{booking.bookingId || booking._id?.slice(-8).toUpperCase()}</span>.
                                {userEmail && (
                                    <span className="print:hidden"> We've sent a confirmation email to <span className="font-medium text-gray-800">{userEmail}</span>.</span>
                                )}
                            </p>

                            {/* WhatsApp Location Note */}
                            <div className="print:hidden mt-8 w-full max-w-md mx-auto">
                                <div className="flex items-center gap-5 px-2">
                                    <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                                        <svg className="w-7 h-7 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h4 className="text-[15px] font-bold text-gray-900 mb-1 tracking-tight">Stay Connected</h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            The property's live location will be shared via WhatsApp prior to your check-in.
                                        </p>
                                        {userPhone && (
                                            <div className="mt-2.5 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></div>
                                                <p className="text-xs font-bold text-[#25D366] tracking-wider">+91 {userPhone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 print:gap-4">

                    {/* Left Col: Property & Actions */}
                    <div className="md:col-span-2 print:col-span-2 space-y-6 print:space-y-4">

                        {/* Property Card */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 print:break-inside-avoid print:p-3 print:shadow-none print:border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-5">
                                <div className="w-full sm:w-32 h-32 bg-gray-200 rounded-2xl overflow-hidden shrink-0">
                                    <img
                                        src={!imgError ? (property.propertyImages?.[0] || property.images?.[0]?.url || property.images?.[0] || property.coverImage || property.propertyId?.coverImage || "https://via.placeholder.com/150") : "https://via.placeholder.com/150"}
                                        alt={property.propertyName || property.name || "Property"}
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{property.propertyType || 'Hotel'}</span>
                                            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2">{property.name || property.propertyName || 'Property Name'}</h2>
                                            <div className="flex items-start gap-1 text-gray-500 text-sm mb-4">
                                                <MapPin size={16} className="mt-0.5 shrink-0" />
                                                <p>{property.address?.fullAddress || property.address?.street || property.address?.city || property.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 print:hidden">
                                        <button
                                            onClick={handleDirections}
                                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Navigation size={14} /> Directions
                                        </button>
                                        {contactPhone ? (
                                            <a
                                                href={`tel:${contactPhone}`}
                                                className="flex-1 border border-gray-200 hover:border-black text-gray-700 hover:text-black text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 no-underline"
                                            >
                                                <Phone size={14} /> Contact Property
                                            </a>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled
                                                className="flex-1 border border-gray-100 text-gray-400 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                                            >
                                                <Phone size={14} /> Number not available
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 print:break-inside-avoid print:p-4 print:shadow-none print:border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <FileText size={18} className="text-gray-400" />
                                Reservation Details
                            </h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Check-in</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {new Date(booking.checkInDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-500">{property.checkInTime || '12:00 PM'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Check-out</p>
                                    <p className="font-bold text-gray-900 text-lg">
                                        {new Date(booking.checkOutDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-gray-500">{property.checkOutTime || '11:00 AM'}</p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-400 font-bold mb-1">Total Nights</p>
                                    <p className="font-semibold text-gray-900">{booking.totalNights} Night(s)</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold mb-1">Room Type</p>
                                    <p className="font-semibold text-gray-900">{room.name || room.type || booking.roomType || 'Standard Room'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold mb-1">Guests</p>
                                    <p className="font-semibold text-gray-900">{booking.guests?.adults || 1} Adults, {booking.guests?.children || 0} Children</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold mb-1">Booking Unit</p>
                                    <p className="font-semibold text-gray-900 capitalize">
                                        {booking.guests?.rooms || 1} {booking.bookingUnit}{((booking.guests?.rooms || 1) > 1) ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Col: Price & Payment */}
                    <div className="space-y-6 print:space-y-4">

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit print:break-inside-avoid print:p-4 print:shadow-none print:border-gray-200">
                            <h3 className="font-bold text-gray-900 mb-5">Payment Summary</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Base Price</span>
                                    <span>₹{booking.baseAmount?.toLocaleString()}</span>
                                </div>
                                {(booking.extraCharges > 0) && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Extra Charges</span>
                                        <span>₹{booking.extraCharges?.toLocaleString()}</span>
                                    </div>
                                )}
                                {booking.taxes > 0 && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Taxes & Fees</span>
                                        <span>₹{booking.taxes?.toLocaleString()}</span>
                                    </div>
                                )}
                                {(booking.discount > 0) && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>-₹{booking.discount?.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-gray-100 pt-3 flex justify-between items-center bg-gray-50 -mx-6 px-6 py-4 mt-4">
                                    <span className="font-bold text-gray-900">Total Amount</span>
                                    <span className="text-xl font-black text-gray-900">₹{booking.totalAmount?.toLocaleString()}</span>
                                </div>
                                {(booking.paymentMethod === 'prepaid' && booking.remainingAmount > 0) && (
                                    <div className="bg-orange-50 -mx-6 px-6 py-3 border-b border-orange-100 flex flex-col gap-1">
                                        <div className="flex justify-between text-sm text-gray-700">
                                            <span>Advance Paid Now</span>
                                            <span className="font-bold">₹{booking.amountPaid?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-orange-700 font-bold">
                                            <span>To Pay at Hotel</span>
                                            <span>₹{booking.remainingAmount?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl flex items-center gap-3 ${booking.paymentStatus === 'paid' ? 'bg-green-50' : booking.paymentStatus === 'partial' ? 'bg-orange-50' : 'bg-yellow-50'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : booking.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {booking.paymentStatus === 'paid' ? <CheckCircle size={20} /> : <FileText size={20} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-gray-500">Payment Status</p>
                                    <p className={`font-bold ${booking.paymentStatus === 'paid' ? 'text-green-700' : booking.paymentStatus === 'partial' ? 'text-orange-700' : 'text-yellow-700'}`}>
                                        {booking.paymentStatus === 'paid' ? 'Paid Completely' : booking.paymentStatus === 'partial' ? 'Partially Paid (Prepaid)' : 'Pay at Hotel'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 print:hidden">
                            <button
                                onClick={() => navigate('/bookings')}
                                className="w-full bg-surface text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-surface-dark active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                My Bookings
                            </button>
                        </div>

                        {/* Cancel Booking Option */}
                        {(() => {
                            // Industry Standard: Check if cancellation is allowed (at least 24 hours before check-in time)
                            const now = new Date();
                            const checkInDate = new Date(booking.checkInDate);
                            
                            // Get check-in time from property (default to 12:00 PM if not available)
                            const checkInTime = property?.checkInTime || '12:00 PM';
                            
                            // Parse check-in time
                            let hours = 12; // Default to 12 PM
                            let minutes = 0;
                            const timeStr = checkInTime.trim().toUpperCase();
                            const isPM = timeStr.includes('PM');
                            const timeMatch = timeStr.match(/(\d+):(\d+)/);
                            
                            if (timeMatch) {
                                hours = parseInt(timeMatch[1], 10);
                                minutes = parseInt(timeMatch[2], 10);
                                if (isPM && hours !== 12) {
                                    hours += 12;
                                } else if (!isPM && hours === 12) {
                                    hours = 0;
                                }
                            }
                            
                            // Set check-in date and time
                            const checkInDateTime = new Date(checkInDate);
                            checkInDateTime.setHours(hours, minutes, 0, 0);
                            
                            // Calculate difference in milliseconds
                            const diffMs = checkInDateTime.getTime() - now.getTime();
                            const diffHours = diffMs / (1000 * 60 * 60);
                            
                            // Allow cancellation only if at least 24 hours before check-in
                            const isCancellableTime = diffHours >= 24;
                            const isActive = ['confirmed', 'pending'].includes(booking.bookingStatus);
                            
                            // Calculate remaining hours for display
                            const hoursRemaining = Math.max(0, Math.ceil(diffHours));

                            if (!isActive) return null;

                            return (
                                <>
                                    {isCancellableTime ? (
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
                                                    try {
                                                        const loadToast = toast.loading('Cancelling booking...');
                                                        const idToCancel = booking._id || booking.id;
                                                        const response = await bookingService.cancel(idToCancel);
                                                        toast.dismiss(loadToast);
                                                        
                                                        // Show detailed success message
                                                        let successMsg = 'Booking cancelled successfully';
                                                        if (response.refundProcessed && response.refundAmount > 0) {
                                                            successMsg += `. Refund of ₹${Number(response.refundAmount).toLocaleString()} will be processed.`;
                                                        } else if (response.refundAmount > 0) {
                                                            successMsg += `. Refund of ₹${Number(response.refundAmount).toLocaleString()} credited to your wallet.`;
                                                        }
                                                        toast.success(successMsg);
                                                        navigate('/bookings');
                                                    } catch (error) {
                                                        toast.dismiss();
                                                        const errorMsg = error.response?.data?.message || 'Failed to cancel booking';
                                                        toast.error(errorMsg);
                                                        
                                                        // If it's a policy violation, show specific message
                                                        if (error.response?.data?.code === 'CANCELLATION_POLICY_VIOLATION') {
                                                            const hoursRemaining = error.response?.data?.hoursRemaining || 0;
                                                            setTimeout(() => {
                                                                toast.error(`Cancellation is only allowed at least 24 hours before check-in. Check-in is in ${hoursRemaining} hours.`, { duration: 5000 });
                                                            }, 500);
                                                        }
                                                    }
                                                }
                                            }}
                                            className="w-full bg-white border-2 border-red-100 text-red-500 font-bold py-4 rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center gap-2 mt-4 print:hidden"
                                        >
                                            Cancel Booking
                                        </button>
                                    ) : (
                                        <div className="w-full bg-gray-50 border border-gray-200 text-gray-400 font-bold py-4 rounded-2xl text-center mt-4 text-xs print:hidden">
                                            Cancellation unavailable (Policy: Must cancel at least 24 hours before check-in. Check-in is in {hoursRemaining} hours)
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                    </div>
                </div>

                {/* Property Tax & Invoice Info (Professional Footer) */}
                {(property.gstNumber || property.propertyEmail) && (
                    <div className="bg-white/50 border border-gray-100 rounded-3xl p-6 mt-8 print:border-gray-200 print:mt-4 print:p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax & Billing Information</h4>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                    {property.gstNumber && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                                <FileText size={12} className="text-gray-400" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">GSTIN: <span className="text-gray-900">{property.gstNumber}</span></p>
                                        </div>
                                    )}
                                    {property.propertyEmail && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                                                <Phone size={12} className="text-gray-400" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-700">Email: <span className="text-gray-900">{property.propertyEmail}</span></p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="hidden md:block text-right">
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">Verified by NowStay</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Professional Invoice Modal */}
            {showInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm print:bg-white print:static print:inset-auto print:z-0">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-3xl relative print:max-h-none print:overflow-visible print:rounded-none print:shadow-none print:w-full print-area">
                        <button 
                            onClick={() => setShowInvoice(false)}
                            className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all z-10 print:hidden"
                        >
                            <X size={20} />
                        </button>
                        
                        <div className="p-0 sm:p-2 print:p-0">
                            <BookingInvoice 
                                booking={booking}
                                property={property}
                                room={room}
                                user={invoiceUser}
                                taxRate={booking.taxRate}
                            />
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 print:hidden">
                            <button 
                                onClick={() => setShowInvoice(false)}
                                className="px-6 py-2 text-sm font-bold text-gray-500 uppercase"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => window.print()}
                                className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-black uppercase shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                            >
                                <Printer size={16} /> Print Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingConfirmationPage;
