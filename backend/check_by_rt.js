
import mongoose from 'mongoose';
const availabilityLedgerSchema = new mongoose.Schema({}, { strict: false });
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema, 'availabilityledgers');

async function checkByRT() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const roomTypeId = new mongoose.Types.ObjectId('69b51e65c7a6a54b1d7e8a68');
  const entries = await AvailabilityLedger.find({ roomTypeId });
  
  console.log(`Found ${entries.length} ledger entries for RoomType 69b51e65c7a6a54b1d7e8a68:`);
  entries.forEach(e => {
    console.log(`- From ${e.startDate.toISOString()} to ${e.endDate.toISOString()}, Property: ${e.propertyId}, Units: ${e.units}, Source: ${e.source}`);
  });
  
  await mongoose.disconnect();
}
checkByRT();
