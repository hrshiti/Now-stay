import mongoose from 'mongoose';

const partnerSubscriptionSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  paymentId: String,
  paymentMethod: String,
  amountPaid: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('PartnerSubscription', partnerSubscriptionSchema);
