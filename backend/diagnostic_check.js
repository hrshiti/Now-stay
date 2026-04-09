
import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  name: String,
  totalInventory: Number,
  isActive: Boolean,
  inventoryType: String,
  pricePerNight: Number,
  bedsPerRoom: Number
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

async function checkSpecificAvailability() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('697ccad640037001c1eb2e58');
  const roomTypeId = new mongoose.Types.ObjectId('697ccad940037001c1eb2e74');
  const checkIn = "2026-03-26";
  const checkOut = "2026-03-27";
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  console.log(`--- DIAGNOSTIC FOR ${checkIn} TO ${checkOut} ---`);
  
  const prop = await Property.findById(propertyId);
  if (!prop) {
    console.log("Property NOT FOUND!");
  } else {
    console.log(`Property: ${prop.propertyName}, Status: ${prop.status}, Live: ${prop.isLive}`);
  }
  
  const rt = await RoomType.findById(roomTypeId);
  if (!rt) {
    console.log("RoomType NOT FOUND!");
  } else {
    console.log(`RoomType: ${rt.name}, ID: ${rt._id}, Active: ${rt.isActive}, Inventory: ${rt.totalInventory}, Type: ${rt.inventoryType}`);
    
    let total = rt.totalInventory || 0;
    if (rt.inventoryType === 'bed') {
      total = total * (rt.bedsPerRoom || 1);
      console.log(`  Adjusted Total (Bed-wise): ${total}`);
    }

    const ledgerEntries = await AvailabilityLedger.find({
        propertyId: propertyId,
        roomTypeId: rt._id,
        startDate: { $lt: end },
        endDate: { $gt: start }
    });
    
    console.log(`Found ${ledgerEntries.length} ledger entries overlapping the range.`);
    const blocked = ledgerEntries.reduce((acc, curr) => acc + curr.units, 0);
    console.log(`Total blocked units: ${blocked}`);
    
    ledgerEntries.forEach((e, i) => {
        console.log(`  Entry ${i+1}: Source=${e.source}, Units=${e.units}, From=${e.startDate.toISOString()}, To=${e.endDate.toISOString()}`);
    });
    
    const available = total - blocked;
    console.log(`\nFINAL CALCULATED AVAILABILITY: ${available}`);
    if (available <= 0) {
        console.log("RESULT: SOLD OUT");
    } else {
        console.log(`RESULT: ${available} units available`);
    }
  }

  // Also check all active room types for this property to see what the API would return overall
  console.log("\n--- ALL ACTIVE ROOM TYPES FOR THIS PROPERTY ---");
  const allRTs = await RoomType.find({ propertyId, isActive: true });
  console.log(`Found ${allRTs.length} active room types.`);
  for (const art of allRTs) {
      const ledger = await AvailabilityLedger.find({
          propertyId: propertyId,
          roomTypeId: art._id,
          startDate: { $lt: end },
          endDate: { $gt: start }
      });
      const b = ledger.reduce((acc, curr) => acc + curr.units, 0);
      let t = art.totalInventory || 0;
      if (art.inventoryType === 'bed') t *= (art.bedsPerRoom || 1);
      console.log(`- ${art.name} (${art._id}): Total=${t}, Blocked=${b}, Available=${t-b}`);
  }
  
  await mongoose.disconnect();
}

checkSpecificAvailability().catch(console.error);
