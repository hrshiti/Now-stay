import SubscriptionPlan from '../models/SubscriptionPlan.js';
import PartnerSubscription from '../models/PartnerSubscription.js';
import Partner from '../models/Partner.js';
import Property from '../models/Property.js';
import Wallet from '../models/Wallet.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import PaymentConfig from '../config/payment.config.js';

import { getRazorpayInstance } from '../utils/razorpay.js';

// --- ADMIN ROUTES ---

export const createPlan = async (req, res) => {
  try {
    const { name, description, price, durationInMonths, commissionRate, propertyTemplate, starRatings, hotelCategories, resortTypes } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and Price are required' });
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      price,
      durationInMonths: durationInMonths || 12,
      commissionRate: commissionRate || 0,
      propertyTemplate: propertyTemplate || 'all',
      starRatings: Array.isArray(starRatings) ? starRatings : [],
      hotelCategories: Array.isArray(hotelCategories) ? hotelCategories : [],
      resortTypes: Array.isArray(resortTypes) ? resortTypes : []
    });

    await plan.save();
    res.status(201).json({ success: true, plan, message: 'Subscription Plan created successfully' });
  } catch (error) {
    console.error('Create Plan Error:', error);
    res.status(500).json({ message: 'Server error creating plan' });
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Get Plans Error:', error);
    res.status(500).json({ message: 'Server error getting plans' });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, durationInMonths, commissionRate, isActive, propertyTemplate, starRatings, hotelCategories, resortTypes } = req.body;

    const updateFields = { name, description, price, durationInMonths, commissionRate, isActive, propertyTemplate };
    if (starRatings !== undefined) updateFields.starRatings = Array.isArray(starRatings) ? starRatings : [];
    if (hotelCategories !== undefined) updateFields.hotelCategories = Array.isArray(hotelCategories) ? hotelCategories : [];
    if (resortTypes !== undefined) updateFields.resortTypes = Array.isArray(resortTypes) ? resortTypes : [];

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.status(200).json({ success: true, plan, message: 'Plan updated successfully' });
  } catch (error) {
    console.error('Update Plan Error:', error);
    res.status(500).json({ message: 'Server error updating plan' });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.status(200).json({ success: true, message: 'Plan deactivated successfully' });
  } catch (error) {
    console.error('Delete Plan Error:', error);
    res.status(500).json({ message: 'Server error deleting plan' });
  }
};

export const getPartnerSubscriptions = async (req, res) => {
  try {
    // Admin checking all partner subscriptions
    const subscriptions = await PartnerSubscription.find()
      .populate('planId')
      .populate('partnerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    console.error('Get Partner Subscriptions Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- PARTNER ROUTES ---

export const getActivePlans = async (req, res) => {
  try {
    let { propertyId, propertyTemplate, starRating, hotelCategory, resortType } = req.query;

    if (propertyId) {
      const property = await Property.findById(propertyId);
      if (property) {
        propertyTemplate = propertyTemplate || property.propertyTemplate;
        starRating = starRating || property.starRating;
        hotelCategory = hotelCategory || property.hotelCategory;
        resortType = resortType || property.resortType;
      }
    }

    const allPlans = await SubscriptionPlan.find({ isActive: true });

    const filteredPlans = allPlans.filter(plan => {
      // 1. Property Template check
      if (plan.propertyTemplate && plan.propertyTemplate !== 'all' && propertyTemplate) {
        if (plan.propertyTemplate.toLowerCase() !== propertyTemplate.toLowerCase()) {
          return false;
        }
      }

      // 2. Star Rating check
      if (plan.starRatings && plan.starRatings.length > 0 && starRating) {
        const numericStar = Number(starRating);
        if (!plan.starRatings.includes(numericStar)) {
          return false;
        }
      }

      // 3. Hotel Category / Scale check
      if (plan.hotelCategories && plan.hotelCategories.length > 0 && hotelCategory) {
        const matchesCategory = plan.hotelCategories.some(
          cat => cat.toLowerCase() === String(hotelCategory).toLowerCase()
        );
        if (!matchesCategory) {
          return false;
        }
      }

      // 4. Resort Type check
      if (plan.resortTypes && plan.resortTypes.length > 0 && resortType) {
        const matchesResort = plan.resortTypes.some(
          rt => rt.toLowerCase() === String(resortType).toLowerCase()
        );
        if (!matchesResort) {
          return false;
        }
      }

      return true;
    });

    res.status(200).json({ success: true, plans: filteredPlans });
  } catch (error) {
    console.error('Get Active Plans Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const subscriptions = await PartnerSubscription.find({
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate('planId');

    res.status(200).json({ success: true, subscriptions, subscription: subscriptions[0] || null });
  } catch (error) {
    console.error('Get My Subscription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId, propertyId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    // Property Category & Star Rating Condition Check (Only if specific propertyId is provided)
    let targetProperty = null;
    if (propertyId) {
      targetProperty = await Property.findById(propertyId);
    }

    if (targetProperty) {
      // Validate Template
      if (plan.propertyTemplate && plan.propertyTemplate !== 'all' && targetProperty.propertyTemplate) {
        if (plan.propertyTemplate.toLowerCase() !== targetProperty.propertyTemplate.toLowerCase()) {
          return res.status(400).json({ message: `This plan is for ${plan.propertyTemplate.toUpperCase()} only, but your property is a ${targetProperty.propertyTemplate.toUpperCase()}` });
        }
      }

      // Validate Star Rating
      if (plan.starRatings && plan.starRatings.length > 0 && targetProperty.starRating) {
        if (!plan.starRatings.includes(Number(targetProperty.starRating))) {
          return res.status(400).json({ message: `This plan is restricted to ${plan.starRatings.join(', ')} Star properties. Your property is ${targetProperty.starRating} Star.` });
        }
      }

      // Validate Hotel Category
      if (plan.hotelCategories && plan.hotelCategories.length > 0 && targetProperty.hotelCategory) {
        const matchesCat = plan.hotelCategories.some(c => c.toLowerCase() === String(targetProperty.hotelCategory).toLowerCase());
        if (!matchesCat) {
          return res.status(400).json({ message: `This plan is for ${plan.hotelCategories.join(', ')} categories, but your hotel is categorized as ${targetProperty.hotelCategory}.` });
        }
      }
    }

    // Case: Online Payment
    let finalPrice = plan.price;
    const currentSub = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate('planId');

    if (currentSub && currentSub.planId) {
      // UPGRADE CASE: New price is higher than current plan price
      if (plan.price > currentSub.planId.price) {
        const now = new Date();
        const start = new Date(currentSub.startDate);
        const end = new Date(currentSub.endDate);
        
        const totalDurationMs = end - start;
        const remainingDurationMs = end - now;
        
        if (totalDurationMs > 0 && remainingDurationMs > 0) {
          // Calculate credit for unused time: (RemainingDays / TotalDays) * AmountPaid
          const credit = (remainingDurationMs / totalDurationMs) * (currentSub.amountPaid || currentSub.planId.price);
          finalPrice = Math.max(0, plan.price - credit);
        }
      }
      // DOWNGRADE or RENEWAL: No price deduction, full price applies
    }

    const options = {
      amount: Math.round(finalPrice * 100), // in paise
      currency: 'INR',
      receipt: `sub_rcpt_${Date.now()}`,
      notes: {
        planId: plan._id.toString(),
        partnerId: req.user._id.toString(),
        originalPrice: plan.price.toString(),
        finalPrice: finalPrice.toString(),
        type: 'subscription'
      }
    };

    const order = await getRazorpayInstance().orders.create(options);
    res.status(200).json({ 
      success: true, 
      order: {
        ...order,
        key: PaymentConfig.razorpayKeyId
      }
    });

  } catch (error) {
    console.error('Create Subscription Order Error:', error);
    res.status(500).json({ message: 'Error creating payment order' });
  }
};

export const buySubscription = async (req, res) => {
  try {
    const { 
      planId, 
      paymentMethod, 
      paymentId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    
    // Validate Plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Valid plan not found' });
    }

    // --- Razorpay Verification (if applicable) ---
    if (razorpay_signature) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", PaymentConfig.razorpayKeySecret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }
    }

    // --- Handle Subscription Logic (Upgrade/Downgrade/Renewal) ---
    // Look for an active subscription for the SAME propertyTemplate
    const activeSub = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate({
      path: 'planId',
      match: { propertyTemplate: plan.propertyTemplate }
    });

    // Check if populated plan matches the required template
    const isValidActiveSub = activeSub && activeSub.planId;

    let finalStartDate = new Date();
    const finalEndDate = new Date();
    let isUpgrade = false;
    let actualPaidAmount = plan.price;

    // Fetch the actual amount paid from Razorpay order to be safe
    if (razorpay_order_id) {
       try {
         const rzpOrder = await getRazorpayInstance().orders.fetch(razorpay_order_id);
         actualPaidAmount = rzpOrder.amount / 100;
       } catch (e) {
         console.warn("Failed to fetch order amount from Razorpay, using plan price");
       }
    }

    if (isValidActiveSub) {
      const isSamePlan = activeSub.planId._id.toString() === planId.toString();
      const isPriceHigher = plan.price > activeSub.planId.price;

      if (isSamePlan) {
        // CASE: SAME PLAN (RENEWAL) -> Extend existing end date
        finalStartDate = new Date(activeSub.endDate);
        finalEndDate.setTime(finalStartDate.getTime());
        finalEndDate.setMonth(finalEndDate.getMonth() + plan.durationInMonths);
      } else if (isPriceHigher) {
        // CASE: UPGRADE -> Start immediately today, but old plan stops
        isUpgrade = true;
        finalStartDate = new Date();
        finalEndDate.setMonth(finalEndDate.getMonth() + plan.durationInMonths);
      } else {
        // CASE: DOWNGRADE -> Start after the current active one ends
        finalStartDate = new Date(activeSub.endDate);
        finalEndDate.setTime(finalStartDate.getTime());
        finalEndDate.setMonth(finalEndDate.getMonth() + plan.durationInMonths);
      }
    } else {
      // CASE: NEW/NO ACTIVE SUBSCRIPTION
      finalStartDate = new Date();
      finalEndDate.setMonth(finalEndDate.getMonth() + plan.durationInMonths);
    }
    
    // Create new Subscription
    const subscription = new PartnerSubscription({
      partnerId: req.user._id,
      planId: plan._id,
      startDate: finalStartDate,
      endDate: finalEndDate,
      paymentMethod: paymentMethod || 'online',
      paymentId: razorpay_payment_id || paymentId || 'MANUAL-TEST',
      amountPaid: actualPaidAmount,
      paymentStatus: 'paid',
      isActive: true,
      commissionRate: plan.commissionRate
    });

    await subscription.save();
    
    // Clean up if it was an upgrade (Switch immediately for the same property type)
    if (isUpgrade && isValidActiveSub) {
      activeSub.isActive = false;
      await activeSub.save();
    }

    res.status(201).json({ success: true, subscription, message: 'Subscription purchased successfully!' });
  } catch (error) {
    console.error('Buy Subscription Error:', error);
    res.status(500).json({ message: 'Server error buying subscription' });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const { propertyTemplate } = req.query;

    let matchQuery = {
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    };

    if (propertyTemplate && propertyTemplate !== 'undefined') {
      // Find plans that match the requested property template (or 'all')
      const validPlans = await SubscriptionPlan.find({ 
        propertyTemplate: { $in: [propertyTemplate, 'all'] } 
      });
      const validPlanIds = validPlans.map(p => p._id);
      matchQuery.planId = { $in: validPlanIds };
    }

    const activeSub = await PartnerSubscription.findOne(matchQuery).populate('planId');

    const totalSubCount = await PartnerSubscription.countDocuments({
      partnerId: req.user._id
    });

    res.status(200).json({
      success: true,
      hasActiveSubscription: !!activeSub,
      hasExpiredSubscription: !activeSub && totalSubCount > 0,
      activeSubscription: activeSub
    });
  } catch (error) {
    console.error('Get Subscription Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    // Find active subscription for the requesting partner
    const query = { partnerId: req.user._id, isActive: true };
    if (subscriptionId) {
      query._id = subscriptionId;
    }

    const sub = await PartnerSubscription.findOne(query).populate('planId');

    if (!sub) {
      return res.status(404).json({ message: 'No active subscription found to cancel' });
    }

    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);

    const oneDayMs = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end - start) / oneDayMs));
    const remainingDays = Math.max(0, Math.ceil((end - now) / oneDayMs));

    let refundAmount = 0;
    if (remainingDays > 0) {
      const baseAmount = sub.amountPaid || sub.planId?.price || 0;
      if (remainingDays >= totalDays) {
        refundAmount = baseAmount;
      } else {
        refundAmount = Math.max(0, Math.round((remainingDays / totalDays) * baseAmount));
      }
    }

    // Deactivate subscription
    sub.isActive = false;
    sub.paymentStatus = 'cancelled';
    sub.refundAmount = refundAmount;
    sub.cancelledAt = now;
    sub.cancelledBy = 'partner';
    await sub.save();

    // Credit refund to partner wallet if refundAmount > 0
    if (refundAmount > 0) {
      let wallet = await Wallet.findOne({ partnerId: req.user._id, role: 'partner' });
      if (!wallet) {
        wallet = await Wallet.create({ partnerId: req.user._id, role: 'partner', balance: 0, modelType: 'Partner' });
      }
      await wallet.credit(
        refundAmount,
        `Subscription Cancellation Refund (${sub.planId?.name || 'Plan'})`,
        sub._id,
        'refund'
      );
    }

    // Send Notification to Admin
    try {
      const Admin = mongoose.model('Admin');
      const Notification = mongoose.model('Notification');
      const admins = await Admin.find({}).select('_id');
      const partnerName = req.user.name || req.user.email || 'Partner';
      const planName = sub.planId?.name || 'Subscription Plan';

      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          userType: 'admin',
          userModel: 'Admin',
          title: 'Subscription Cancelled ⚠️',
          body: `Partner "${partnerName}" cancelled plan "${planName}". Refund of ₹${refundAmount} credited to wallet.`,
          type: 'subscription_cancelled',
          data: { partnerId: String(req.user._id), subscriptionId: String(sub._id), refundAmount }
        });
      }
    } catch (notifErr) {
      console.warn('Failed to send admin cancellation notification:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Subscription cancelled successfully. ₹${refundAmount} has been credited to your wallet.`,
      refundAmount,
      subscription: sub
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    res.status(500).json({ message: 'Server error cancelling subscription' });
  }
};

export const adminCancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await PartnerSubscription.findById(id).populate('planId');

    if (!sub || !sub.isActive) {
      return res.status(404).json({ message: 'Active subscription not found' });
    }

    const now = new Date();
    const start = new Date(sub.startDate);
    const end = new Date(sub.endDate);

    const oneDayMs = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end - start) / oneDayMs));
    const remainingDays = Math.max(0, Math.ceil((end - now) / oneDayMs));

    let refundAmount = 0;
    if (remainingDays > 0) {
      const baseAmount = sub.amountPaid || sub.planId?.price || 0;
      if (remainingDays >= totalDays) {
        refundAmount = baseAmount;
      } else {
        refundAmount = Math.max(0, Math.round((remainingDays / totalDays) * baseAmount));
      }
    }

    // Deactivate subscription
    sub.isActive = false;
    sub.paymentStatus = 'cancelled';
    sub.refundAmount = refundAmount;
    sub.cancelledAt = now;
    sub.cancelledBy = 'admin';
    await sub.save();

    // Credit refund to partner wallet
    if (refundAmount > 0) {
      let wallet = await Wallet.findOne({ partnerId: sub.partnerId, role: 'partner' });
      if (!wallet) {
        wallet = await Wallet.create({ partnerId: sub.partnerId, role: 'partner', balance: 0, modelType: 'Partner' });
      }
      await wallet.credit(
        refundAmount,
        `Admin Subscription Cancellation Refund (${sub.planId?.name || 'Plan'})`,
        sub._id,
        'refund'
      );
    }

    res.status(200).json({
      success: true,
      message: `Subscription cancelled. ₹${refundAmount} credited to partner wallet.`,
      refundAmount,
      subscription: sub
    });
  } catch (error) {
    console.error('Admin Cancel Subscription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
