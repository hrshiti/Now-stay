
import mongoose from 'mongoose';
const propertySchema = new mongoose.Schema({ propertyName: String });
const Property = mongoose.model('Property', propertySchema);

async function checkNames() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  // Search for anything containing "Villa"
  const villas = await Property.find({ propertyName: /Villa/i });
  console.log(`Found ${villas.length} properties with "Villa" in name:`);
  villas.forEach(v => {
    console.log(`- "${v.propertyName}" (ID: ${v._id})`);
  });
  
  await mongoose.disconnect();
}
checkNames();
