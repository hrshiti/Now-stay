import mongoose from 'mongoose';

const referralTrackingSchema = new mongoose.Schema({
    referrerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referrerModel'
    },
    referrerModel: {
        type: String,
        required: true,
        enum: ['User', 'Partner', 'Admin']
    },
    referredUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'referredUserModel'
    },
    referredUserModel: {
        type: String,
        required: true,
        enum: ['User', 'Partner'],
        default: 'User'
    },
    referralCodeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ReferralCode'
    },
    referralProgramId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'ReferralProgram'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'rejected'],
        default: 'pending'
    },
    rewardAmount: {
        type: Number,
        required: true
    },
    // When 'first_booking' is the trigger
    triggerBookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    completedAt: Date,
    ipAddress: String, // For fraud detection
    deviceInfo: String
}, { timestamps: true });

// Index for quick stats lookup
referralTrackingSchema.index({ referrerId: 1, status: 1 });
referralTrackingSchema.index({ referredUserId: 1, referredUserModel: 1 }, { unique: true });

const ReferralTracking = mongoose.model('ReferralTracking', referralTrackingSchema);
export default ReferralTracking;
