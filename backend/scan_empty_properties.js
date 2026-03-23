
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String });
const Property = mongoose.model('Property', propertySchema);

const roomTypeSchema = new mongoose.Schema({ propertyId: mongoose.Schema.Types.ObjectId, isActive: Boolean });
const RoomType = mongoose.model('RoomType', roomTypeSchema);

async function scan() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const properties = await Property.find();
  for (const p of properties) {
    const rts = await RoomType.countDocuments({ propertyId: p._id, isActive: true });
    if (rts === 0) {
      console.log(`- Property: ${p.propertyName} (ID: ${p._id}) HAS NO ACTIVE ROOM TYPES!`);
    }
  }
  
  await mongoose.disconnect();
}
scan();
