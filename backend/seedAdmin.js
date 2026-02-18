import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Admin from './models/Admin.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URL;
        if (!mongoUri) {
            throw new Error('MONGODB_URL is missing in .env file');
        }

        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const adminEmail = 'Nowstayindia@gmail.com';
        const adminPassword = 'SumeeT@2020';

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        if (existingAdmin) {
            console.log('Admin user already exists. Updating password...');
            existingAdmin.password = hashedPassword;
            existingAdmin.name = 'Super Admin';
            existingAdmin.role = 'superadmin';
            existingAdmin.isActive = true;
            await existingAdmin.save();
            console.log('Admin user updated successfully');
        } else {
            console.log('Creating new admin user...');
            const newAdmin = new Admin({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'superadmin',
                isActive: true,
                permissions: ['read', 'write', 'update', 'delete']
            });
            await newAdmin.save();
            console.log('Admin user seeded successfully');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
