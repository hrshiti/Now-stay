import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SubscriptionPlan from './models/SubscriptionPlan.js';

dotenv.config();

const updateResortPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');

    // Update Resort (Standard) plans
    const standardResult = await SubscriptionPlan.updateMany(
      { propertyTemplate: 'resort', name: { $regex: /Standard/i } },
      { 
        $set: { 
          starRatings: [1, 2, 3],
          hotelCategories: ['Small Scale', 'Lodge', 'Budget']
        } 
      }
    );
    console.log(`Updated ${standardResult.modifiedCount} Standard Resort plans.`);

    // Update Resort (Luxury) plans
    const luxuryResult = await SubscriptionPlan.updateMany(
      { propertyTemplate: 'resort', name: { $regex: /Luxury/i } },
      { 
        $set: { 
          starRatings: [4, 5, 6, 7, 8],
          hotelCategories: ['Premium', 'Luxury']
        } 
      }
    );
    console.log(`Updated ${luxuryResult.modifiedCount} Luxury Resort plans.`);

    console.log('Resort plans updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating plans:', error);
    process.exit(1);
  }
};

updateResortPlans();
