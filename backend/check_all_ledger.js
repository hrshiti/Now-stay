
import mongoose from 'mongoose';

const availabilityLedgerSchema = new mongoose.Schema({}, { strict: false });
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema, 'availabilityledgers');

async function checkAllLedger() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('697ccad640037001c1eb2e58');
  
  console.log(`--- ALL LEDGER ENTRIES FOR PROPERTY ${propertyId} ---`);
  
  const entries = await AvailabilityLedger.find({ propertyId });
  console.log(`Found ${entries.length} entries total.`);
  
  entries.forEach((e, i) => {
    console.log(`${i+1}. RT=${e.roomTypeId}, Units=${e.units}, From=${e.startDate.toISOString()}, To=${e.endDate.toISOString()}, Source=${e.source}`);
  });
  
  await mongoose.disconnect();
}

checkAllLedger().catch(console.error);
