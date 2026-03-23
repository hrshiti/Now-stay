import SubscriptionPlan from '../models/SubscriptionPlan.js';
import PartnerSubscription from '../models/PartnerSubscription.js';
import Partner from '../models/Partner.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import PaymentConfig from '../config/payment.config.js';

// Initialize Razorpay
let razorpay;
try {
  if (PaymentConfig.razorpayKeyId && PaymentConfig.razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: PaymentConfig.razorpayKeyId,
      key_secret: PaymentConfig.razorpayKeySecret
    });
  }
} catch (err) {
  console.error("Razorpay Init Failed in Subscriptions:", err.message);
}

// --- ADMIN ROUTES ---

export const createPlan = async (req, res) => {
  try {
    const { name, description, price, durationInMonths, commissionRate } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and Price are required' });
    }

    const plan = new SubscriptionPlan({
      name,
      description,
      price,
      durationInMonths: durationInMonths || 12,
      commissionRate: commissionRate || 0
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
    const { name, description, price, durationInMonths, commissionRate, isActive } = req.body;

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      { name, description, price, durationInMonths, commissionRate, isActive },
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
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error('Get Active Plans Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const subscription = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate('planId');

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error('Get My Subscription Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createSubscriptionOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);

    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: 'Plan not found or inactive' });
    }

    if (!razorpay) {
      return res.status(500).json({ message: 'Payment gateway not configured' });
    }

    // Check for existing active subscription to handle Upgrade/Renewal logic
    let finalPrice = plan.price;
    const currentSub = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      isActive: true,
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

    const order = await razorpay.orders.create(options);
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
    const activeSub = await PartnerSubscription.findOne({
      partnerId: req.user._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate('planId');

    let finalStartDate = new Date();
    const finalEndDate = new Date();
    let isUpgrade = false;
    let actualPaidAmount = plan.price;

    // Fetch the actual amount paid from Razorpay order to be safe
    if (razorpay_order_id) {
       try {
         const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
         actualPaidAmount = rzpOrder.amount / 100;
       } catch (e) {
         console.warn("Failed to fetch order amount from Razorpay, using plan price");
       }
    }

    if (activeSub && activeSub.planId) {
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
    
    // Clean up if it was an upgrade (Switch immediately)
    if (isUpgrade && activeSub) {
      activeSub.isActive = false;
      await activeSub.save();
    }

    res.status(201).json({ success: true, subscription, message: 'Subscription purchased successfully!' });
  } catch (error) {
    console.error('Buy Subscription Error:', error);
    res.status(500).json({ message: 'Server error buying subscription' });
  }
};
