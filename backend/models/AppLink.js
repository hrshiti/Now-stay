import mongoose from 'mongoose';

const appLinkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'App name is required'],
      trim: true
    },
    logo: {
      type: String,
      required: [true, 'App logo is required']
    },
    playStoreUrl: {
      type: String,
      trim: true,
      default: ''
    },
    appStoreUrl: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const AppLink = mongoose.model('AppLink', appLinkSchema);

export default AppLink;
