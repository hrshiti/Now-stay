import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InfoPage from './models/InfoPage.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGODB_URL;

if (!uri) {
  console.error('MONGODB_URL is not set');
  process.exit(1);
}

const readContent = async (filename) => {
  try {
    const filePath = path.join(__dirname, 'content', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.warn(`Could not read file ${filename}, using default content. Error: ${error.message}`);
    return null;
  }
};

const run = async () => {
  try {
    await mongoose.connect(uri);

    const privacyContent = await readContent('PrivacyPolicy.txt');
    const termsContent = await readContent('TermsAndConditions.txt');
    const cancellationContent = await readContent('CancellationPolicy.txt');

    const docs = [
      {
        audience: 'user',
        slug: 'terms',
        title: 'Terms & Conditions',
        content: termsContent || 'By using NowStay, you agree to follow our booking, cancellation and usage rules. Bookings depend on availability, and each property may have its own check-in, ID and house rules that must be respected.'
      },
      {
        audience: 'user',
        slug: 'privacy',
        title: 'Privacy Policy',
        content: privacyContent || 'We collect basic profile data and booking history to run the app, improve recommendations and communicate about your trips. Your data is stored securely and is not sold to third parties.'
      },
      {
        audience: 'user',
        slug: 'cancellation',
        title: 'Cancellation & Refund',
        content: cancellationContent || 'Free cancellation up to 24 hours before check-in. Late cancellations are non-refundable. Refunds are processed within 5-7 business days.'
      },
      {
        audience: 'user',
        slug: 'about',
        title: 'About NowStay',
        content: 'NowStay is a mobile-first platform to discover, compare and book stays across hotels, PGs, homestays and villas. Our goal is to make city stays simple and transparent for young travellers and working professionals.'
      },
      {
        audience: 'user',
        slug: 'contact',
        title: 'Contact Us',
        content: 'For support related to bookings, payments or account access, you can write to Nowstayindia@gmail.com or call 9970907005.'
      },
      {
        audience: 'partner',
        slug: 'terms',
        title: 'Partner Agreement',
        content: 'By listing your property on NowStay, you agree to keep availability, pricing and guest details accurate, honour confirmed bookings and follow our payout and commission rules.'
      },
      {
        audience: 'partner',
        slug: 'privacy',
        title: 'Partner Data Policy',
        content: 'We store your property, booking and payout information to run reports, process payments and help you manage performance. Access to this data is restricted to authorised systems and team members.'
      },
      {
        audience: 'partner',
        slug: 'about',
        title: 'About NowStay Partner',
        content: 'NowStay Partner is a dashboard for hotels, PGs and homestays to manage listings, track bookings and view payouts in a mobile-first way.'
      },
      {
        audience: 'partner',
        slug: 'contact',
        title: 'Contact NowStay Team',
        content: 'For questions about onboarding, payouts or property performance, you can reach our partner support team at Nowstayindia@gmail.com.'
      }
    ];

    for (const doc of docs) {
      await InfoPage.findOneAndUpdate(
        { audience: doc.audience, slug: doc.slug },
        doc,
        { upsert: true, new: true }
      );
    }

    console.log('InfoPage seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('InfoPage seed failed', error);
    process.exit(1);
  }
};

run();
