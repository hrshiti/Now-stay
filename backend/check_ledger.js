
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

async function checkLedger() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  const ledger = await AvailabilityLedger.find({ propertyId: new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65') });
  console.log('Ledger Details:');
  ledger.forEach(l => {
    console.log(`- ID: ${l._id}, RoomType: ${l.roomTypeId}, Start: ${l.startDate.toISOString()}, End: ${l.endDate.toISOString()}, Units: ${l.units}, Source: ${l.source}`);
  });
  await mongoose.disconnect();
}
checkLedger();
