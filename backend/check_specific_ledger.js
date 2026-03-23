
import mongoose from 'mongoose';

const availabilityLedgerSchema = new mongoose.Schema({}, { strict: false });
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema, 'availabilityledgers');

async function checkSpecificDatesLedger() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('697ccad640037001c1eb2e58');
  const start = new Date("2026-03-26");
  const end = new Date("2026-03-27");
  
  console.log(`--- LEDGER ENTRIES OVERLAPPING 2026-03-26 TO 2026-03-27 ---`);
  
  const entries = await AvailabilityLedger.find({
    propertyId,
    startDate: { $lt: end },
    endDate: { $gt: start }
  });
  
  console.log(`Found ${entries.length} overlapping entries.`);
  
  entries.forEach((e, i) => {
    console.log(`${i+1}. RT=${e.roomTypeId}, Units=${e.units}, From=${e.startDate.toISOString()}, To=${e.endDate.toISOString()}, Source=${e.source}`);
  });
  
  await mongoose.disconnect();
}

checkSpecificDatesLedger().catch(console.error);
