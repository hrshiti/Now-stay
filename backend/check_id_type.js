
import mongoose from 'mongoose';
const roomTypeSchema = new mongoose.Schema({});
const RoomType = mongoose.model('RoomType', roomTypeSchema, 'roomtypes');

async function checkIdType() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const rt = await RoomType.findOne({ propertyId });
  
  console.log(`RoomType ID: "${rt._id}"`);
  console.log(`Type of ID: ${typeof rt._id}`);
  console.log(`Is instance of ObjectId: ${rt._id instanceof mongoose.Types.ObjectId}`);
  console.log(`Hex String: ${rt._id.toHexString()}`);
  
  await mongoose.disconnect();
}
checkIdType();
