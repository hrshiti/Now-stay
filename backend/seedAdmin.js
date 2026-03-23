import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/Admin.js';
import Wallet from './models/Wallet.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
      throw new Error('MONGODB_URL is not defined in .env');
    }

    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB for seeding...');

    const adminEmail = 'admin@nowstay.com';
    const adminPassword = 'adminpassword123'; // Change this after first login
    const adminPhone = '1234567890';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const newAdmin = new Admin({
      name: 'Super Admin',
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      role: 'superadmin',
      permissions: ['read', 'write', 'update', 'delete'],
      isActive: true
    });

    await newAdmin.save();
    console.log('Admin user created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    // Create Wallet for Admin
    const existingWallet = await Wallet.findOne({ partnerId: newAdmin._id, role: 'admin' });
    if (!existingWallet) {
      await Wallet.create({
        partnerId: newAdmin._id,
        role: 'admin',
        balance: 0
      });
      console.log('Admin wallet created successfully');
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
