
import mongoose from 'mongoose';
const roomTypeSchema = new mongoose.Schema({}, { strict: false });
const RoomType = mongoose.model('RoomType', roomTypeSchema, 'roomtypes');

async function dumpRoomTypes() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const rts = await RoomType.find({ propertyId });
  
  console.log(`Found ${rts.length} room types for SS Villa:`);
  console.log(JSON.stringify(rts, null, 2));
  
  await mongoose.disconnect();
}
dumpRoomTypes();
