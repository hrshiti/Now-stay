import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Travel Guides', 'Stay Tips', 'Smart Booking'],
    default: 'Travel Guides'
  },
  readTime: {
    type: String,
    required: true,
    default: '5 min read'
  },
  badge: {
    type: String,
    required: true,
    enum: ['TRENDING', "EDITOR'S PICK", 'SAVE MORE', 'NEW'],
    default: 'NEW'
  },
  image: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: false // Optional for now, in case we want a full blog view later
  },
  date: {
    type: String,
    default: () => {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const d = new Date();
      return `${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
