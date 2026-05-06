import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema(
  {
    platformOpen: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    bookingDisabledMessage: {
      type: String,
      default: 'Bookings are temporarily disabled. Please try again later.'
    },
    maintenanceTitle: {
      type: String,
      default: 'We will be back soon.'
    },
    maintenanceMessage: {
      type: String,
      default: 'The platform is under scheduled maintenance. Please check back in some time.'
    },
    defaultCommission: {
      type: Number,
      default: 10 // Percentage
    },
    taxRate: {
      type: Number,
      default: 12 // Percentage (GST)
    },
    platformFee: {
      type: Number,
      default: 0 // Amount or Percentage
    },
    platformFeeType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    companyState: {
      type: String,
      default: 'Maharashtra' // Base state for GST rules
    }
  },
  { timestamps: true }
);

platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export default PlatformSettings;

