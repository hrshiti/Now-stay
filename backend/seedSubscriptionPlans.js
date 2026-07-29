import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlan from './models/SubscriptionPlan.js';

dotenv.config();

const plansToSeed = [
  // 1. Hotel (Below 1-Star)
  {
    name: 'Hotel (Below 1-Star) - 1 Month',
    description: 'Monthly subscription plan for unrated hotels, small lodges, and guest houses.',
    price: 2499,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1],
    hotelCategories: ['Small Scale', 'Low Budget', 'Lodge'],
    resortTypes: []
  },
  {
    name: 'Hotel (Below 1-Star) - 3 Months',
    description: 'Quarterly subscription plan for unrated hotels, small lodges, and guest houses.',
    price: 5999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1],
    hotelCategories: ['Small Scale', 'Low Budget', 'Lodge'],
    resortTypes: []
  },
  {
    name: 'Hotel (Below 1-Star) - 6 Months',
    description: 'Half-yearly subscription plan for unrated hotels, small lodges, and guest houses.',
    price: 12999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1],
    hotelCategories: ['Small Scale', 'Low Budget', 'Lodge'],
    resortTypes: []
  },
  {
    name: 'Hotel (Below 1-Star) - 12 Months',
    description: 'Annual subscription plan for unrated hotels, small lodges, and guest houses.',
    price: 20999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1],
    hotelCategories: ['Small Scale', 'Low Budget', 'Lodge'],
    resortTypes: []
  },

  // 2. Hotel (Budget)
  {
    name: 'Hotel (Budget) - 1 Month',
    description: 'Monthly plan for 1-Star to 3-Star budget hotels.',
    price: 3999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1, 2, 3],
    hotelCategories: ['Budget'],
    resortTypes: []
  },
  {
    name: 'Hotel (Budget) - 3 Months',
    description: 'Quarterly plan for 1-Star to 3-Star budget hotels.',
    price: 9999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1, 2, 3],
    hotelCategories: ['Budget'],
    resortTypes: []
  },
  {
    name: 'Hotel (Budget) - 6 Months',
    description: 'Half-yearly plan for 1-Star to 3-Star budget hotels.',
    price: 19999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1, 2, 3],
    hotelCategories: ['Budget'],
    resortTypes: []
  },
  {
    name: 'Hotel (Budget) - 12 Months',
    description: 'Annual plan for 1-Star to 3-Star budget hotels.',
    price: 34999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [1, 2, 3],
    hotelCategories: ['Budget'],
    resortTypes: []
  },

  // 3. Hotel (Premium)
  {
    name: 'Hotel (Premium) - 1 Month',
    description: 'Monthly plan for 4-Star & 5-Star premium hotels.',
    price: 7999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [4, 5],
    hotelCategories: ['Premium'],
    resortTypes: []
  },
  {
    name: 'Hotel (Premium) - 3 Months',
    description: 'Quarterly plan for 4-Star & 5-Star premium hotels.',
    price: 20999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [4, 5],
    hotelCategories: ['Premium'],
    resortTypes: []
  },
  {
    name: 'Hotel (Premium) - 6 Months',
    description: 'Half-yearly plan for 4-Star & 5-Star premium hotels.',
    price: 43999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [4, 5],
    hotelCategories: ['Premium'],
    resortTypes: []
  },
  {
    name: 'Hotel (Premium) - 12 Months',
    description: 'Annual plan for 4-Star & 5-Star premium hotels.',
    price: 89999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [4, 5],
    hotelCategories: ['Premium'],
    resortTypes: []
  },

  // 4. Hotel (Luxury)
  {
    name: 'Hotel (Luxury) - 1 Month',
    description: 'Monthly plan for 6, 7, 8 Star luxury hotels & heritage palaces.',
    price: 12999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [6, 7, 8],
    hotelCategories: ['Luxury'],
    resortTypes: []
  },
  {
    name: 'Hotel (Luxury) - 3 Months',
    description: 'Quarterly plan for 6, 7, 8 Star luxury hotels & heritage palaces.',
    price: 33333,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [6, 7, 8],
    hotelCategories: ['Luxury'],
    resortTypes: []
  },
  {
    name: 'Hotel (Luxury) - 6 Months',
    description: 'Half-yearly plan for 6, 7, 8 Star luxury hotels & heritage palaces.',
    price: 51000,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [6, 7, 8],
    hotelCategories: ['Luxury'],
    resortTypes: []
  },
  {
    name: 'Hotel (Luxury) - 12 Months',
    description: 'Annual plan for 6, 7, 8 Star luxury hotels & heritage palaces.',
    price: 99999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hotel',
    starRatings: [6, 7, 8],
    hotelCategories: ['Luxury'],
    resortTypes: []
  },

  // 5. Resort (Standard)
  {
    name: 'Resort (Standard) - 1 Month',
    description: 'Monthly plan for Beach, Hill, Eco, and Jungle resorts.',
    price: 4999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['Beach', 'Hill', 'Jungle']
  },
  {
    name: 'Resort (Standard) - 3 Months',
    description: 'Quarterly plan for Beach, Hill, Eco, and Jungle resorts.',
    price: 12999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['Beach', 'Hill', 'Jungle']
  },
  {
    name: 'Resort (Standard) - 6 Months',
    description: 'Half-yearly plan for Beach, Hill, Eco, and Jungle resorts.',
    price: 24999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['Beach', 'Hill', 'Jungle']
  },
  {
    name: 'Resort (Standard) - 12 Months',
    description: 'Annual plan for Beach, Hill, Eco, and Jungle resorts.',
    price: 51999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['Beach', 'Hill', 'Jungle']
  },

  // 6. Resort (Luxury)
  {
    name: 'Resort (Luxury) - 1 Month',
    description: 'Monthly plan for 5-Star & Desert Luxury Resorts.',
    price: 4999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['5 Star Resort', 'Desert', 'Luxury']
  },
  {
    name: 'Resort (Luxury) - 3 Months',
    description: 'Quarterly plan for 5-Star & Desert Luxury Resorts.',
    price: 12999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['5 Star Resort', 'Desert', 'Luxury']
  },
  {
    name: 'Resort (Luxury) - 6 Months',
    description: 'Half-yearly plan for 5-Star & Desert Luxury Resorts.',
    price: 24999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['5 Star Resort', 'Desert', 'Luxury']
  },
  {
    name: 'Resort (Luxury) - 12 Months',
    description: 'Annual plan for 5-Star & Desert Luxury Resorts.',
    price: 51999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'resort',
    starRatings: [],
    hotelCategories: [],
    resortTypes: ['5 Star Resort', 'Desert', 'Luxury']
  },

  // 7. Villa
  {
    name: 'Villa Plan - 1 Month',
    description: 'Monthly plan for private pool villas and luxury holiday homes.',
    price: 3499,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'villa',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Villa Plan - 3 Months',
    description: 'Quarterly plan for private pool villas and luxury holiday homes.',
    price: 10499,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'villa',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Villa Plan - 6 Months',
    description: 'Half-yearly plan for private pool villas and luxury holiday homes.',
    price: 19999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'villa',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Villa Plan - 12 Months',
    description: 'Annual plan for private pool villas and luxury holiday homes.',
    price: 37999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'villa',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },

  // 8. Hostel
  {
    name: 'Hostel Plan - 1 Month',
    description: 'Monthly plan for backpacker and student hostels.',
    price: 1999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hostel',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Hostel Plan - 3 Months',
    description: 'Quarterly plan for backpacker and student hostels.',
    price: 3999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hostel',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Hostel Plan - 6 Months',
    description: 'Half-yearly plan for backpacker and student hostels.',
    price: 9999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hostel',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Hostel Plan - 12 Months',
    description: 'Annual plan for backpacker and student hostels.',
    price: 21999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'hostel',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },

  // 9. PG (Paying Guest)
  {
    name: 'PG Plan - 1 Month',
    description: 'Monthly plan for Boys, Girls, and Unisex PG accommodations.',
    price: 1499,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'pg',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'PG Plan - 3 Months',
    description: 'Quarterly plan for Boys, Girls, and Unisex PG accommodations.',
    price: 3333,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'pg',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'PG Plan - 6 Months',
    description: 'Half-yearly plan for Boys, Girls, and Unisex PG accommodations.',
    price: 7999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'pg',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'PG Plan - 12 Months',
    description: 'Annual plan for Boys, Girls, and Unisex PG accommodations.',
    price: 16999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'pg',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },

  // 10. Homestay
  {
    name: 'Homestay Plan - 1 Month',
    description: 'Monthly plan for family B&B stays and local homestays.',
    price: 1799,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'homestay',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Homestay Plan - 3 Months',
    description: 'Quarterly plan for family B&B stays and local homestays.',
    price: 3999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'homestay',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Homestay Plan - 6 Months',
    description: 'Half-yearly plan for family B&B stays and local homestays.',
    price: 8888,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'homestay',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Homestay Plan - 12 Months',
    description: 'Annual plan for family B&B stays and local homestays.',
    price: 21999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'homestay',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },

  // 11. Tent / Campsite
  {
    name: 'Tent & Campsite Plan - 1 Month',
    description: 'Monthly plan for glamping, safari, and dome campsites.',
    price: 2199,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'tent',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Tent & Campsite Plan - 3 Months',
    description: 'Quarterly plan for glamping, safari, and dome campsites.',
    price: 4999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'tent',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Tent & Campsite Plan - 6 Months',
    description: 'Half-yearly plan for glamping, safari, and dome campsites.',
    price: 11999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'tent',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Tent & Campsite Plan - 12 Months',
    description: 'Annual plan for glamping, safari, and dome campsites.',
    price: 21999,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'tent',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },

  // 12. Apartment
  {
    name: 'Apartment Plan - 1 Month',
    description: 'Monthly plan for serviced apartments and studio flats.',
    price: 2999,
    durationInMonths: 1,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'apartment',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Apartment Plan - 3 Months',
    description: 'Quarterly plan for serviced apartments and studio flats.',
    price: 8999,
    durationInMonths: 3,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'apartment',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Apartment Plan - 6 Months',
    description: 'Half-yearly plan for serviced apartments and studio flats.',
    price: 17999,
    durationInMonths: 6,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'apartment',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  },
  {
    name: 'Apartment Plan - 12 Months',
    description: 'Annual plan for serviced apartments and studio flats.',
    price: 35988,
    durationInMonths: 12,
    commissionRate: 0,
    isActive: true,
    propertyTemplate: 'apartment',
    starRatings: [],
    hotelCategories: [],
    resortTypes: []
  }
];

const seedSubscriptionPlans = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is not defined in .env');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB for seeding subscription plans...');

    // Clear existing plans and seed updated ones
    await SubscriptionPlan.deleteMany({});
    console.log('Existing subscription plans cleared.');

    const createdPlans = await SubscriptionPlan.insertMany(plansToSeed);
    console.log(`Successfully seeded ${createdPlans.length} subscription plans (1, 3, 6, and 12 months)!`);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    process.exit(1);
  }
};

seedSubscriptionPlans();
