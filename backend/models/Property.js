// models/Property.js
import mongoose from "mongoose";

const nearbyPlaceSchema = new mongoose.Schema({
  name: String,
  type: {
    type: String,
    // enum removed to allow flexibilty (bus_stop, restaurant, other, etc.)
  },
  distanceKm: Number
});

const propertySchema = new mongoose.Schema({

  // BASIC INFO
  propertyName: { type: String, required: true },
  contactNumber: { type: String },
  propertyType: {
    type: String,
    required: true
  },
  propertyTemplate: {
    type: String,
    enum: ["villa", "resort", "hotel", "hostel", "pg", "homestay", "tent"],
    required: true
  },

  pgType: {
    type: String,
    enum: ["boys", "girls", "unisex"]
  },
  mealsIncluded: {
    type: String,
    enum: ["Yes", "No"],
    default: "No"
  },
  foodType: {
    type: String,
    enum: ["Veg", "Non-Veg", "Both", "none"],
    default: "none"
  },
  noticePeriod: {
    type: String
  },

  hostelType: {
    type: String,
    enum: ["boys", "girls", "mixed"]
  },

  tentType: {
    type: String,
    enum: ["luxury", "standard", "dome", "safari", "bell"]
  },

  washroomType: {
    type: String,
    enum: ["attached", "shared", "external"]
  },

  viewType: {
    type: String,
    enum: ["hill", "lake", "forest", "desert", "none"]
  },

  hostLivesOnProperty: { type: Boolean, default: false },
  suitability: {
    type: String,
    enum: ["Couple Friendly", "Family Friendly", "Both", "none"],
    default: "none"
  },

  resortType: {
    type: String,
    enum: ["beach", "hill", "jungle", "desert"]
  },

  hotelCategory: {
    type: String,
    enum: ["Budget", "Premium", "Luxury"]
  },
  starRating: {
    type: Number,
    min: 1,
    max: 5
  },

  activities: [String],

  shortDescription: String,

  // OWNER
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Partner",
    required: true
  },

  // LOCATION
  address: {
    country: String,
    state: String,
    city: String,
    area: String,
    fullAddress: String,
    pincode: String
  },

  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number]
  },

  nearbyPlaces: {
    type: [nearbyPlaceSchema],
    default: []
  },

  // MEDIA
  coverImage: { type: String, required: true },
  propertyImages: [String],

  // AMENITIES (PROPERTY LEVEL)
  amenities: [String],

  // POLICIES
  checkInTime: String,
  checkOutTime: String,
  cancellationPolicy: String,
  houseRules: [String],

  // STATUS
  status: {
    type: String,
    enum: ["draft", "pending", "approved", "rejected"],
    default: "draft"
  },

  isLive: { type: Boolean, default: false },

  // RATINGS
  avgRating: { type: Number, default: 3 },
  totalReviews: { type: Number, default: 0 }

}, { timestamps: true });

propertySchema.index({ location: "2dsphere" });

export default mongoose.model("Property", propertySchema);
