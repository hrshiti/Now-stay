import Property from '../models/Property.js';
import RoomType from '../models/RoomType.js';
import Booking from '../models/Booking.js';
import PDFDocument from 'pdfkit';
import Offer from '../models/Offer.js';
import PlatformSettings from '../models/PlatformSettings.js';
import AvailabilityLedger from '../models/AvailabilityLedger.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';
import Razorpay from 'razorpay';
import PaymentConfig from '../config/payment.config.js';
import mongoose from 'mongoose';
import emailService from '../services/emailService.js';
import notificationService from '../services/notificationService.js';
import referralService from '../services/referralService.js';
import User from '../models/User.js';
import whatsappService from '../utils/whatsappService.js';

import { getRazorpayInstance } from '../utils/razorpay.js';

// Helper: Check if cancellation is allowed (24 hours before check-in)
const isCancellationAllowed = (checkInDate, checkInTime) => {
  try {
    const now = new Date();
    const checkIn = new Date(checkInDate);

    // Parse check-in time (format: "12:00 PM" or "12:00")
    let hours = 12; // Default to 12 PM if not provided
    let minutes = 0;

    if (checkInTime) {
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
    }

    // Set check-in date and time
    checkIn.setHours(hours, minutes, 0, 0);

    // Calculate difference in milliseconds
    const diffMs = checkIn.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Allow cancellation only if at least 24 hours before check-in
    return diffHours >= 24;
  } catch (error) {
    console.error('Error checking cancellation policy:', error);
    // If error parsing, allow cancellation (fail-safe)
    return true;
  }
};

// Helper: Trigger Notifications
const triggerBookingNotifications = async (booking) => {
  try {
    const fullBooking = await Booking.findById(booking._id)
      .populate('userId')
      .populate('propertyId');

    const userType = fullBooking.userModel ? fullBooking.userModel.toLowerCase() : 'user';
    const user = fullBooking.userId;
    const property = fullBooking.propertyId;

    // 1. User Email
    if (user && user.email) {
      emailService.sendBookingConfirmationEmail(user, fullBooking).catch(err => console.error('Email trigger failed:', err));
    }

    // 2. User Push
    if (user) {
      notificationService.sendToUser(user._id, {
        title: 'Booking Confirmed! 🎉',
        body: `Your booking at ${property ? property.propertyName : 'Property'} is confirmed. ID: ${fullBooking.bookingId}`
      }, { type: 'booking', bookingId: fullBooking._id }, userType).catch(err => console.error('User Push failed:', err));
    }

    // 3. Partner Notifications
    if (property && property.partnerId) {
      notificationService.sendToPartner(property.partnerId, {
        title: 'New Booking Alert! 🏨',
        body: `New booking for ${property.propertyName}. Guest: ${user?.name || 'Customer'}, ID: ${fullBooking.bookingId}`
      }, { type: 'new_booking', bookingId: fullBooking._id }).catch(err => console.error('Partner Push failed:', err));

      mongoose.model('Partner').findById(property.partnerId).then(partner => {
        if (partner && partner.email) {
          emailService.sendPartnerNewBookingEmail(partner, user, fullBooking).catch(e => console.error('Partner Email error', e));
        }
      }).catch(e => console.error('Partner fetch error for email', e));
    }

    // 4. Admin Notifications
    notificationService.sendToAdmins({
      title: 'New Booking Confirmed 💰',
      body: `Booking #${fullBooking.bookingId} at ${property?.propertyName || 'Property'}. Amount: ₹${fullBooking.totalAmount}.`
    }, { type: 'new_booking', bookingId: fullBooking._id }).catch(err => console.error('Admin Push failed:', err));

    // 5. WhatsApp Notification (User)
    if (fullBooking.bookingStatus === 'confirmed') {
      whatsappService.sendBookingConfirmation(fullBooking).catch(err => console.error('WhatsApp trigger failed:', err));
    }

  } catch (err) {
    console.error('Trigger Notification Error:', err);
  }
};

// Helper: Generate Sequential Booking ID (BK-YYYYMMDD-XXXXX)
export const generateBookingId = async () => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const prefix = `BK-${dateStr}-`;

    let nextSeq = 1;
    const lastBooking = await Booking.findOne({
      bookingId: { $regex: `^${prefix}` }
    }).sort({ bookingId: -1 });

    if (lastBooking) {
      const parts = lastBooking.bookingId.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    let candidateId = `${prefix}${String(nextSeq).padStart(5, '0')}`;
    let exists = await Booking.exists({ bookingId: candidateId });
    while (exists) {
      nextSeq++;
      candidateId = `${prefix}${String(nextSeq).padStart(5, '0')}`;
      exists = await Booking.exists({ bookingId: candidateId });
    }

    return candidateId;
  } catch (error) {
    console.error('Error generating booking ID, falling back:', error);
    return `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      roomTypeId,
      checkInDate,
      checkOutDate,
      guests,
      paymentMethod,
      paymentDetails,
      bookingUnit,
      couponCode,
      useWallet,
      walletDeduction
    } = req.body;

    // Basic Validation
    if (!propertyId || !roomTypeId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Missing required booking details' });
    }

    // Fetch Property and RoomType
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) return res.status(404).json({ message: 'Room type not found' });

    // --- PRE-EMPTIVE CLEANUP ---
    // If this user has any previous 'awaiting_payment' bookings for the same room/dates,
    // cancel them to release inventory before checking availability for the new attempt.
    const staleBookings = await Booking.find({
      userId: req.user._id,
      roomTypeId: roomTypeId,
      bookingStatus: 'awaiting_payment',
      checkInDate: { $eq: new Date(checkInDate) },
      checkOutDate: { $eq: new Date(checkOutDate) }
    });

    if (staleBookings.length > 0) {
      const staleIds = staleBookings.map(b => b._id);
      await Booking.updateMany({ _id: { $in: staleIds } }, { 
        $set: { bookingStatus: 'cancelled', cancellationReason: 'New booking attempt initiated' } 
      });
      await AvailabilityLedger.deleteMany({ referenceId: { $in: staleIds } });
    }

    // Fetch Settings
    const settings = await PlatformSettings.getSettings();
    const gstRate = (settings.taxRate !== undefined && settings.taxRate !== null) ? settings.taxRate : 12;
    const commissionRate = (settings.defaultCommission !== undefined && settings.defaultCommission !== null) ? settings.defaultCommission : 10;
    const platformFeeRate = settings.platformFee || 0;
    const platformFeeType = settings.platformFeeType || 'percentage';

    // Calculate Nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const totalNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (totalNights <= 0) {
      return res.status(400).json({ message: 'Invalid check-in/check-out dates' });
    }

    // Check Availability
    const requiredUnits = guests.rooms || 1;
    const ledgerEntries = await AvailabilityLedger.aggregate([
      {
        $match: {
          propertyId: new mongoose.Types.ObjectId(propertyId),
          roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
          startDate: { $lt: checkOut },
          endDate: { $gt: checkIn }
        }
      },
      {
        $group: {
          _id: null,
          blockedUnits: { $sum: '$units' }
        }
      }
    ]);

    const blockedUnits = ledgerEntries.length > 0 ? ledgerEntries[0].blockedUnits : 0;
    let totalInventory = roomType.totalInventory || 0;
    if (roomType.inventoryType === 'bed') {
      totalInventory = totalInventory * (roomType.bedsPerRoom || 1);
    }

    if (totalInventory - blockedUnits < requiredUnits) {
      return res.status(400).json({ message: `Only ${Math.max(0, totalInventory - blockedUnits)} units available for selected dates` });
    }

    // Calculate Base Amount
    const units = requiredUnits; // Use validated units
    const pricePerNight = roomType.pricePerNight || 0;
    const baseAmount = pricePerNight * totalNights * units;

    // Calculate Extra Charges
    const extraAdults = guests.extraAdults || 0;
    const extraChildren = guests.extraChildren || 0;
    const extraAdultPrice = (roomType.extraAdultPrice || 0) * extraAdults * totalNights;
    const extraChildPrice = (roomType.extraChildPrice || 0) * extraChildren * totalNights;
    const extraCharges = extraAdultPrice + extraChildPrice;

    // Gross Amount
    const grossAmount = baseAmount + extraCharges;

    // Calculate Discount
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const offer = await Offer.findOne({ code: couponCode, isActive: true });
      if (offer) {
        // Validate Offer Constraints
        const isValidDate = (!offer.startDate || new Date() >= offer.startDate) &&
          (!offer.endDate || new Date() <= offer.endDate);
        const isValidAmount = grossAmount >= (offer.minBookingAmount || 0);

        // User Usage Limit
        const userUsageCount = await Booking.countDocuments({
          userId: req.user._id,
          couponCode: offer.code,
          bookingStatus: { $nin: ['cancelled', 'rejected'] }
        });
        const isUnderUserLimit = userUsageCount < (offer.userLimit || 1);

        if (isValidDate && isValidAmount && isUnderUserLimit) {
          if (offer.discountType === 'percentage') {
            discountAmount = (grossAmount * offer.discountValue) / 100;
            if (offer.maxDiscount) {
              discountAmount = Math.min(discountAmount, offer.maxDiscount);
            }
          } else {
            discountAmount = offer.discountValue;
          }
          discountAmount = Math.floor(discountAmount);
          discountAmount = Math.min(discountAmount, grossAmount); // Cannot exceed gross
          appliedCoupon = offer.code;
        }
      }
    }

    // Calculate Tax (On Gross Amount as per Frontend logic)
    const commissionableAmount = grossAmount;
    // Priority: Property-specific GST (if set and > 0) > Admin's global tax rate
    const finalGstRate = (property.gstPercentage !== undefined && property.gstPercentage > 0) 
      ? property.gstPercentage 
      : gstRate;

    // Determine State-based Split
    // User State is expected in req.body.address.state (from checkout billing)
    const hotelState = property.address?.state?.trim().toLowerCase() || '';
    const userState = req.body.address?.state?.trim().toLowerCase() || hotelState; // Default to hotelState if not provided to avoid bifurcation errors

    let cgst = 0, sgst = 0, igst = 0, taxType = 'none';
    const totalTaxAmount = Math.round((commissionableAmount * finalGstRate) / 100);

    if (finalGstRate > 0) {
      if (hotelState === userState) {
        taxType = 'intra';
        cgst = Math.round(totalTaxAmount / 2);
        sgst = totalTaxAmount - cgst; // Handle rounding
      } else {
        taxType = 'inter';
        igst = totalTaxAmount;
      }
    }

    const taxes = totalTaxAmount;

    // Calculate Platform Fee
    const platformFee = platformFeeType === 'percentage'
      ? Math.round((grossAmount * platformFeeRate) / 100)
      : platformFeeRate;

    // Calculate Total Amount (User Pays)
    // User Pays = (Gross - Discount) + Tax + Platform Fee
    const taxableAmount = grossAmount - discountAmount;
    let totalAmount = taxableAmount + taxes + platformFee;

    // Calculate Prepaid Discount
    let prepaidDiscountAmount = 0;
    let advanceAmount = 0;
    let remainingAmount = 0;

    if (paymentMethod === 'prepaid') {
      prepaidDiscountAmount = Math.floor(totalAmount * 0.05);
      totalAmount = totalAmount - prepaidDiscountAmount;
      advanceAmount = Math.floor(totalAmount * 0.30);
      remainingAmount = totalAmount - advanceAmount;
    }

    // Calculate Commission (On Gross Amount) => NEW SUBSCRIPTION LOGIC
    let adminCommission = 0;
    let appliedCommissionRate = commissionRate;

    // Dynamically retrieve PartnerSubscription logic
    let activeSub = null;
    try {
      const PartnerSubscription = mongoose.model('PartnerSubscription');
      activeSub = await PartnerSubscription.findOne({
        partnerId: property.partnerId,
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gt: new Date() }
      }).populate('planId');
    } catch (err) {
      // If model not loaded or fails, we fallback gracefully
      console.warn("Could not check subscription:", err.message);
    }

    if (activeSub) {
      // Subscribed Partner -> 0% commission
      appliedCommissionRate = 0;
      adminCommission = 0;
    } else {
      // Non-Subscribed Partner -> Standard deduction
      adminCommission = Math.round((taxableAmount * commissionRate) / 100);
      if (adminCommission < PaymentConfig.minCommission) {
        adminCommission = PaymentConfig.minCommission;
      }
    }

    // Calculate Partner Payout
    // Partner Payout = (Gross - Discount) + Taxes - Commission
    const partnerPayout = Math.max(0, Math.floor(taxableAmount + taxes - adminCommission));

    const bookingId = await generateBookingId();

    // Determine User Model based on mongoose document model name
    const userModel = req.user.constructor.modelName;

    // Create Booking Object
    const booking = new Booking({
      bookingId,
      userModel,
      userId: req.user._id,
      propertyId,
      propertyType: (property.propertyType || property.propertyTemplate || 'hotel').toLowerCase(),
      roomTypeId,
      bookingUnit: bookingUnit || 'room',
      checkInDate,
      checkOutDate,
      totalNights,
      guests: {
        adults: guests.adults || 1,
        children: guests.children || 0
      },
      pricePerNight,
      baseAmount,
      extraAdultPrice,
      extraChildPrice,
      extraCharges,
      taxes,
      taxRate: finalGstRate,
      taxType,
      cgst,
      sgst,
      igst,
      adminCommission,
      partnerPayout,
      discount: discountAmount,
      couponCode: appliedCoupon,
      platformFee: platformFee,
      totalAmount,
      prepaidDiscount: prepaidDiscountAmount,
      amountPaid: paymentMethod === 'wallet' ? totalAmount : (paymentMethod === 'prepaid' ? advanceAmount : 0),
      remainingAmount: (['pay_at_hotel', 'razorpay', 'online'].includes(paymentMethod)) ? totalAmount : (paymentMethod === 'prepaid' ? remainingAmount : 0),
      paymentMethod,
      bookingStatus: 'confirmed', // Default confirmed for pay_at_hotel/wallet, pending for razorpay
      paymentStatus: paymentMethod === 'pay_at_hotel' ? 'pending' : 'paid'
    });

    // Handle Wallet Payment (Partial or Full)
    if (paymentMethod === 'wallet' || (useWallet && walletDeduction > 0)) {
      const wallet = await Wallet.findOne({ partnerId: req.user._id, role: 'user' });
      const deductionAmount = walletDeduction || totalAmount;

      if (!wallet || wallet.balance < deductionAmount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }

      await wallet.debit(deductionAmount, `Booking #${bookingId}`, bookingId, 'booking');

      // Update booking paid amount since wallet was used
      booking.amountPaid = (booking.amountPaid || 0) + deductionAmount;
      booking.remainingAmount = Math.max(0, booking.remainingAmount - deductionAmount);

      if (paymentMethod === 'wallet' || (['online', 'razorpay', 'prepaid'].includes(paymentMethod) && (totalAmount - (walletDeduction || 0) <= 0))) {
        booking.paymentStatus = 'paid'; // If prepaid is fully paid by wallet, there is still remaining amount for hotel.
        if (paymentMethod === 'prepaid') {
          booking.paymentStatus = 'partial';
        }

        // --- DISTRIBUTE TO PARTNER & ADMIN (Settlement) ---

        // 1. Process Partner Transactions (Hiding Tax)
        if (property.partnerId) {
          let partnerWallet = await Wallet.findOne({ partnerId: property.partnerId, role: 'partner' });
          if (!partnerWallet) {
            partnerWallet = await Wallet.create({
              partnerId: property.partnerId,
              role: 'partner',
              balance: 0
            });
          }

          // A. Credit Partner the Taxable Amount + Taxes (GST now stays with Partner)
          // taxableAmount is (grossAmount - discountAmount)
          const partnerCredit = taxableAmount + (taxes || 0);
          await partnerWallet.credit(partnerCredit, `Payment for Booking #${bookingId} (Incl. GST)`, bookingId, 'booking_payment');
          
          // B. Debit Partner the Admin Commission only
          if (adminCommission > 0) {
            await partnerWallet.debit(adminCommission, `Booking Commission for Booking #${bookingId}`, bookingId, 'commission_deduction');
          }

          // NOTIFICATION: Wallet Update
          notificationService.sendToPartner(property.partnerId, {
            title: 'New Booking Settlement',
            body: `Booking #${bookingId} settled. Payout: ₹${booking.partnerPayout}`
          }, { type: 'wallet_update', bookingId: booking._id }).catch(e => console.error(e));
        }

        // 2. Credit Admin (Commission + Platform Fee)
        const totalAdminCredit = (adminCommission || 0) + (platformFee || 0);
        if (totalAdminCredit > 0) {
          let adminWallet = await Wallet.findOne({ role: 'admin' });
          if (!adminWallet) {
            const AdminUser = mongoose.model('User');
            const adminUser = await AdminUser.findOne({ role: { $in: ['admin', 'superadmin'] } }).sort({ createdAt: 1 });
            if (adminUser) {
              adminWallet = await Wallet.create({
                partnerId: adminUser._id,
                role: 'admin',
                balance: 0
              });
            }
          }

          if (adminWallet) {
            await adminWallet.credit(totalAdminCredit, `Commission & Platform Fee for Booking #${bookingId}`, bookingId, 'commission_tax');
          }
        }

        // REFERRAL: Trigger Referral Reward (Immediate Wallet Payment)
        referralService.processBookingCompletion(req.user._id, booking._id).catch(e => console.error('Referral Trigger Error (Wallet):', e));
      }
    }

    // Handle Online Payment (Razorpay)
    let razorpayOrder = null;
    if (['razorpay', 'online', 'prepaid'].includes(paymentMethod)) {
      if (paymentDetails && paymentDetails.paymentId) {
        // Already paid (Legacy check)
        booking.paymentStatus = paymentMethod === 'prepaid' ? 'partial' : 'paid';
        booking.paymentId = paymentDetails.paymentId;
      } else {
        // Initiate New Payment
        booking.bookingStatus = 'pending'; // Pending until payment
        booking.paymentStatus = 'pending';

        // Calculate amount to pay via Gateway
        let payableViaGateway = paymentMethod === 'prepaid' ? advanceAmount : totalAmount;
        const amountToPay = payableViaGateway - (useWallet ? (walletDeduction || 0) : 0);

        if (amountToPay > 0) {
          try {
            const instance = getRazorpayInstance();

            const options = {
              amount: Math.round(amountToPay * 100), // amount in paisa
              currency: PaymentConfig.currency || "INR",
              receipt: bookingId,
              notes: {
                bookingId: booking._id.toString(),
                userId: req.user._id.toString(),
                propertyId: propertyId.toString(),
                roomTypeId: roomTypeId.toString(),
                bookingUnit: (bookingUnit || 'room').toString(),
                rooms: units.toString(), // Pass rooms count for ledger
                // Store financial info for verification consistency
                adminCommission: adminCommission.toString(),
                partnerPayout: partnerPayout.toString(),
                taxes: taxes.toString(),
                discount: discountAmount.toString(),
                totalAmount: totalAmount.toString(),
                prepaidDiscountAmount: prepaidDiscountAmount.toString(),
                advanceAmount: advanceAmount.toString(),
                remainingAmount: remainingAmount.toString(),
                paymentMethod: paymentMethod, // Pass method to safely handle in verify
                type: 'booking_init'
              }
            };

            razorpayOrder = await instance.orders.create(options);

            // Set status to awaiting_payment so it doesn't show in user's list until paid
            booking.bookingStatus = 'awaiting_payment';
            booking.paymentStatus = 'pending';
          } catch (error) {
            console.error("Razorpay Order Creation Failed:", error);
            return res.status(500).json({ message: "Failed to initiate payment gateway" });
          }
        } else {
          // Fully paid by wallet (Covered by loop above, but double check status)
          booking.paymentStatus = paymentMethod === 'prepaid' ? 'partial' : 'paid';
          booking.bookingStatus = 'confirmed';
        }
      }
    }

    // Handle Pay at Hotel (Deduct commission and taxes immediately from App Wallet)
    if (paymentMethod === 'pay_at_hotel') {
      console.log(`[Booking] Pay at Hotel selected for #${bookingId}. Deducting commission upfront.`);
      const amountToDeduct = (adminCommission || 0) + (platformFee || 0);

      if (amountToDeduct > 0 && property.partnerId) {
        let partnerWallet = await Wallet.findOne({ partnerId: property.partnerId, role: 'partner' });
        if (!partnerWallet) {
          partnerWallet = await Wallet.create({ partnerId: property.partnerId, role: 'partner', balance: 0 });
        }
        await partnerWallet.debit(amountToDeduct, `Commission & Taxes for Pay at Hotel Booking #${bookingId}`, bookingId, 'commission_deduction');

        let adminWallet = await Wallet.findOne({ role: 'admin' });
        if (!adminWallet) {
          const adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } }).sort({ createdAt: 1 });
          if (adminUser) {
            adminWallet = await Wallet.create({ partnerId: adminUser._id, role: 'admin', balance: 0 });
          }
        }
        if (adminWallet) {
          await adminWallet.credit(amountToDeduct, `Commission & Taxes for Pay at Hotel Booking #${bookingId}`, bookingId, 'commission_tax');
        }
      }
    }

    await booking.save();

    // Update Inventory (Block Room) - Only if confirmed (Pay at Hotel or Paid)
    // If Razorpay pending, we still block inventory to avoid race conditions? 
    // Usually yes, with a timeout. For now, we block it.
    await AvailabilityLedger.create({
      propertyId,
      roomTypeId,
      inventoryType: booking.bookingUnit || 'room',
      source: 'platform',
      referenceId: booking._id,
      startDate: new Date(checkInDate),
      endDate: new Date(checkOutDate),
      units: units, // Use 'units' here (rooms count)
      createdBy: 'system'
    });

    // Increment Offer Usage if applied and confirmed
    if (appliedCoupon && booking.bookingStatus === 'confirmed') {
      await Offer.findOneAndUpdate({ code: appliedCoupon }, { $inc: { usageCount: 1 } });
    }

    // Populate booking details for frontend confirmation page (partnerId.phone for Contact Property)
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'propertyId',
        populate: { path: 'partnerId', select: 'phone email name' }
      })
      .populate('roomTypeId')
      .populate('userId', 'name email phone mobile');

    // Trigger Notifications AFTER populate so userId.email is available
    if (booking.bookingStatus === 'confirmed') {
      triggerBookingNotifications(populatedBooking);
    }

    res.status(201).json({
      success: true,
      booking: populatedBooking,
      paymentRequired: !!razorpayOrder,
      order: razorpayOrder,
      key: PaymentConfig.razorpayKeyId
    });
  } catch (error) {
    console.error('Create Booking Error:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const { type } = req.query; // 'upcoming', 'ongoing', 'completed', 'cancelled'
    const query = { userId: req.user._id };

    if (type === 'upcoming') {
      // Upcoming: Confirmed. NOT checked-in.
      // Hiding 'pending'/'awaiting_payment' to ensure only finalized bookings appear
      query.bookingStatus = { $in: ['confirmed'] };
    } else if (type === 'ongoing') {
      // Ongoing: Checked In
      query.bookingStatus = 'checked_in';
    } else if (type === 'completed') {
      // Completed: Checked Out (and legacy completed)
      query.bookingStatus = { $in: ['completed', 'checked_out'] };
    } else if (type === 'cancelled') {
      // Cancelled, No Show, Rejected
      query.bookingStatus = { $in: ['cancelled', 'no_show', 'rejected'] };
    }

    const bookings = await Booking.find(query)
      .populate({ path: 'propertyId', select: 'propertyName address location coverImage avgRating contactNumber ownerSignature invoiceTerms gstNumber propertyEmail', populate: { path: 'partnerId', select: 'phone' } })
      .populate('roomTypeId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (e) {
    console.error('Get My Bookings Error:', e);
    res.status(500).json({ message: e.message });
  }
};

export const getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'propertyId',
        select: 'propertyName address contactNumber location coverImage avgRating propertyType propertyTemplate gstNumber ownerSignature invoiceTerms propertyEmail checkInTime checkOutTime',
        populate: { path: 'partnerId', select: 'phone email name' }
      })
      .populate('roomTypeId')
      .populate('userId', 'name email phone mobile');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Allow User (Owner) or Admin/Partner (if needed, but separate endpoints exist usually)
    // For this specific 'user' endpoint, strictly check ownership
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (e) {
    console.error('Get Booking Detail Error:', e);
    res.status(500).json({ message: e.message });
  }
};

export const getPartnerBookings = async (req, res) => {
  try {
    // 1. Find all properties owned by this partner
    const properties = await Property.find({ partnerId: req.user._id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    // 2. Find bookings for these properties
    const { status } = req.query;
    const query = { propertyId: { $in: propertyIds } };

    if (status) {
      if (status === 'upcoming') {
        // Upcoming: Confirmed guests arriving in future.
        query.bookingStatus = { $in: ['confirmed'] };
      } else if (status === 'in_house') {
        // In-House: Active guests (Checked In)
        query.bookingStatus = 'checked_in';
      } else if (status === 'completed') {
        // Completed: Guests checked out
        query.bookingStatus = { $in: ['completed', 'checked_out'] };
      } else if (status === 'cancelled') {
        query.bookingStatus = { $in: ['cancelled', 'no_show', 'rejected'] };
      } else {
        // Direct status match fallback
        query.bookingStatus = status;
      }
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('propertyId', 'propertyName address location coverImage ownerSignature invoiceTerms gstNumber propertyEmail')
      .populate('roomTypeId', 'name')
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get Partner Bookings Error:', error);
    res.status(500).json({ message: 'Server error fetching bookings' });
  }
};

export const getPartnerBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate({
        path: 'propertyId',
        select: 'propertyName address contactNumber location coverImage avgRating propertyType propertyTemplate gstNumber ownerSignature invoiceTerms propertyEmail checkInTime checkOutTime',
        populate: { path: 'partnerId', select: 'phone email name' }
      })
      .populate('roomTypeId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    // Ensure propertyId is populated and has partnerId
    if (!booking.propertyId || !booking.propertyId.partnerId) {
      // Fallback or error if data consistency issue
      return res.status(403).json({ message: 'Booking data invalid (property link missing)' });
    }

    const partnerIdStr = booking.propertyId.partnerId._id ? booking.propertyId.partnerId._id.toString() : booking.propertyId.partnerId.toString();
    if (partnerIdStr !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get Partner Booking Detail Error:', error);
    res.status(500).json({ message: 'Server error fetching booking details' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('propertyId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Allow user to cancel or admin/partner
    if (booking.userId.toString() !== req.user._id.toString()) {
      // Add logic for partner/admin override if needed
      // return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    // --- 24-HOUR CANCELLATION POLICY CHECK ---
    // Industry Standard: Cancellation must be at least 24 hours before check-in time
    // EXCEPTION: Allow immediate cancellation if booking is still pending/awaiting payment
    const property = booking.propertyId;
    const checkInTime = property?.checkInTime || '12:00 PM'; // Default to 12 PM if not set
    
    const isPending = ['pending', 'awaiting_payment'].includes(booking.bookingStatus);
    const isAllowed = isPending || isCancellationAllowed(booking.checkInDate, checkInTime);

    if (!isAllowed) {
      const checkInDate = new Date(booking.checkInDate);
      const checkInDateTime = new Date(checkInDate);

      // Parse check-in time
      const timeStr = checkInTime.trim().toUpperCase();
      const isPM = timeStr.includes('PM');
      const timeMatch = timeStr.match(/(\d+):(\d+)/);
      let hours = 12;
      let minutes = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);
        if (isPM && hours !== 12) hours += 12;
        else if (!isPM && hours === 12) hours = 0;
      }
      checkInDateTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      const diffMs = checkInDateTime.getTime() - now.getTime();
      const diffHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));

      return res.status(400).json({
        message: `Cancellation is only allowed at least 24 hours before check-in. Check-in is in ${diffHours} hours.`,
        code: 'CANCELLATION_POLICY_VIOLATION',
        hoursRemaining: diffHours
      });
    }

    // Update Status
    booking.bookingStatus = 'cancelled';
    booking.cancellationReason = req.body.reason || 'User cancelled';
    booking.cancelledAt = new Date();

    // Release Inventory (Remove Ledger Entry)
    await AvailabilityLedger.deleteMany({ referenceId: booking._id });

    // Will update paymentStatus after refund processing if needed

    // --- PAYMENT GATEWAY REFUND (Razorpay/Online) ---
    // Process Razorpay refund FIRST before wallet operations
    let razorpayRefundProcessed = false;
    let razorpayRefundAmount = 0;

    if ((booking.paymentMethod === 'razorpay' || booking.paymentMethod === 'online') &&
      booking.paymentStatus === 'paid' &&
      booking.paymentId) {
      try {
        if (!razorpayInstance) {
          throw new Error('Razorpay not initialized');
        }

        // Process full refund through Razorpay
        const refundAmountInPaise = Math.round(booking.totalAmount * 100);
        const refund = await getRazorpayInstance().payments.refund(booking.paymentId, {
          amount: refundAmountInPaise,
          notes: {
            reason: booking.cancellationReason || 'User cancelled',
            bookingId: booking.bookingId || booking._id.toString()
          }
        });

        razorpayRefundProcessed = true;
        razorpayRefundAmount = refund.amount / 100; // Convert back to rupees

        // Update payment status to refunded
        booking.paymentStatus = 'refunded';

        console.log(`[CancelBooking] Razorpay refund processed: ${refund.id}, Amount: ₹${razorpayRefundAmount}`);
      } catch (razorpayError) {
        console.error('[CancelBooking] Razorpay refund failed:', razorpayError.message);
        // If Razorpay refund fails, still proceed with wallet credit as fallback
        // This ensures user gets refunded even if gateway fails
        // Log error but don't block cancellation
      }
    }

    // Save booking status update
    await booking.save();

    // --- WALLET REVERSAL LOGIC ---
    // Pay at Hotel: Reverse Commission Deduction (Refund Partner, Debit Admin)
    if (booking.paymentMethod === 'pay_at_hotel') {
      const refundAmount = (booking.taxes || 0) + (booking.adminCommission || 0);

      // Fetch full booking for partnerId
      const fullBooking = await Booking.findById(booking._id).populate('propertyId').populate('userId');

      if (refundAmount > 0 && fullBooking.propertyId && fullBooking.propertyId.partnerId) {
        const partnerWallet = await Wallet.findOne({ partnerId: fullBooking.propertyId.partnerId, role: 'partner' });
        const adminWallet = await Wallet.findOne({ role: 'admin' });

        if (partnerWallet && adminWallet) {
          // Credit Partner (Refund)
          await partnerWallet.credit(refundAmount, `Refund (User Cancel) for Booking #${booking.bookingId}`, booking.bookingId, 'commission_refund');

          // Debit Admin (Refund)
          await adminWallet.debit(refundAmount, `Refund (User Cancel) for Booking #${booking.bookingId}`, booking.bookingId, 'commission_refund');
        }
      }

      // Release Inventory


      // Trigger Cancellation Notifications
      // Skip notifications if the user just closed the payment popup (abandoned checkout)
      if (fullBooking && booking.cancellationReason !== 'Payment cancelled by user' && booking.cancellationReason !== 'New booking attempt initiated') {
        if (fullBooking.userId && fullBooking.userId.email) {
          emailService.sendBookingCancellationEmail(fullBooking.userId, fullBooking, 0)
            .catch(e => console.error('Cancel Email failed', e));
        }

        const ut = fullBooking.userModel ? fullBooking.userModel.toLowerCase() : 'user';

        // Notify User
        if (fullBooking.userId) {
          notificationService.sendToUser(fullBooking.userId._id, {
            title: 'Booking Cancelled',
            body: `Your booking #${fullBooking.bookingId} has been cancelled successfully.`
          }, { type: 'booking_cancelled', bookingId: booking._id }, ut).catch(e => console.error('User Cancel Push failed', e));
        }

        if (fullBooking.propertyId && fullBooking.propertyId.partnerId) {
          notificationService.sendToPartner(fullBooking.propertyId.partnerId, {
            title: 'Booking Cancelled',
            body: `Booking #${fullBooking.bookingId} Cancelled by User. Inventory released.`
          }, { type: 'booking_cancelled', bookingId: booking._id }).catch(e => console.error('Partner Cancel Push failed', e));

          mongoose.model('Partner').findById(fullBooking.propertyId.partnerId).then(partner => {
            if (partner && partner.email) {
              emailService.sendPartnerBookingCancelledEmail(partner, fullBooking).catch(e => console.error(e));
            }
          }).catch(e => console.error(e));
        }

        // Notify Admin
        notificationService.sendToAdmins({
          title: 'Booking Cancelled',
          body: `Booking #${fullBooking.bookingId} at ${fullBooking.propertyId?.propertyName} has been cancelled.`
        }, { type: 'booking_cancelled', bookingId: booking._id }).catch(e => console.error('Admin Cancel Push failed', e));
      }

      return res.json({ success: true, message: 'Booking cancelled successfully (Pay at Hotel - Commission Refunded)', booking });
    }

    // 1. Refund User (If paid, refunded, or partially paid via wallet)
    // If Razorpay refund was successful, skip wallet credit (refund already processed)
    // If Razorpay refund failed or payment method is wallet, credit user wallet
    if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded' || (booking.amountPaid > 0)) {
      const isAbandoned = booking.cancellationReason === 'Payment cancelled by user' || booking.cancellationReason === 'New booking attempt initiated';
      
      // Only credit wallet if:
      // - Payment method is wallet (always credit wallet)
      // - OR Razorpay refund failed (fallback)
      // - OR payment method is not Razorpay/online
      // - OR it was abandoned but wallet was deducted
      const shouldCreditWallet = booking.paymentMethod === 'wallet' ||
        !razorpayRefundProcessed ||
        !['razorpay', 'online'].includes(booking.paymentMethod) ||
        (isAbandoned && booking.amountPaid > 0);

      if (shouldCreditWallet) {
        let userWallet = await Wallet.findOne({ partnerId: booking.userId, role: 'user' });

        // Auto-create wallet if it doesn't exist
        if (!userWallet) {
          userWallet = await Wallet.create({
            partnerId: booking.userId,
            role: 'user',
            balance: 0
          });
        }

        // If abandoned or partially paid, refund exactly what was deducted (amountPaid). Otherwise refund totalAmount.
        const refundAmount = isAbandoned ? (booking.amountPaid || 0) : booking.totalAmount;

        if (refundAmount > 0) {
          await userWallet.credit(
            refundAmount,
            `Refund for Booking #${booking.bookingId}${isAbandoned ? ' (Checkout abandoned)' : (razorpayRefundProcessed ? ' (Razorpay refund failed, wallet credited as fallback)' : '')}`,
            booking.bookingId,
            'refund'
          );
        }
      }
    }

    // 2. Deduct Partner (If payout was credited)
    // Only reverse if booking was actually paid (not pay_at_hotel)
    // Check if Partner Payout > 0 and payment was processed
    if (booking.partnerPayout > 0 &&
      (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') &&
      booking.paymentMethod !== 'pay_at_hotel') {
      const fullBooking = await Booking.findById(booking._id).populate('propertyId');
      if (fullBooking.propertyId && fullBooking.propertyId.partnerId) {
        const partnerWallet = await Wallet.findOne({ partnerId: fullBooking.propertyId.partnerId, role: 'partner' });
        if (partnerWallet) {
          try {
            await partnerWallet.debit(
              booking.partnerPayout,
              `Reversal for Booking #${booking.bookingId}`,
              booking.bookingId,
              'refund_deduction'
            );
          } catch (err) {
            console.error("Partner Refund Deduction Failed:", err.message);
            // Don't throw - log and continue
          }
        }
      }
    }

    // 3. Deduct Admin (Commission + Tax)
    // Only reverse if booking was actually paid (not pay_at_hotel)
    if ((booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') &&
      booking.paymentMethod !== 'pay_at_hotel') {
      const adminDeduction = (booking.adminCommission || 0) + (booking.taxes || 0);
      if (adminDeduction > 0) {
        const adminWallet = await Wallet.findOne({ role: 'admin' });
        if (adminWallet) {
          try {
            await adminWallet.debit(
              adminDeduction,
              `Reversal for Booking #${booking.bookingId}`,
              booking.bookingId,
              'refund_deduction'
            );
          } catch (err) {
            console.error("Admin Refund Deduction Failed:", err.message);
            // Don't throw - log and continue
          }
        }
      }
    }

    // Trigger Cancellation Notifications
    // Skip notifications if the user just closed the payment popup (abandoned checkout)
    const fullBooking = await Booking.findById(booking._id).populate('userId').populate('propertyId');
    if (fullBooking && booking.cancellationReason !== 'Payment cancelled by user' && booking.cancellationReason !== 'New booking attempt initiated') {
      const ut = fullBooking.userModel ? fullBooking.userModel.toLowerCase() : 'user';

      if (fullBooking.userId && fullBooking.userId.email) {
        // Determine refund amount for email
        let refundAmount = 0;
        if (razorpayRefundProcessed) {
          refundAmount = razorpayRefundAmount;
        } else if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
          refundAmount = booking.totalAmount;
        }

        emailService.sendBookingCancellationEmail(fullBooking.userId, fullBooking, refundAmount)
          .catch(e => console.error('Cancel Email failed', e));
      }

      // Notify User
      if (fullBooking.userId) {
        notificationService.sendToUser(fullBooking.userId._id, {
          title: 'Booking Cancelled',
          body: `Your booking #${fullBooking.bookingId} at ${fullBooking.propertyId?.propertyName} has been cancelled.`
        }, { type: 'booking_cancelled', bookingId: booking._id }, ut).catch(e => console.error('User Cancel Push failed', e));
      }

      if (fullBooking.propertyId && fullBooking.propertyId.partnerId) {
        notificationService.sendToPartner(fullBooking.propertyId.partnerId, {
          title: 'Booking Cancelled',
          body: `Booking #${fullBooking.bookingId} at ${fullBooking.propertyId?.propertyName} has been cancelled.`
        }, { type: 'booking_cancelled', bookingId: booking._id }).catch(e => console.error('Partner Cancel Push failed', e));
      }

      // Notify Admin
      notificationService.sendToAdmins({
        title: 'Booking Cancelled',
        body: `Booking #${fullBooking.bookingId} at ${fullBooking.propertyId?.propertyName} has been cancelled.`
      }, { type: 'booking_cancelled', bookingId: booking._id }).catch(e => console.error('Admin Cancel Push failed', e));
    }



    // Prepare response message
    let responseMessage = 'Booking cancelled successfully';
    if (razorpayRefundProcessed) {
      responseMessage += `. Refund of ₹${razorpayRefundAmount.toLocaleString()} processed through payment gateway.`;
    } else if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') {
      if (booking.paymentMethod === 'wallet') {
        responseMessage += `. Refund of ₹${booking.totalAmount.toLocaleString()} credited to your wallet.`;
      } else {
        responseMessage += `. Refund of ₹${booking.totalAmount.toLocaleString()} will be processed.`;
      }
    }

    // HARD DELETE ABANDONED BOOKINGS TO PREVENT UI CLUTTER
    const isAbandoned = booking.cancellationReason === 'Payment cancelled by user' || booking.cancellationReason === 'New booking attempt initiated';
    if (isAbandoned) {
      await Booking.findByIdAndDelete(booking._id);
      return res.json({ success: true, message: 'Abandoned booking removed completely.' });
    }

    res.json({
      success: true,
      message: responseMessage,
      booking,
      refundProcessed: razorpayRefundProcessed,
      refundAmount: razorpayRefundProcessed ? razorpayRefundAmount : (booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded' ? booking.totalAmount : 0)
    });
  } catch (e) {
    console.error('Cancel Booking Error:', e);
    res.status(500).json({ message: e.message });
  }
};

// Mark Booking as Paid (Pay at Hotel)
export const markBookingAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('propertyId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Auth Check
    if (booking.propertyId.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(200).json({ success: true, message: 'Booking is already marked as paid.', booking });
    }

    // Update Status and Payment tracking
    booking.paymentStatus = 'paid';
    booking.amountPaid = booking.totalAmount;
    booking.remainingAmount = 0;
    await booking.save();

    // --- WALLET SETTLEMENT (Pay at Hotel) ---
    // The partner collected totalAmount (including tax) at the hotel.
    // They keep the tax. We only deduct the platform's cut (Commission + Platform Fee).

    const adminCommission = booking.adminCommission || 0;
    const platformFee = booking.platformFee || 0;
    const totalDeduction = adminCommission + platformFee;

    if (totalDeduction > 0 && booking.propertyId.partnerId) {
      try {
        let partnerWallet = await Wallet.findOne({ partnerId: booking.propertyId.partnerId, role: 'partner' });
        if (!partnerWallet) {
          partnerWallet = await Wallet.create({
            partnerId: booking.propertyId.partnerId,
            role: 'partner',
            balance: 0
          });
        }

        // Debit Partner for the Platform's cut only
        await partnerWallet.debit(
          totalDeduction,
          `Booking Commission & Fee for Booking #${booking.bookingId}`,
          booking.bookingId,
          'commission_deduction'
        );

        // Credit Admin (Commission + Platform Fee)
        let adminWallet = await Wallet.findOne({ role: 'admin' });
        if (!adminWallet) {
          const AdminUser = mongoose.model('User');
          const adminUser = await AdminUser.findOne({ role: { $in: ['admin', 'superadmin'] } }).sort({ createdAt: 1 });
          if (adminUser) {
            adminWallet = await Wallet.create({
              partnerId: adminUser._id,
              role: 'admin',
              balance: 0
            });
          }
        }

        if (adminWallet) {
          await adminWallet.credit(totalDeduction, `Comm & Fee (PayAtHotel) for Booking #${booking.bookingId}`, booking.bookingId, 'commission_tax');
        }

      } catch (err) {
        console.error("Wallet Settlement Failed during Mark as Paid:", err.message);
      }
    }

    // Trigger Notification
    if (booking.userId) {
      const ut = booking.userModel ? booking.userModel.toLowerCase() : 'user';
      notificationService.sendToUser(booking.userId, {
        title: 'Payment Received ✔️',
        body: `Your payment for booking #${booking.bookingId} has been confirmed by the hotel.`
      }, { type: 'payment_received', bookingId: booking._id }, ut).catch(console.error);

      // Notify Partner (for other devices)
      if (booking.propertyId && booking.propertyId.partnerId) {
        notificationService.sendToPartner(booking.propertyId.partnerId, {
          title: 'Payment Confirmed',
          body: `Payment for Booking #${booking.bookingId} marked as received.`
        }, { type: 'payment_confirmed', bookingId: booking._id }).catch(console.error);
      }

      // Notify Admin
      notificationService.sendToAdmins({
        title: 'Payment Confirmed 💰',
        body: `Payment of ₹${booking.totalAmount} confirmed for Booking #${booking.bookingId} at ${booking.propertyId?.propertyName}.`
      }, { type: 'payment_confirmed', bookingId: booking._id }).catch(console.error);
    }

    // REFERRAL: Trigger Referral Reward (Pay At Hotel Marked Paid)
    if (booking.userId) {
      referralService.processBookingCompletion(booking.userId, booking._id).catch(e => console.error('Referral Trigger Error (PayAtHotel):', e));
    }

    res.json({ success: true, message: 'Marked as Paid', booking });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Mark as No Show
export const markBookingNoShow = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('propertyId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Auth Check
    if (booking.propertyId.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus === 'no_show') {
      return res.status(200).json({ success: true, message: 'Booking is already marked as No Show.', booking });
    }

    booking.bookingStatus = 'no_show';
    // If No Show, should we cancel payment status? 
    // Usually No Show means they didn't come.
    await booking.save();

    // REVERSE DEDUCTION (Pay At Hotel - Only if previously marked as Paid)
    if (booking.paymentMethod === 'pay_at_hotel' && booking.paymentStatus === 'paid') {
      const refundAmount = (booking.taxes || 0) + (booking.adminCommission || 0);

      if (refundAmount > 0 && booking.propertyId.partnerId) {
        const partnerWallet = await Wallet.findOne({ partnerId: booking.propertyId.partnerId, role: 'partner' });
        const adminWallet = await Wallet.findOne({ role: 'admin' });

        if (partnerWallet && adminWallet) {
          // Credit Partner
          await partnerWallet.credit(refundAmount, `Refund (No Show reversal) for Booking #${booking.bookingId}`, booking.bookingId, 'commission_refund');

          // Debit Admin
          await adminWallet.debit(refundAmount, `Refund (No Show reversal) for Booking #${booking.bookingId}`, booking.bookingId, 'commission_refund');
        }
      }
    }
    // HANDLE PAY NOW / ONLINE / WALLET (Partner Earning Deducted -> Admin Credit)
    else if (['online', 'razorpay', 'wallet'].includes(booking.paymentMethod) && booking.paymentStatus === 'paid') {
      const deductionAmount = booking.partnerPayout || 0;

      if (deductionAmount > 0 && booking.propertyId.partnerId) {
        let partnerWallet = await Wallet.findOne({ partnerId: booking.propertyId.partnerId, role: 'partner' });

        // Ensure Admin Wallet
        let adminWallet = await Wallet.findOne({ role: 'admin' });
        if (!adminWallet) {
          const AdminUser = mongoose.model('User');
          const adminUser = await AdminUser.findOne({ role: { $in: ['admin', 'superadmin'] } }).sort({ createdAt: 1 });
          if (adminUser) {
            adminWallet = await Wallet.create({
              partnerId: adminUser._id,
              role: 'admin',
              balance: 0
            });
          }
        }

        if (partnerWallet && adminWallet) {
          try {
            // Debit Partner (Earning Reversal/Penalty)
            await partnerWallet.debit(deductionAmount, `No Show Penalty for Booking #${booking.bookingId}`, booking.bookingId, 'no_show_penalty');

            // Credit Admin (Funds retained by platform)
            await adminWallet.credit(deductionAmount, `No Show Credit (from Partner) for Booking #${booking.bookingId}`, booking.bookingId, 'no_show_credit');

          } catch (err) {
            console.error("No Show Wallet Deduction Failed (Pay Now):", err.message);
          }
        }
      }
    }

    // Release Inventory
    await AvailabilityLedger.deleteMany({ referenceId: booking._id });

    // Trigger Notifications
    if (booking.userId) {
      const ut = booking.userModel ? booking.userModel.toLowerCase() : 'user';
      notificationService.sendToUser(booking.userId, {
        title: 'Booking Status: No Show',
        body: `You didn't check-in for your booking #${booking.bookingId}. The booking has been marked as No Show.`
      }, { type: 'no_show', bookingId: booking._id }, ut).catch(console.error);
    }

    if (booking.propertyId && booking.propertyId.partnerId) {
      notificationService.sendToPartner(booking.propertyId.partnerId, {
        title: 'No Show Marked',
        body: `Booking #${booking.bookingId} has been marked as No Show. Inventory released.`
      }, { type: 'no_show', bookingId: booking._id }).catch(console.error);

      mongoose.model('Partner').findById(booking.propertyId.partnerId).then(partner => {
        if (partner && partner.email) emailService.sendPartnerBookingStatusUpdateEmail(partner, booking, 'No Show').catch(console.error);
      }).catch(console.error);
    }

    notificationService.sendToAdmins({
      title: 'No Show Reported',
      body: `Booking #${booking.bookingId} at ${booking.propertyId?.propertyName} marked as No Show.`
    }, { type: 'no_show', bookingId: booking._id }).catch(console.error);

    res.json({ success: true, message: 'Marked as No Show. Inventory released and commission refunded.', booking });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Check-In Booking
export const markCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('propertyId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.propertyId.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({ message: 'Booking must be confirmed to check in.' });
    }

    booking.bookingStatus = 'checked_in';
    await booking.save();

    if (booking.userId) {
      const ut = booking.userModel ? booking.userModel.toLowerCase() : 'user';
      notificationService.sendToUser(booking.userId, {
        title: 'Checked In Successfully 👋',
        body: `Welcome to ${booking.propertyId?.propertyName || 'Hotel'}. Enjoy your stay!`
      }, { type: 'check_in', bookingId: booking._id }, ut).catch(console.error);

      // Notify Partner (for other devices or confirmation)
      if (booking.propertyId && booking.propertyId.partnerId) {
        notificationService.sendToPartner(booking.propertyId.partnerId, {
          title: 'Guest Checked In',
          body: `Guest for Booking #${booking.bookingId} has been checked in.`
        }, { type: 'check_in', bookingId: booking._id }).catch(console.error);

        mongoose.model('Partner').findById(booking.propertyId.partnerId).then(partner => {
          if (partner && partner.email) emailService.sendPartnerBookingStatusUpdateEmail(partner, booking, 'Checked In').catch(console.error);
        }).catch(console.error);
      }

      // Notify Admin
      notificationService.sendToAdmins({
        title: 'Guest Checked In 🛎️',
        body: `Guest for Booking #${booking.bookingId} has checked in at ${booking.propertyId?.propertyName}.`
      }, { type: 'check_in', bookingId: booking._id }).catch(console.error);
    }

    res.json({ success: true, message: 'Checked In Successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check-Out Booking
export const markCheckOut = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('propertyId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.propertyId.partnerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.bookingStatus !== 'checked_in') {
      return res.status(400).json({ message: 'Booking must be checked-in to check out.' });
    }

    // Determine if payment is required
    if (booking.paymentStatus !== 'paid') {
      // Allow Partner to override? Or strict? 
      // Let's go strict for now but allow if query param ?force=true
      if (req.query.force !== 'true') {
        return res.status(400).json({ message: 'Payment Pending. Please Mark Paid first.', requirePayment: true });
      }
    }

    booking.bookingStatus = 'checked_out';
    // booking.actualCheckOutDate = new Date(); // Ideally add to schema
    await booking.save();

    // --- RELEASE INVENTORY (Early Checkout) ---
    try {
      const ledger = await AvailabilityLedger.findOne({ referenceId: booking._id });
      if (ledger) {
        const now = new Date();
        // If checking out earlier than the blocked end date, free up the rest
        if (now < new Date(ledger.endDate)) {
          ledger.endDate = now;
          await ledger.save();
          console.log(`[Inventory] Released inventory for Booking ${booking.bookingId} (Early Checkout)`);
        }
      }
    } catch (invErr) {
      console.error('Inventory Release Failed during Check-out:', invErr);
    }

    if (booking.userId) {
      const ut = booking.userModel ? booking.userModel.toLowerCase() : 'user';
      notificationService.sendToUser(booking.userId, {
        title: 'Checked Out Successfully 👋',
        body: `Thank you for staying at ${booking.propertyId?.propertyName || 'Hotel'}. Have a safe trip!`
      }, { type: 'check_out', bookingId: booking._id }, ut).catch(console.error);

      // Notify Partner
      if (booking.propertyId && booking.propertyId.partnerId) {
        notificationService.sendToPartner(booking.propertyId.partnerId, {
          title: 'Guest Checked Out',
          body: `Guest for Booking #${booking.bookingId} has been checked out.`
        }, { type: 'check_out', bookingId: booking._id }).catch(console.error);

        mongoose.model('Partner').findById(booking.propertyId.partnerId).then(partner => {
          if (partner && partner.email) emailService.sendPartnerBookingStatusUpdateEmail(partner, booking, 'Checked Out').catch(console.error);
        }).catch(console.error);
      }

      // Notify Admin
      notificationService.sendToAdmins({
        title: 'Guest Checked Out 🚪',
        body: `Guest for Booking #${booking.bookingId} has checked out from ${booking.propertyId?.propertyName}.`
      }, { type: 'check_out', bookingId: booking._id }).catch(console.error);
    }

    // Referral Trigger (if not already done)
    if (booking.userId && booking.paymentStatus === 'paid') {
      console.log(`[REFERRAL_DEBUG] Triggering booking completion for user: ${booking.userId}, Booking: ${booking._id}`);
      referralService.processBookingCompletion(booking.userId, booking._id).catch(e => console.error('[REFERRAL_DEBUG] Referral Trigger Error:', e));
    }

    res.json({ success: true, message: 'Checked Out Successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const downloadReceipt = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('propertyId')
      .populate('roomTypeId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Security Check
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    const isOwner = booking.userId?._id.toString() === userId || booking.userId.toString() === userId;
    const isPartner = booking.propertyId?.partnerId?.toString() === userId;
    const isAdmin = ['admin', 'superadmin'].includes(userRole);

    if (!isOwner && !isPartner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to download this receipt' });
    }

    // --- FETCH DYNAMIC TAX RATE ---
    // Use stored taxRate from booking (saved at creation time)
    // Fallback to current PlatformSettings for older bookings that don't have it
    let appliedTaxRate = booking.taxRate;
    const settings = await PlatformSettings.getSettings();
    if (appliedTaxRate === undefined || appliedTaxRate === null) {
      appliedTaxRate = (settings.taxRate !== undefined && settings.taxRate !== null) ? settings.taxRate : 0;
    }
    const companyState = (settings.companyState || 'Maharashtra').toLowerCase().trim();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${booking.bookingId}.pdf`);

    doc.pipe(res);

    // --- COLORS & STYLES ---
    const brandColor = '#1e3a8a'; // Dark Blue used in HTML design
    const textDark = '#1f2937'; // slate-800
    const textGray = '#4b5563'; // gray-600
    const borderColor = '#1e3a8a';
    const gridBorderColor = '#cbd5e1'; // slate-300
    const lightBg = '#f9fafb';
    const totalBg = '#eff6ff'; // Light blue highlight for Total Paid

    const property = booking.propertyId || {};
    const hotelName = (property.propertyName || 'Hotel').toUpperCase();
    const hotelEmail = property.propertyEmail || property.partnerId?.email || 'N/A';
    const hotelPhone = property.contactNumber || property.partnerId?.phone || 'N/A';
    const hotelAddress = property.address?.fullAddress || 'Address Not Available';
    const hotelGST = property.gstNumber || 'N/A';

    // --- 1. HEADER & TAX INVOICE INFO ---
    doc.fontSize(9).font('Helvetica-Bold').fillColor(brandColor).text('TAX INVOICE', 40, 40);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(textDark).text(hotelName, 40, 52, { width: 320 });
    
    let leftInfoY = doc.y + 5;
    doc.fontSize(8).font('Helvetica').fillColor(textGray)
      .text(hotelAddress.toUpperCase(), 40, leftInfoY, { width: 320, lineGap: 2 });
    
    leftInfoY = doc.y + 4;
    doc.text(`Phone: ${hotelPhone}`, 40, leftInfoY)
      .text(`Email: ${hotelEmail}`, 40, doc.y + 2);
    
    if (hotelGST !== 'N/A') {
      doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text(`GSTIN: ${hotelGST}`, 40, doc.y + 4);
    }

    // Right: Info Table (Date, Invoice #, Status)
    const tableX = 365;
    const tableY = 40;
    const colWidth = 95;
    
    const drawTableRow = (label, value, y, valColor = textDark, isValBold = false) => {
      doc.rect(tableX, y, colWidth, 18).fill(lightBg);
      doc.rect(tableX, y, colWidth, 18).stroke(gridBorderColor);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text(label, tableX + 8, y + 5);

      doc.rect(tableX + colWidth, y, colWidth, 18).stroke(gridBorderColor);
      doc.fontSize(8).font(isValBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(valColor).text(value, tableX + colWidth + 8, y + 5);
    };

    const invoiceDateStr = new Date(booking.createdAt).toLocaleDateString('en-US', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    drawTableRow('DATE', invoiceDateStr, tableY);
    drawTableRow('INVOICE #', booking.bookingId || 'N/A', tableY + 18);
    
    const paymentStatusStr = (booking.paymentStatus || 'PENDING').toUpperCase();
    const statusCol = paymentStatusStr === 'PAID' ? '#059669' : '#d97706';
    drawTableRow('STATUS', paymentStatusStr, tableY + 36, statusCol, true);

    // --- 2. CUSTOMER & STAY DETAILS (Side-by-Side Boxes) ---
    const boxY = Math.max(doc.y + 15, 145);
    const boxWidth = 250;
    const boxHeight = 70;
    
    // Left Box: Customer Details
    doc.rect(40, boxY, boxWidth, boxHeight).stroke(borderColor);
    doc.rect(40, boxY, boxWidth, 15).fillAndStroke(brandColor, borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff').text('CUSTOMER', 48, boxY + 4);
    
    doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text((booking.userId?.name || 'Guest').toUpperCase(), 48, boxY + 22);
    doc.fontSize(8).font('Helvetica').fillColor(textGray)
      .text(booking.userId?.email || 'N/A', 48, boxY + 35)
      .text(`+91 ${booking.userId?.phone || 'N/A'}`, 48, boxY + 48);

    // Right Box: Stay Details
    doc.rect(305, boxY, boxWidth, boxHeight).stroke(borderColor);
    doc.rect(305, boxY, boxWidth, 15).fillAndStroke(brandColor, borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff').text('STAY DETAILS', 313, boxY + 4);
    
    const checkInStr = new Date(booking.checkInDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const checkOutStr = new Date(booking.checkOutDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    doc.fontSize(8).font('Helvetica').fillColor(textDark)
      .text('Check-In:', 313, boxY + 22).font('Helvetica-Bold').text(checkInStr, 370, boxY + 22)
      .font('Helvetica').text('Check-Out:', 313, boxY + 35).font('Helvetica-Bold').text(checkOutStr, 370, boxY + 35)
      .font('Helvetica').text('Duration:', 313, boxY + 48).font('Helvetica-Bold').text(`${booking.totalNights} Night(s)`, 370, boxY + 48);

    // --- 3. DESCRIPTION TABLE ---
    const gridY = boxY + boxHeight + 15;
    const gridHeight = 75;
    
    // Draw Header
    doc.rect(40, gridY, 515, 18).fillAndStroke(brandColor, borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
      .text('DESCRIPTION', 48, gridY + 5)
      .text('QTY', 260, gridY + 5, { width: 50, align: 'center' })
      .text('UNIT PRICE', 310, gridY + 5, { width: 85, align: 'right' })
      .text('TAX', 395, gridY + 5, { width: 85, align: 'right' })
      .text('TOTAL', 480, gridY + 5, { width: 75, align: 'right' });

    // Draw Grid Outer Border
    doc.rect(40, gridY + 18, 515, gridHeight).stroke(gridBorderColor);
    
    // Draw Columns Vertical Borders
    doc.moveTo(260, gridY + 18).lineTo(260, gridY + 18 + gridHeight).stroke(gridBorderColor);
    doc.moveTo(310, gridY + 18).lineTo(310, gridY + 18 + gridHeight).stroke(gridBorderColor);
    doc.moveTo(395, gridY + 18).lineTo(395, gridY + 18 + gridHeight).stroke(gridBorderColor);
    doc.moveTo(480, gridY + 18).lineTo(480, gridY + 18 + gridHeight).stroke(gridBorderColor);

    // Draw Row Details
    const rowY = gridY + 28;
    const roomName = booking.roomTypeId?.name || 'Standard Unit';
    doc.fontSize(9).font('Helvetica-Bold').fillColor(textDark).text(roomName.toUpperCase(), 48, rowY);
    doc.fontSize(7).font('Helvetica').fillColor(textGray).text(`RESERVATION AT ${hotelName}`, 48, rowY + 14, { width: 200 });

    // Qty (Nights)
    doc.fontSize(9).font('Helvetica-Bold').fillColor(textDark).text(booking.totalNights.toString(), 260, rowY, { width: 50, align: 'center' });
    
    // Unit Price (Base Amount)
    doc.fontSize(9).font('Helvetica').fillColor(textDark).text(`Rs. ${booking.baseAmount.toLocaleString()}`, 310, rowY, { width: 85, align: 'right' });

    // Tax
    doc.text(`Rs. ${booking.taxes.toLocaleString()}`, 395, rowY, { width: 85, align: 'right' });

    // Total
    doc.fontSize(9).font('Helvetica-Bold').fillColor(brandColor).text(`Rs. ${booking.totalAmount.toLocaleString()}`, 480, rowY, { width: 75, align: 'right' });

    // --- 4. TERMS & BREAKDOWN SIDE-BY-SIDE (Aligned with grid columns) ---
    const bottomY = gridY + 18 + gridHeight;
    const hasGstBifurcation = booking.taxType !== 'inter';
    const numRows = 3 + (hasGstBifurcation ? 2 : 1) + (booking.platformFee !== undefined ? 1 : 0);
    const rowHeight = 16;
    const breakdownHeight = numRows * rowHeight;

    // Terms and Conditions Box (Spans Columns 1, 2, 3: X = 40 to X = 395, width = 355)
    doc.rect(40, bottomY, 355, breakdownHeight).stroke(gridBorderColor);
    doc.rect(40, bottomY, 355, 14).fillAndStroke(brandColor, borderColor);
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff').text('TERMS & CONDITIONS', 48, bottomY + 4);
    
    const terms = property.invoiceTerms || '1. Present valid ID proof at check-in.\n2. Standard check-in/out times must be followed.\n3. Cancellation subject to property policy.';
    doc.fontSize(7).font('Helvetica').fillColor(textGray).text(terms, 48, bottomY + 20, { width: 339, lineGap: 2.5 });

    // Breakdown Table Rows (Labels span Col 4: X = 395, width = 85. Values span Col 5: X = 480, width = 75)
    let currentDrawY = bottomY;
    const drawBreakdownRow = (label, valStr, isDiscount = false) => {
      doc.rect(395, currentDrawY, 85, rowHeight).fill(lightBg);
      doc.rect(395, currentDrawY, 85, rowHeight).stroke(gridBorderColor);
      doc.fontSize(7).font('Helvetica-Bold').fillColor(textGray).text(label, 395 + 8, currentDrawY + 5);

      doc.rect(480, currentDrawY, 75, rowHeight).stroke(gridBorderColor);
      doc.fontSize(8).font('Helvetica-Bold').fillColor(isDiscount ? '#059669' : textDark).text(valStr, 480, currentDrawY + 4, { width: 67, align: 'right' });
      
      currentDrawY += rowHeight;
    };

    const unitPriceTotal = booking.baseAmount + (booking.extraCharges || 0);
    drawBreakdownRow('SUBTOTAL', `Rs. ${unitPriceTotal.toLocaleString()}`);
    
    const totalDiscount = booking.discount + (booking.prepaidDiscount || 0);
    drawBreakdownRow('DISCOUNT', `Rs. ${totalDiscount.toLocaleString()}`, totalDiscount > 0);

    // GST Bifurcation rows
    if (booking.taxType === 'inter') {
      drawBreakdownRow(`IGST (${appliedTaxRate}%)`, `Rs. ${booking.taxes.toLocaleString()}`);
    } else {
      const halfTax = (booking.taxes / 2);
      const halfRate = (appliedTaxRate / 2).toFixed(1);
      drawBreakdownRow(`CGST (${halfRate}%)`, `Rs. ${halfTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      drawBreakdownRow(`SGST (${halfRate}%)`, `Rs. ${halfTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    }

    if (booking.platformFee !== undefined) {
      drawBreakdownRow('PLATFORM FEES', `Rs. ${booking.platformFee.toLocaleString()}`);
    }

    // Total Paid row (Large blue highlighted, aligned with borders)
    const totalPaidY = bottomY + breakdownHeight;
    const totalPaidHeight = 22;

    doc.rect(40, totalPaidY, 355, totalPaidHeight).fill(totalBg);
    doc.rect(40, totalPaidY, 355, totalPaidHeight).stroke(borderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(brandColor).text('TOTAL PAID', 48, totalPaidY + 7);

    doc.rect(395, totalPaidY, 160, totalPaidHeight).fill(totalBg);
    doc.rect(395, totalPaidY, 160, totalPaidHeight).stroke(borderColor);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(brandColor).text(`Rs. ${booking.totalAmount.toLocaleString()}`, 395, totalPaidY + 6, { width: 152, align: 'right' });

    // --- 5. SIGNATURE SECTION ---
    const sigY = totalPaidY + totalPaidHeight + 15;
    const sigX = 405;
    
    if (property.ownerSignature) {
      try {
        doc.image(property.ownerSignature, sigX + 15, sigY, { width: 110, height: 40 });
      } catch (e) {
        console.warn("Could not render signature image on PDF", e);
      }
    }

    const signLabelY = sigY + 45;
    doc.moveTo(sigX, signLabelY).lineTo(sigX + 140, signLabelY).stroke(gridBorderColor);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(textDark).text('AUTHORIZED SIGNATORY', sigX, signLabelY + 5, { width: 140, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor(textGray).text(hotelName, sigX, signLabelY + 15, { width: 140, align: 'center' });

    // Footer Branding
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#9ca3af').text('THANK YOU FOR BOOKING VIA NOWSTAY.IN', 40, 770, { align: 'center', width: 515 });

    doc.end();

  } catch (error) {
    console.error('Download Receipt Error:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  }
};
