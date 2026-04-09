
import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({ propertyName: String, propertyType: String }, { strict: false });
const Property = mongoose.model('Property', propertySchema, 'properties');

async function checkPropertyType() {
  const mongoUrl = "mongodb+srv://rukkooin:rukkooin@cluster0.6mzfrnp.mongodb.net/?appName=Cluster0";
  await mongoose.connect(mongoUrl);
  
  const propertyId = new mongoose.Types.ObjectId('697ccad640037001c1eb2e58');
  const prop = await Property.findById(propertyId);
  
  if (prop) {
    console.log(`Property: ${prop.propertyName}`);
    console.log(`Property Type: ${prop.propertyType}`);
  } else {
    console.log("Property not found.");
  }
  
  await mongoose.disconnect();
}

checkPropertyType().catch(console.error);
