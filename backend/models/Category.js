import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: {
    type: String, // Lucide icon name, e.g., 'Palmtree'
    default: 'Building2'
  },
  templateType: {
    type: String,
    enum: ["villa", "resort", "hotel", "hostel", "pg", "homestay", "tent"],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
