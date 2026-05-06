import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URL;

mongoose.connect(MONGO_URI).then(async () => {
    const Property = mongoose.model('Property', new mongoose.Schema({}, { strict: false }));
    
    // Find by name - change to your property name
    const props = await Property.find({
        propertyName: { $regex: /erwerw/i }
    }).select('propertyName ownerSignature invoiceTerms gstNumber propertyEmail contactNumber');
    
    if (props.length === 0) {
        console.log('❌ No property found with that name');
    } else {
        props.forEach(p => {
            console.log('\n=== Property:', p.propertyName, '===');
            console.log('GST Number:      ', p.gstNumber || '❌ MISSING');
            console.log('Property Email:  ', p.propertyEmail || '❌ MISSING');
            console.log('Owner Signature: ', p.ownerSignature || '❌ MISSING');
            console.log('Invoice Terms:   ', p.invoiceTerms || '❌ MISSING');
            console.log('Contact Number:  ', p.contactNumber || '❌ MISSING');
        });
    }
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(e => {
    console.error('DB Error:', e.message);
    process.exit(1);
});
