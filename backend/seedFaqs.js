import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Faq from './models/Faq.js';

dotenv.config();

const uri = process.env.MONGODB_URL;

if (!uri) {
  console.error('MONGODB_URL is not set');
  process.exit(1);
}

const faqs = [
  {
    question: 'How do I book a stay?',
    answer: 'Simply browse our listings, select your dates, and click "Book Now". You will be guided through a secure payment process.',
    audience: 'user',
    isActive: true,
    order: 1
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Cancellation policies vary by property. Generally, you can cancel up to 24-48 hours before check-in. Check the specific property page for details.',
    audience: 'user',
    isActive: true,
    order: 2
  },
  {
    question: 'How do I contact the property owner?',
    answer: 'Once your booking is confirmed, you will receive the owner\'s contact details in your booking confirmation email and on your dashboard.',
    audience: 'user',
    isActive: true,
    order: 3
  },
  {
    question: 'Are there any hidden charges?',
    answer: 'No, we believe in transparency. All prices shown include taxes. Any security deposit required will be clearly mentioned.',
    audience: 'user',
    isActive: true,
    order: 4
  }
];

const seedFaqs = async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for FAQ seeding...');

    for (const faq of faqs) {
      await Faq.findOneAndUpdate(
        { question: faq.question, audience: faq.audience },
        faq,
        { upsert: true, new: true }
      );
    }

    console.log('FAQ seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('FAQ seeding failed:', error);
    process.exit(1);
  }
};

seedFaqs();
