import mongoose from 'mongoose';
import Partner from './models/Partner.js';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function debugUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to DB');

        const phone = '9691967116';

        const partner = await Partner.findOne({ phone });
        console.log('Partner Search Result:', partner ? {
            id: partner._id,
            name: partner.name,
            role: partner.role,
            address: partner.address
        } : 'Not found in Partner collection');

        const user = await User.findOne({ phone });
        console.log('User Search Result:', user ? {
            id: user._id,
            name: user.name,
            role: user.role,
            address: user.address
        } : 'Not found in User collection');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Debug Error:', err);
    }
}

debugUser();
