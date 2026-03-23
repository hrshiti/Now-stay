
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
  
  for (let i = 0; i < 30; i++) {
    const start = new Date();
    start.setDate(start.getDate() + i);
    start.setHours(0,0,0,0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    const entries = await AvailabilityLedger.find({
      propertyId: propertyId,
      startDate: { $lt: end },
      endDate: { $gt: start }
    });
    
    if (entries.length > 0) {
        console.log(`[DATE: ${start.toISOString().split('T')[0]}] Blocked by:`);
        entries.forEach(e => {
            console.log(`  - Source: ${e.source}, Units: ${e.units}, RoomType: ${e.roomTypeId}, Range: ${e.startDate.toISOString().split('T')[0]} to ${e.endDate.toISOString().split('T')[0]}`);
        });
    } else {
        console.log(`[DATE: ${start.toISOString().split('T')[0]}] AVAILABLE`);
    }
  }
  
  await mongoose.disconnect();
}
simulate();
