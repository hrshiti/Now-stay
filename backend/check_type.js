
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String, propertyType: String });
const Property = mongoose.model('Property', propertySchema);

async function checkType() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  const p = await Property.findOne({ propertyName: /S S Villa/i });
  console.log(`Property: ${p.propertyName}, Type: "${p.propertyType}"`);
  await mongoose.disconnect();
}
checkType();
