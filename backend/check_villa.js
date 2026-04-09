
import mongoose from 'mongoose';
import 'dotenv/config';

const propertySchema = new mongoose.Schema({ propertyName: String, isLive: Boolean, status: String });
const Property = mongoose.model('Property', propertySchema);

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

async function checkVilla() {
  try {
    const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
    await mongoose.connect(mongoUrl);

    const villa = await Property.findOne({ propertyName: /S S Villa/i });
    if (!villa) {
      console.log('Property NOT found');
      return;
    }
    console.log('--- PROPERTY ---');
    console.log('ID:', villa._id);
    console.log('Name:', villa.propertyName);
    console.log('Status:', villa.status);
    console.log('Is Live:', villa.isLive);

    const rooms = await RoomType.find({ propertyId: villa._id });
    console.log('--- ROOM TYPES ---');
    rooms.forEach(r => {
      console.log(`- ${r.name} (ID: ${r._id}): Total Inventory: ${r.totalInventory}, Active: ${r.isActive}, Type: ${r.inventoryType}`);
    });

    const ledger = await AvailabilityLedger.find({ propertyId: villa._id });
    console.log('--- LEDGER ENTRIES (Total: ' + ledger.length + ') ---');
    ledger.forEach(l => {
        console.log(`- From ${l.startDate.toISOString().split('T')[0]} to ${l.endDate.toISOString().split('T')[0]}: ${l.units} units (${l.source})`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkVilla();
