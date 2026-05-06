import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CreditCard,
  Lock, ChevronRight, Building, CheckCircle, Tag, Wallet, X, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingService, legalService } from '../../services/apiService';
import paymentService from '../../services/paymentService';
import walletService from '../../services/walletService';


// Simple Markdown to HTML converter
const parseMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-black text-gray-800 mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-black text-gray-900 mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-black text-gray-900 mt-5 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-gray-800">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-gray-600">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul class="space-y-1 my-2">$1</ul>')
    .replace(/\n\n/g, '</p><p class="text-gray-600 my-2">')
    .replace(/\n/g, '<br />')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-gray-600 my-1">$1</p>');
};

const BookingCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from PropertyDetailsPage
  const {
    property,
    selectedRoom,
    dates,
    guests,
    priceBreakdown,
    taxRate,
    companyState
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | null
  const [legalContent, setLegalContent] = useState(null);
  const [legalLoading, setLegalLoading] = useState(false);

  // Guest Details State
  const [guestDetails, setGuestDetails] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!guestDetails.name?.trim()) {
      newErrors.name = "Full Name is required";
    } else if (guestDetails.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!guestDetails.phone?.trim()) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^\d{10}$/.test(guestDetails.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openLegalModal = async (type) => {
    setLegalModal(type);
    setLegalContent(null);
    setLegalLoading(true);
    try {
      const res = await legalService.getPage('user', type);
      setLegalContent(res?.page || null);
    } catch (e) {
      setLegalContent(null);
    } finally {
      setLegalLoading(false);
    }
  };

  useEffect(() => {
    if (!property || !dates) {
      toast.error("Invalid booking details");
      navigate('/');
      return;
    }
    fetchWalletBalance();
  }, [property, dates, navigate]);

  const fetchWalletBalance = async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const data = await walletService.getWallet({ viewAs: 'user' });
      if (data.success && data.wallet) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  if (!property || !dates) return null;

  const baseTotalAmount = priceBreakdown?.grandTotal || 0;

  // Prepaid Calculations
  let prepaidDiscountAmount = 0;
  let discountedTotalAmount = baseTotalAmount;
  let advanceAmount = baseTotalAmount;
  let hotelAmount = 0;

  if (paymentMethod === 'prepaid') {
    prepaidDiscountAmount = Math.floor(baseTotalAmount * 0.05);
    discountedTotalAmount = baseTotalAmount - prepaidDiscountAmount;
    advanceAmount = Math.floor(discountedTotalAmount * 0.30);
    hotelAmount = discountedTotalAmount - advanceAmount;
  }

  // Calculate payments
  let walletDeduction = 0;
  let totalAmountForWallet = paymentMethod === 'prepaid' ? advanceAmount : baseTotalAmount;
  let remainingPayable = totalAmountForWallet;

  if (useWallet && ['online', 'prepaid'].includes(paymentMethod)) {
    walletDeduction = Math.min(walletBalance, totalAmountForWallet);
    remainingPayable = totalAmountForWallet - walletDeduction;
  }

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login', { state: { from: location } });
      return;
    }

    setLoading(true);

    // Validate Guest Details
    if (!validateFields()) {
      toast.error("Please correct the errors in guest details");
      setLoading(false);
      return;
    }

    const payload = {
      propertyId: property._id,
      roomTypeId: selectedRoom._id,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      guests: {
        adults: guests.adults,
        children: guests.children,
        rooms: guests.rooms || 1,
        extraAdults: priceBreakdown?.extraAdultsCount || 0,
        extraChildren: priceBreakdown?.extraChildrenCount || 0
      },
      guestDetails: guestDetails,
      bookingUnit: selectedRoom.inventoryType || (['hostel', 'pg'].includes((property.propertyTemplate || property.propertyType || '').toLowerCase()) ? 'bed' : 'room'),
      couponCode: priceBreakdown?.couponCode || null,
      paymentMethod: paymentMethod === 'online' ? 'razorpay' : paymentMethod,
      paymentStatus: 'pending',
      totalAmount: baseTotalAmount,
      // Wallet Info
      useWallet: useWallet && ['online', 'prepaid'].includes(paymentMethod),
      walletDeduction: (useWallet && ['online', 'prepaid'].includes(paymentMethod)) ? walletDeduction : 0
    };

    try {
      if (paymentMethod === 'pay_at_hotel') {
        // --- PAY AT HOTEL FLOW ---
        const response = await bookingService.create(payload);
        if (response.success && response.booking) {
          toast.success("Booking Confirmed!");
          navigate(`/booking/${response.booking._id || response.booking.bookingId}`, { state: { booking: response.booking, animate: true } });
        } else {
          throw new Error(response.message || "Booking failed");
        }

      } else if (paymentMethod === 'online' || paymentMethod === 'prepaid') {
        // --- ONLINE FLOW (Wallet + Razorpay) ---

        // Case A: Full Wallet Payment (remainingPayable <= 0)
        if (remainingPayable <= 0) {
          const response = await bookingService.create(payload);
          // If full wallet payment, backend should create booking directly and mark paid
          if (response.success && response.booking) {
            toast.success("Paid via Wallet! Booking Confirmed.");
            navigate(`/booking/${response.booking._id}`, { state: { booking: response.booking, animate: true } });
            return;
          } else {
            throw new Error(response.message || "Wallet payment failed");
          }
        }

        // Case B: Razorpay (with or without Wallet)
        // Ensure any overlays (like legal bottom sheet) are closed before opening Razorpay
        setLegalModal(null);

        // Create Order (Backend will deduct wallet amount from order amount)
        const bookingRes = await bookingService.create(payload);

        if (!bookingRes.success) throw new Error(bookingRes.message || "Failed to initialize booking");

        if (bookingRes.paymentRequired && bookingRes.order) {
          const { order, key } = bookingRes;

          const paymentResponse = await paymentService.openCheckout({
            key: key,
            amount: order.amount, // Net amount after wallet deduction
            currency: order.currency,
            name: "Now Stay",
            description: `Booking Payment`,
            order_id: order.id,
            prefill: {
              name: guestDetails.name || '',
              email: user?.email || '',
              contact: guestDetails.phone || ''
            },
            theme: { color: "#0F172A" }
          });

          // Verify payment
          try {
            const verifyPayload = {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              bookingId: bookingRes.booking._id
            };
            const verifyRes = await paymentService.verifyPayment(verifyPayload);
            if (verifyRes.success) {
              toast.success("Payment Successful!");
              navigate(`/booking/${verifyRes.booking._id}`, { state: { booking: verifyRes.booking, animate: true } });
            } else {
              toast.error("Payment Verification Failed");
            }
          } catch (err) {
            console.error("Payment Verification Error:", err);
            toast.error("Payment verification failed.");
          }
        }
      }
    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-emerald-100 pb-20 md:pb-10">
        <div className="bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-30 shadow-sm shadow-emerald-900/5">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/50 rounded-full transition-colors active:scale-90">
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Review & Pay</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* 1. Property Summary */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-4 shadow-xl shadow-emerald-900/5 border border-white flex gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden shrink-0 shadow-inner">
              <img
                src={property.images?.cover || property.coverImage || "https://via.placeholder.com/150"}
                alt={property.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] font-black text-surface uppercase tracking-widest leading-none mb-1 block">{property.propertyType || property.propertyTemplate}</span>
              <h2 className="font-black text-gray-900 leading-tight mb-1">{property.name}</h2>
              <p className="text-xs text-gray-500 font-medium mb-2">{property.address?.city || property.address}, {property.address?.state}</p>
              <div className="flex items-center gap-1">
                <span className="bg-honey/10 text-yellow-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-honey/20">
                  {property.avgRating || 'New'} ★
                </span>
              </div>
            </div>
          </div>

          {/* 2. Trip Details */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 border border-white">
            <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">Your Trip</h3>
            <div className="grid grid-cols-2 gap-y-5">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Dates</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{priceBreakdown?.nights} Nights</p>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tight">{dates.checkIn} - {dates.checkOut}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Guests</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{guests.adults} Adults, {guests.children} Children</p>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-tight">{guests.rooms} Room(s)</p>
              </div>
              <div className="col-span-2 pt-2">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Room Type</p>
                <p className="text-sm font-black text-gray-800 leading-tight">{selectedRoom.type || selectedRoom.name}</p>
              </div>
            </div>
          </div>

          {/* 2.5. Guest Details (NEW) */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 border border-white">
            <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">Guest Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={guestDetails.name}
                    onChange={(e) => {
                      setGuestDetails({ ...guestDetails, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    placeholder="Enter guest name"
                    className={`w-full bg-gray-50 border ${errors.name ? 'border-red-500 bg-red-50/50' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-surface outline-none transition-all`}
                    required
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.name}</p>}
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block">Phone Number</label>
                  <input
                    type="tel"
                    value={guestDetails.phone}
                    onChange={(e) => {
                      setGuestDetails({ ...guestDetails, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null });
                    }}
                    placeholder="Enter phone number"
                    className={`w-full bg-gray-50 border ${errors.phone ? 'border-red-500 bg-red-50/50' : 'border-gray-100'} rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-surface outline-none transition-all`}
                    required
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1 uppercase">{errors.phone}</p>}
                </div>
              </div>

            </div>
          </div>

          {/* 3. Price Breakdown */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 border border-white">
            <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">Price Details</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Base Price ({priceBreakdown?.nights} nights)</span>
                <span className="font-bold text-gray-800">₹{priceBreakdown?.totalBasePrice?.toLocaleString()}</span>
              </div>
              {(priceBreakdown?.totalExtraAdultCharge > 0) && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Extra Adults Charges</span>
                  <span className="font-bold text-gray-800">₹{priceBreakdown.totalExtraAdultCharge.toLocaleString()}</span>
                </div>
              )}
              {(priceBreakdown?.totalExtraChildCharge > 0) && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Extra Children Charges</span>
                  <span className="font-bold text-gray-800">₹{priceBreakdown.totalExtraChildCharge.toLocaleString()}</span>
                </div>
              )}
              {(priceBreakdown?.discountAmount > 0) && (
                <div className="flex justify-between text-sm text-emerald-700 font-bold">
                  <span className="flex items-center gap-1.5"><Tag size={14} className="text-emerald-500" /> Coupon Discount</span>
                  <span>- ₹{priceBreakdown.discountAmount.toLocaleString()}</span>
                </div>
              )}
              {(priceBreakdown?.taxAmount > 0) && (
                (companyState && property?.address?.state && property.address.state.toLowerCase().trim() !== companyState) ? (
                  <div className="flex justify-between text-sm text-gray-600 font-medium">
                    <span>IGST ({taxRate || 0}%)</span>
                    <span className="font-bold text-gray-800">₹{priceBreakdown?.taxAmount?.toLocaleString()}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                      <span>CGST ({(taxRate || 0) / 2}%)</span>
                      <span className="font-bold text-gray-800">₹{(priceBreakdown.taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                      <span>SGST ({(taxRate || 0) / 2}%)</span>
                      <span className="font-bold text-gray-800">₹{(priceBreakdown.taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                )
              )}

              {(priceBreakdown?.platformFeeAmount > 0) && (
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Platform Fees</span>
                  <span className="font-bold text-gray-800">₹{priceBreakdown.platformFeeAmount.toLocaleString()}</span>
                </div>
              )}

              {(useWallet && ['online', 'prepaid'].includes(paymentMethod) && walletDeduction > 0) && (
                <div className="flex justify-between text-sm text-blue-700 font-bold">
                  <span className="flex items-center gap-1.5"><Wallet size={14} className="text-blue-500" /> Wallet Balance Used</span>
                  <span>- ₹{walletDeduction.toLocaleString()}</span>
                </div>
              )}

              {paymentMethod === 'prepaid' && (
                <>
                  <div className="flex justify-between text-sm text-emerald-700 font-bold border-t border-emerald-50 pt-2.5">
                    <span className="flex items-center gap-1.5"><Tag size={14} className="text-emerald-500" /> Prepaid Discount (5%)</span>
                    <span>- ₹{prepaidDiscountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-800">
                    <span>New Total</span>
                    <div>
                      <span className="line-through text-xs text-gray-400 mr-2">₹{baseTotalAmount.toLocaleString()}</span>
                      <span className="font-black text-gray-900">₹{discountedTotalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-bold italic">
                    <span>Advance Payable Now (30%)</span>
                    <span>₹{advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-medium italic">
                    <span>Balance Payable at Hotel</span>
                    <span>₹{hotelAmount.toLocaleString()}</span>
                  </div>
                </>
              )}

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="font-black text-gray-900 uppercase tracking-widest text-[11px]">Total Payable Now</span>
                <span className="text-2xl font-black text-surface text-right">
                  ₹{remainingPayable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 border border-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <Wallet size={20} className="text-blue-500" />
                Wallet Balance
              </h3>
              <span className="text-xs font-black bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                ₹{walletBalance.toLocaleString()}
              </span>
            </div>

            <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${useWallet && ['online', 'prepaid'].includes(paymentMethod) ? 'border-primary-solid bg-blue-50/30' : 'border-gray-50 bg-white/50'}`}>
              <div className="relative flex items-center pt-1">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300 pointer-events-none"
                  checked={useWallet}
                  disabled={walletBalance <= 0 || !['online', 'prepaid'].includes(paymentMethod)}
                  onChange={() => { }}
                />
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!['online', 'prepaid'].includes(paymentMethod)) {
                      toast.error("Wallet can only be used with Online or Prepaid Payment");
                      return;
                    }
                    if (walletBalance > 0) setUseWallet(!useWallet);
                  }}
                ></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-gray-800">Pay using Wallet</p>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-1">
                  {!['online', 'prepaid'].includes(paymentMethod)
                    ? "Available for online/prepaid bookings."
                    : walletBalance > 0
                      ? `Save ₹${Math.min(walletBalance, totalAmountForWallet).toLocaleString()} on this trip.`
                      : "Insufficient wallet balance."}
                </p>
              </div>
            </label>
          </div>

          {/* 4. Payment Options */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl shadow-emerald-900/5 border border-white">
            <h3 className="font-black text-gray-900 mb-5 text-sm tracking-tight">Payment Method</h3>
            <div className="space-y-4">
              {/* Option 1: Pay at Hotel */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${paymentMethod === 'pay_at_hotel' ? 'border-surface bg-surface/5' : 'border-gray-50 bg-white/50 hover:border-gray-200'}`}>
                <div className="pt-0.5">
                  <input
                    type="radio"
                    name="payment"
                    className="w-4 h-4 text-surface"
                    checked={paymentMethod === 'pay_at_hotel'}
                    onChange={() => {
                      setPaymentMethod('pay_at_hotel');
                      setUseWallet(false);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-gray-900 text-sm tracking-tight">Pay at Hotel</span>
                    <Building size={18} className="text-gray-400" />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Pay the full amount directly at the property. No booking fees.
                  </p>
                </div>
              </label>

              {/* Option 2: Prepaid */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${paymentMethod === 'prepaid' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 bg-white/50 hover:border-gray-200'}`}>
                <div className="pt-0.5">
                  <input
                    type="radio"
                    name="payment"
                    className="w-4 h-4 text-emerald-600"
                    checked={paymentMethod === 'prepaid'}
                    onChange={() => setPaymentMethod('prepaid')}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-gray-900 text-sm tracking-tight">Prepaid Savings</span>
                    <Tag size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-2.5">
                    Secure your room with a 30% deposit and enjoy a <span className="font-black text-emerald-600">5% Discount</span>.
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-emerald-100 text-emerald-700 text-[9px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-200">Recommended</span>
                  </div>
                </div>
              </label>

              {/* Option 3: Pay Now */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${paymentMethod === 'online' ? 'border-surface bg-surface/5' : 'border-gray-50 bg-white/50 hover:border-gray-200'}`}>
                <div className="pt-0.5">
                  <input
                    type="radio"
                    name="payment"
                    className="w-4 h-4 text-surface"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-black text-gray-900 text-sm tracking-tight">Full Payment</span>
                    <CreditCard size={18} className="text-gray-400" />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-2.5">
                    Pay securely using UPI, Cards or Netbanking for a hassle-free check-in.
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 text-[9px] uppercase font-black px-2 py-0.5 rounded-full border border-blue-200">100% Secure</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <label className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${termsAccepted ? 'border-surface bg-surface/5' : 'border-gray-200 bg-white/60'}`}>
            <div className="relative flex items-center pt-0.5 shrink-0">
              <input
                type="checkbox"
                className="w-5 h-5 rounded-md accent-surface cursor-pointer"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
              />
            </div>
            <p className="text-xs text-gray-600 font-medium leading-relaxed">
              I have read and agree to the{' '}
              <button
                type="button"
                className="text-surface font-black underline"
                onClick={e => { e.preventDefault(); openLegalModal('terms'); }}
              >
                Terms &amp; Conditions
              </button>
              {' '}and{' '}
              <button
                type="button"
                className="text-surface font-black underline"
                onClick={e => { e.preventDefault(); openLegalModal('privacy'); }}
              >
                Privacy Policy
              </button>
              {' '}of NowStay.
            </p>
          </label>

          {/* Confirm Button */}
          <div className="pt-2">
            <button
              onClick={handleConfirmBooking}
              disabled={loading || !termsAccepted}
              className="w-full bg-surface text-white font-black text-lg py-5 rounded-[2rem] shadow-2xl shadow-emerald-900/40 hover:bg-surface-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="animate-pulse">Finalizing...</span>
              ) : (
                <>
                  <span>{['online', 'prepaid'].includes(paymentMethod) ? 'Pay & Confirm' : 'Book Stay Now'}</span>
                  <ChevronRight size={22} className="opacity-70" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
              <Lock size={10} />
              Your data is secure &amp; encrypted.
            </p>
          </div>

        </div>
      </div>

      {/* Legal Content Bottom Sheet Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setLegalModal(null)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-surface" />
                <h2 className="font-black text-gray-900 text-base">
                  {legalModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                </h2>
              </div>
              <button
                onClick={() => setLegalModal(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-90"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4 text-sm text-gray-600 leading-relaxed space-y-3">
              {legalLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-2 border-surface border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-400 text-sm">Loading...</p>
                </div>
              ) : legalContent ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(legalContent.content || legalContent.body || String(legalContent)) }}
                />
              ) : (
                <p className="text-gray-400 text-center py-10">Content not available. Please try again.</p>
              )}
            </div>

            {/* Agree Button */}
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { setTermsAccepted(true); setLegalModal(null); }}
                className="w-full bg-surface text-white font-black py-4 rounded-[1.5rem] shadow-lg shadow-emerald-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                I Agree &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCheckoutPage;
