
import mongoose from 'mongoose';

const availabilityLedgerSchema = new mongoose.Schema({
  propertyId: mongoose.Schema.Types.ObjectId,
  roomTypeId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
  units: Number,
  source: String,
  referenceId: mongoose.Schema.Types.ObjectId,
  notes: String,
  createdBy: String,
  createdAt: Date
});
const AvailabilityLedger = mongoose.model('AvailabilityLedger', availabilityLedgerSchema);

const bookingSchema = new mongoose.Schema({
  bookingId: String,
  guests: Object,
  bookingStatus: String,
  totalAmount: Number
});
const Booking = mongoose.model('Booking', bookingSchema);

async function fullAudit() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const ledger = await AvailabilityLedger.find({ propertyId }).sort({ startDate: 1 });
  
  console.log('--- SS VILLA FULL INVENTORY AUDIT ---');
  console.log(`Total Blocks/Bookings found: ${ledger.length}`);
  
  for (const entry of ledger) {
    let detail = '';
    if (entry.source === 'platform' && entry.referenceId) {
        const booking = await Booking.findById(entry.referenceId);
        if (booking) {
            detail = `[Booking ID: ${booking.bookingId}, Status: ${booking.bookingStatus}, Guests: ${JSON.stringify(booking.guests)}]`;
        }
    } else if (entry.source === 'walk_in') {
        detail = `[Walk-in Entry by Partner]`;
    } else if (entry.source === 'manual_block') {
        detail = `[Manual Block by Partner, Notes: ${entry.notes || 'None'}]`;
    }

    console.log(`- Date Range: ${entry.startDate.toISOString().split('T')[0]} to ${entry.endDate.toISOString().split('T')[0]}`);
    console.log(`  Source: ${entry.source}`);
    console.log(`  Units Blocked: ${entry.units}`);
    console.log(`  Created At: ${entry.createdAt.toISOString()}`);
    console.log(`  Details: ${detail}`);
    console.log('-----------------------------------');
  }
  
  await mongoose.disconnect();
}
fullAudit();
