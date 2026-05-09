
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const fixIndexes = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Connected.');

    const Property = mongoose.model('Property', new mongoose.Schema({
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: [Number]
        }
    }));

    console.log('Dropping existing location indexes if any...');
    try {
        await Property.collection.dropIndex('location_2dsphere');
    } catch (e) {
        console.log('No existing location_2dsphere index found.');
    }

    console.log('Creating 2dsphere index on location...');
    await Property.collection.createIndex({ location: "2dsphere" });
    console.log('Index created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
