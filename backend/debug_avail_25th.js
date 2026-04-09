
import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  name: String,
  totalInventory: Number,
  isActive: Boolean,
  inventoryType: String,
  pricePerNight: Number
});
const RoomType = mongoose.model('RoomType', roomTypeSchema);

const propertySchema = new mongoose.Schema({
  propertyName: String,
  status: String,
  isLive: Boolean
});
const Property = mongoose.model('Property', propertySchema);

const availabilityLedgerSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomTypeId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  units: Number,
  source: String
});
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema);

async function debugAvailability() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const checkIn = "2026-03-25";
  const checkOut = "2026-03-26";
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  console.log(`Checking Availability for ${checkIn} to ${checkOut}`);
  
  const prop = await Property.findById(propertyId);
  console.log(`Property: ${prop.propertyName}, Status: ${prop.status}, Live: ${prop.isLive}`);
  
  const roomTypes = await RoomType.find({ propertyId });
  console.log(`Found ${roomTypes.length} RoomTypes total.`);
  
  for (const rt of roomTypes) {
    console.log(`- RoomType: ${rt.name}, ID: ${rt._id}, Active: ${rt.isActive}, Inventory: ${rt.totalInventory}`);
    
    if (rt.isActive) {
        const ledgerEntries = await AvailabilityLedger.find({
            propertyId: propertyId,
            roomTypeId: rt._id,
            startDate: { $lt: end },
            endDate: { $gt: start }
        });
        
        const blocked = ledgerEntries.reduce((acc, curr) => acc + curr.units, 0);
        console.log(`  Blocked units in ledger: ${blocked}`);
        ledgerEntries.forEach(e => {
            console.log(`    * From ${e.startDate.toISOString()} to ${e.endDate.toISOString()}, Units: ${e.units}, Source: ${e.source}`);
        });
        
        const available = rt.totalInventory - blocked;
        console.log(`  FINAL CALCULATED AVAILABILITY: ${available}`);
    }
  }
  
  await mongoose.disconnect();
}
debugAvailability();
