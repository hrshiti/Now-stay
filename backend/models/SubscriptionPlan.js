import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  durationInMonths: { type: Number, default: 12 },
  commissionRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
