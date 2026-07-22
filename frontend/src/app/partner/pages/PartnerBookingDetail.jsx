import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, User, Phone, Mail, MapPin,
  CreditCard, CheckCircle, XCircle, Clock,
  ChevronLeft, AlertTriangle, LogIn, LogOut, FileText, Download, Printer, X
} from 'lucide-react';
import { bookingService } from '../../../services/apiService';
import toast from 'react-hot-toast';
import { resolveApiUrl } from '../../../utils/apiBase';
import BookingInvoice from '../../../components/BookingInvoice';

const PartnerBookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getPartnerBookingDetail(id);
      setBooking(data);
    } catch (error) {
      toast.error("Failed to load booking details");
      navigate('/hotel/bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleMarkPaid = async () => {
    if (!window.confirm("Confirm: Guest has paid the full amount at the hotel?")) return;
    try {
      await bookingService.markAsPaid(id);
      toast.success("Marked as Paid Successfully");
      fetchBooking(); // Refresh
    } catch (error) {
      toast.error(error.message || "Action Failed");
    }
  };

  const handleNoShow = async () => {
    if (!window.confirm("Confirm: Guest did NOT arrive? This will cancel the booking and release inventory.")) return;
    try {
      await bookingService.markNoShow(id);
      toast.success("Marked as No Show");
      fetchBooking();
    } catch (error) {
      toast.error(error.message || "Action Failed");
    }
  };

  const handleCheckIn = async () => {
    if (!window.confirm("Confirm Guest Check-In?")) return;
    try {
      await bookingService.checkIn(id);
      toast.success("Checked In Successfully");
      fetchBooking();
    } catch (error) {
      toast.error(error.message || "Action Failed");
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!window.confirm("Confirm Guest Check-Out?")) return;
      await bookingService.checkOut(id);
      toast.success("Checked Out Successfully");
      fetchBooking();
    } catch (error) {
      if (error.requirePayment) {
        if (window.confirm(`${error.message}\n\nDo you want to FORCE check-out anyway?`)) {
          try {
            await bookingService.checkOut(id, true);
            toast.success("Checked Out (Forced)");
            fetchBooking();
          } catch (e) {
            toast.error(e.message || "Force Check-out Failed");
          }
        }
      } else {
        toast.error(error.message || "Action Failed");
      }
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = resolveApiUrl();
      const downloadUrl = `${apiUrl}/bookings/${booking._id}/receipt`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${booking.bookingId || 'booking'}.pdf`;
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;
  if (!booking) return null;

  const user = booking.userId || {};
  const property = booking.propertyId || {};
  const room = booking.roomTypeId || {};

  const invoiceUser = {
    name: booking.userId?.name || booking.guestName || 'Valued Guest',
    email: booking.userId?.email || booking.guestEmail || 'guest@nowstay.in',
    phone: booking.userId?.phone || booking.guestPhone || 'N/A'
  };

  const isPayAtHotel = booking.paymentStatus !== 'paid';
  const canMarkPaid = isPayAtHotel && ['confirmed', 'checked_in'].includes(booking.bookingStatus);
  const canMarkNoShow = ['confirmed'].includes(booking.bookingStatus);
  const canCheckIn = booking.bookingStatus === 'confirmed';
  const canCheckOut = booking.bookingStatus === 'checked_in';

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/hotel/bookings')} className="p-2 hover:bg-gray-100 rounded-full">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-bold text-lg">Booking Details</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Status Card - Compact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Booking ID</span>
            <p className="text-sm font-black text-gray-900 break-all">#{booking.bookingId || booking._id}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${booking.bookingStatus === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
            booking.bookingStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
              booking.bookingStatus === 'no_show' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                'bg-yellow-50 text-yellow-700 border-yellow-100'
            }`}>
            {booking.bookingStatus.replace('_', ' ')}
          </div>
        </div>

        {/* Guest Info - Compact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <User size={16} className="text-gray-400" /> Guest Details
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-base text-gray-500">
              {user.name?.[0] || 'G'}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{user.name || 'Guest'}</p>
              <p className="text-xs text-gray-500">Joined via App</p>
            </div>
          </div>
          <div className="space-y-2">
            <a href={`tel:${user.phone}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100/50">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Phone Number</p>
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                  <Phone size={12} className="text-teal-600" /> 
                  <span className="truncate">{user.phone || 'N/A'}</span>
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <ChevronLeft size={14} className="text-gray-300 rotate-180" />
              </div>
            </a>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100/50">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Email Address</p>
                <div className="flex items-center gap-2 font-bold text-gray-900 text-xs">
                  <Mail size={12} className="text-teal-600" /> 
                  <span className="truncate">{user.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span className="text-[10px] text-gray-500 font-bold uppercase">Total Guests</span>
            </div>
            <p className="font-bold text-gray-900 text-sm">
              {booking.guests?.adults || 1} Adult{(booking.guests?.adults || 1) !== 1 ? 's' : ''}
              {booking.guests?.children > 0 ? `, ${booking.guests.children} Child${booking.guests.children !== 1 ? 'ren' : ''}` : ''}
            </p>
          </div>
        </div>

        {/* Stay Info - Compact */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" /> Stay Details
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Check-in</p>
              <p className="font-bold text-gray-900 text-sm">{new Date(booking.checkInDate).toLocaleDateString()}</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Check-out</p>
              <p className="font-bold text-gray-900 text-sm">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Room Type</p>
              <p className="font-bold text-gray-900 text-sm">{room.name || room.type || 'Standard Room'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-900 font-bold">
                {Math.round(booking.baseAmount / (booking.pricePerNight * booking.totalNights)) || 1} {booking.bookingUnit === 'entire' ? 'Unit' : booking.bookingUnit === 'bed' ? 'Bed' : 'Room'}{(Math.round(booking.baseAmount / (booking.pricePerNight * booking.totalNights)) || 1) > 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">{booking.totalNights} Night{booking.totalNights > 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Invoice & Tax Settings Applied */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <FileText size={16} className="text-gray-400" /> Invoice & Tax Information
            </h3>
            <button
              onClick={() => setShowInvoice(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all border border-blue-100/50 shadow-sm active:scale-95 cursor-pointer"
            >
              <FileText size={13} /> View Invoice
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Property GSTIN</p>
              <p className="font-bold text-gray-900 text-sm uppercase">{property.gstNumber || 'Not Set'}</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-xl">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Billing Email</p>
              <p className="font-bold text-gray-900 text-sm truncate">{property.propertyEmail || 'Not Set'}</p>
            </div>
          </div>
          {property.ownerSignature && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100/50">
              <span className="text-[10px] text-gray-500 font-bold uppercase">Digital Signature</span>
              <img src={property.ownerSignature} alt="Signature" className="h-8 object-contain" />
            </div>
          )}
        </div>

        {/* Payment & Payout Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
            <CreditCard size={16} className="text-teal-600" /> Payment & Payout Breakdown
          </h3>

          <div className="space-y-3">
            {/* 1. Gross Calculation */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Room Price</span>
              <span className="font-bold text-gray-900">₹{(booking.baseAmount + (booking.extraCharges || 0)).toLocaleString()}</span>
            </div>

            {/* 2. Discounts (Show only if applicable) */}
            {(booking.discount > 0 || booking.prepaidDiscount > 0) && (
              <div className="space-y-1.5 pl-3 border-l-2 border-red-100">
                {booking.discount > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-red-500 font-medium">Coupon Discount ({booking.couponCode})</span>
                    <span className="text-red-600 font-bold">- ₹{booking.discount.toLocaleString()}</span>
                  </div>
                )}
                {booking.prepaidDiscount > 0 && (
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-red-500 font-medium">Prepaid Offer (5% Off)</span>
                    <span className="text-red-600 font-bold">- ₹{booking.prepaidDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. Taxes */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">GST / Taxes</span>
              <span className="font-bold text-gray-900">+ ₹{booking.taxes.toLocaleString()}</span>
            </div>

            {/* 4. Total Guest Paid */}
            <div className="flex justify-between items-center py-2 border-t border-b border-gray-50 bg-gray-50/50 px-2 -mx-2">
              <span className="text-xs font-bold text-gray-700">Total Guest Paid</span>
              <span className="font-black text-gray-900">₹{booking.totalAmount.toLocaleString()}</span>
            </div>

            {/* 5. Booking Commission (Internal) */}
            {(() => {
              const taxableAmount = (booking.baseAmount || 0) + (booking.extraCharges || 0) - (booking.discount || 0);
              const commRate = taxableAmount > 0 ? Math.round(((booking.adminCommission || 0) / taxableAmount) * 100) : 0;
              return (
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-gray-500">
                    Booking Commission {commRate > 0 ? `(${commRate}%)` : '(0%)'}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {(booking.adminCommission || 0) > 0 ? `- ₹${booking.adminCommission.toLocaleString()}` : `₹0`}
                  </span>
                </div>
              );
            })()}

            {/* 6. Partner Earnings (Demoted Visual Priority) */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-tight text-[10px]">Your Payout</span>
              <span className="font-bold text-gray-700">₹{booking.partnerPayout.toLocaleString()}</span>
            </div>

            {/* 6.5. Booking Model Type Note */}
            {(() => {
              const isZeroCommission = (booking.adminCommission || 0) === 0;
              const taxableAmount = (booking.baseAmount || 0) + (booking.extraCharges || 0) - (booking.discount || 0);
              const commRate = taxableAmount > 0 ? Math.round(((booking.adminCommission || 0) / taxableAmount) * 100) : 0;

              return isZeroCommission ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/80 flex items-start gap-2 text-[10.5px] text-emerald-800 leading-relaxed">
                  <span className="text-emerald-600 font-bold mt-0.5 text-xs">✓</span>
                  <div>
                    <span className="font-bold block">Subscription-Based Property</span>
                    This property is under your Zero-Commission subscription plan. No commission has been deducted.
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2 text-[10.5px] text-gray-600 leading-relaxed font-medium">
                  <span className="text-teal-600 font-bold mt-0.5 text-xs">ℹ</span>
                  <div>
                    <span className="font-bold block text-gray-700">Commission-Based Property</span>
                    This is a commission-based property. A booking commission of {commRate}% (₹{(booking.adminCommission || 0).toLocaleString()}) has been deducted from your payout.
                  </div>
                </div>
              );
            })()}

            {/* 7. Collection Status (CRITICAL - HIGH VISIBILITY) */}
            <div className={`mt-4 p-4 rounded-2xl border-2 space-y-2 shadow-sm ${booking.remainingAmount > 0 || booking.paymentStatus === 'pending' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-gray-500 font-bold uppercase tracking-wider">{booking.remainingAmount === 0 && booking.paymentStatus === 'paid' ? 'Total Paid Online' : 'Already Paid Online'}</span>
                <span className="text-gray-900 font-bold">₹{(booking.amountPaid > 0 ? booking.amountPaid : (booking.paymentStatus === 'paid' ? booking.totalAmount : 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200/50">
                <span className={`${booking.remainingAmount > 0 || booking.paymentStatus === 'pending' ? 'text-red-800' : 'text-green-800'} font-black text-sm uppercase tracking-tight`}>
                  {booking.remainingAmount > 0 || booking.paymentStatus === 'pending' ? 'COLLECT AT HOTEL' : 'BALANCED / PAID'}
                </span>
                <span className={`${booking.remainingAmount > 0 || booking.paymentStatus === 'pending' ? 'text-red-600' : 'text-green-600'} font-black text-2xl`}>
                  ₹{(booking.remainingAmount > 0 ? booking.remainingAmount : (booking.paymentStatus === 'pending' ? booking.totalAmount : 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Status Information */}
            <div className="flex justify-between items-center text-xs pt-2">
              <span className="text-gray-500 font-bold uppercase tracking-tight text-[10px]">Payment Status</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wide border ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                    booking.paymentStatus === 'partial' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-yellow-50 text-yellow-700 border-yellow-100'
                  }`}>
                  {booking.paymentStatus === 'partial' ? 'Partial (30% Paid)' : booking.paymentStatus === 'paid' ? 'Fully Paid' : 'Pay At Hotel'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 pb-2 border-t border-gray-100">
          {canCheckIn && (
            <button
              onClick={handleCheckIn}
              className="col-span-2 bg-black text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> Check In Guest
            </button>
          )}

          {canCheckOut && (
            <button
              onClick={handleCheckOut}
              className="col-span-2 bg-black text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Check Out Guest
            </button>
          )}

          {canMarkPaid && (
            <button
              onClick={handleMarkPaid}
              className={`bg-green-600 text-white font-bold py-3 rounded-xl shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2 ${canCheckIn || canCheckOut ? 'col-span-1' : 'col-span-2'}`}
            >
              <CheckCircle size={16} /> Mark Payment
            </button>
          )}

          {canMarkNoShow && (
            <button
              onClick={handleNoShow}
              className={`bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform flex items-center justify-center gap-2 ${canCheckIn || canCheckOut ? 'col-span-1' : 'col-span-2'}`}
            >
              <AlertTriangle size={16} /> No Show
            </button>
          )}
        </div>
      </div>

      {/* Global Print Styles for Strict Isolation */}
      <style>
        {`
        @media print {
            body * { visibility: hidden !important; }
            .print-area, .print-area * { visibility: visible !important; }
            .print-area { 
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-height: none !important;
                overflow: visible !important;
            }
        }
        `}
      </style>

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

export default PartnerBookingDetail;


