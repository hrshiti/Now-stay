
import mongoose from 'mongoose';

const roomTypeSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  totalInventory: Number,
  isActive: Boolean
});
const RoomType = mongoose.model('RoomType', roomTypeSchema);

const availabilityLedgerSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomTypeId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  units: Number
});
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema);

async function checkApril() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const rt = await RoomType.findOne({ propertyId, isActive: true });
  
  console.log(`Auditing April 2026 for RoomType: ${rt._id}`);
  
  for (let day = 1; day <= 30; day++) {
    const start = new Date(`2026-04-${day < 10 ? '0'+day : day}T00:00:00Z`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    const entries = await AvailabilityLedger.find({
      propertyId: propertyId,
      roomTypeId: rt._id,
      startDate: { $lt: end },
      endDate: { $gt: start }
    });
    
    const blocked = entries.reduce((acc, curr) => acc + curr.units, 0);
    if (blocked > 0) {
        console.log(`- April ${day}: SOLD OUT (${blocked} units blocked)`);
    } else {
        // console.log(`- April ${day}: Available`);
    }
  }
  
  await mongoose.disconnect();
}
checkApril();
