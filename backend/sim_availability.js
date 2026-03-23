
import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  name: String,
  totalInventory: Number,
  isActive: Boolean,
  inventoryType: String
});
const RoomType = mongoose.model('RoomType', roomTypeSchema);

const availabilityLedgerSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomTypeId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  units: Number,
  source: String
});
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema);

async function simulate() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const roomTypes = await RoomType.find({ propertyId, isActive: true });
  
  console.log(`Checking availability for ${roomTypes.length} room types...`);
  
  for (let i = 0; i < 30; i++) {
    const start = new Date();
    start.setDate(start.getDate() + i);
    start.setHours(0,0,0,0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    const ledgerEntries = await AvailabilityLedger.aggregate([
      {
        $match: {
          propertyId: propertyId,
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
    
    const blockedMap = new Map();
    ledgerEntries.forEach(e => {
      blockedMap.set(String(e._id), e.blockedUnits);
    });
    
    const availableTotal = roomTypes.reduce((acc, rt) => {
        const blocked = blockedMap.get(String(rt._id)) || 0;
        const avail = Math.max(0, (rt.totalInventory || 0) - blocked);
        return acc + avail;
    }, 0);
    
    if (availableTotal === 0) {
        console.log(`[SOLD OUT] ${start.toISOString().split('T')[0]}`);
    } else {
        console.log(`[AVAILABLE] ${start.toISOString().split('T')[0]} - Units: ${availableTotal}`);
    }
  }
  
  await mongoose.disconnect();
}
simulate();
