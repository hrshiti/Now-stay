
import mongoose from 'mongoose';
const availabilityLedgerSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomTypeId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  units: Number,
  source: String
});
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema);

async function checkAllLedgers() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const targetDate = new Date("2026-03-25T10:00:00Z");
  
  const entries = await AvailabilityLedger.find({
    startDate: { $lte: targetDate },
    endDate: { $gte: targetDate }
  }).populate('propertyId');
  
  console.log(`Found ${entries.length} ledger entries covering 25th March:`);
  entries.forEach(e => {
    console.log(`- Property: ${e.propertyId?.propertyName || e.propertyId}, RoomType: ${e.roomTypeId}, Units: ${e.units}, Source: ${e.source}`);
  });
  
  await mongoose.disconnect();
}
checkAllLedgers();
