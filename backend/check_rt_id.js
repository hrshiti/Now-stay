
import mongoose from 'mongoose';
const roomTypeSchema = new mongoose.Schema({ propertyId: mongoose.Schema.Types.ObjectId, isActive: Boolean });
const RoomType = mongoose.model('RoomType', roomTypeSchema);

async function checkDetails() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('69b51e64c7a6a54b1d7e8a65');
  const roomTypes = await RoomType.find({ propertyId, isActive: true });
  
  console.log(`RoomTypes returned for details:`);
  roomTypes.forEach(rt => {
    console.log(`- ID: ${rt._id}`);
  });
  
  await mongoose.disconnect();
}
checkDetails();
