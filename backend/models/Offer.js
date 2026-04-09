import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
    unique: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number, // Cap for percentage discounts
  },
  image: {
    type: String,
    required: true
  },
  btnText: {
    type: String,
    default: "Book now"
  },
  bg: {
    type: String,
    default: "bg-[#1A1A1A]"
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number, // total times this coupon can be used
    default: 1000
  },
  usageCount: {
    type: Number,
    default: 0
  },
  userLimit: {
    type: Number, // times a single user can use it
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;
