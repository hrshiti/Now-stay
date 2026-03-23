import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ['user', 'partner'],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved'],
      default: 'new'
    },
    meta: {
      type: Object
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'audienceModel'
    },
    audienceModel: {
      type: String,
      enum: ['User', 'Partner', 'Admin']
    }
  },
  { timestamps: true }
);

contactMessageSchema.pre('save', async function () {
  // If we have a userId but no audienceModel was set manually
  if (this.userId && !this.audienceModel) {
    // Default based on audience if not specified
    this.audienceModel = this.audience === 'partner' ? 'Partner' : 'User';
  }
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;

