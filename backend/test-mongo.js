import mongoose from "mongoose";
import "dotenv/config";

try {
  await mongoose.connect(process.env.MONGODB_URL);
  console.log("Connected");
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
