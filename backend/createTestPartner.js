import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Partner from './models/Partner.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected to MongoDB');
    
    const existingPartner = await Partner.findOne({ phone: '7777777777' });
    
    if (existingPartner) {
      console.log('Partner already exists, updating...');
      existingPartner.isVerified = true;
      existingPartner.partnerApprovalStatus = 'approved';
      await existingPartner.save();
      console.log('✅ Partner updated');
    } else {
      const partner = new Partner({
        name: 'Test Partner',
        email: 'testpartner@nowstay.com',
        phone: '7777777777',
        password: await bcrypt.hash('test123', 10),
        role: 'partner',
        isPartner: true,
        isVerified: true,
        partnerApprovalStatus: 'approved'
      });
      
      await partner.save();
      console.log('✅ Partner created with phone: 7777777777');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
