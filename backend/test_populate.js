import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Property from './models/Property.js';
import Partner from './models/Partner.js';

dotenv.config();
const MONGO_URI = process.env.MONGODB_URL;

mongoose.connect(MONGO_URI).then(async () => {
    // Find a booking that has the property "ERWERW"
    const prop = await Property.findOne({ propertyName: { $regex: /erwerw/i } });
    if (!prop) {
        console.log("Property not found");
        process.exit(0);
    }
    
    const booking = await Booking.findOne({ propertyId: prop._id })
      .populate({ 
        path: 'propertyId', 
        populate: { path: 'partnerId', select: 'phone email name' } 
      });

    if (!booking) {
        console.log("No booking found for this property");
    } else {
        console.log("=== Populated Property in Booking ===");
        const p = booking.propertyId;
        console.log("propertyName:", p.propertyName);
        console.log("ownerSignature:", p.ownerSignature);
        console.log("invoiceTerms:", p.invoiceTerms);
        console.log("gstNumber:", p.gstNumber);
    }
    
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
