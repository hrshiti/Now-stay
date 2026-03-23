
import mongoose from 'mongoose';

// Reproduce backend environment
const propertySchema = new mongoose.Schema({}, { strict: false });
const Property = mongoose.model('Property', propertySchema, 'properties');

const roomTypeSchema = new mongoose.Schema({}, { strict: false });
const RoomType = mongoose.model('RoomType', roomTypeSchema, 'roomtypes');

const availabilityLedgerSchema = new mongoose.Schema({}, { strict: false });
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema, 'availabilityledgers');

async function reproduce() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = "69b51e64c7a6a54b1d7e8a65";
  const checkIn = "2026-03-25";
  const checkOut = "2026-03-26";
  
  const parseDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };
  
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  
  const property = await Property.findById(propertyId);
  const roomTypes = await RoomType.find({ propertyId: property._id, isActive: true });
  
  console.log(`Step 1: Found ${roomTypes.length} room types.`);
  
  const ledgerEntries = await AvailabilityLedger.aggregate([
    {
      $match: {
        propertyId: property._id,
        startDate: { $lt: end },
        endDate: { $gt: start }
      }
    },
    {
      $group: {
        _id: '$roomTypeId',
        blockedUnits: { $sum: '$units' }
      }
    }
  ]);
  
  console.log(`Step 2: Ledger entries found: ${ledgerEntries.length}`);
  ledgerEntries.forEach(e => console.log(`  - RT: ${e._id}, Blocked: ${e.blockedUnits}`));
  
  const blockedMap = new Map();
  ledgerEntries.forEach(e => {
    blockedMap.set(String(e._id), e.blockedUnits);
  });
  
  const result = roomTypes.map(rt => {
    let total = Number(rt.totalInventory || 0);
    if (rt.inventoryType === 'bed') {
      total = total * Number(rt.bedsPerRoom || 1);
    }
    const blocked = blockedMap.get(String(rt._id)) || 0;
    const availableUnits = Math.max(0, total - blocked);
    return {
      roomTypeId: rt._id,
      availableUnits
    };
  }).filter(r => r.availableUnits > 0);
  
  console.log(`Step 3: Controller result (filtered):`);
  console.log(JSON.stringify(result, null, 2));
  
  await mongoose.disconnect();
}
reproduce();
