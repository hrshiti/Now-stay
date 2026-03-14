import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Property from './models/Property.js';
import RoomType from './models/RoomType.js';
import Partner from './models/Partner.js';

dotenv.config();

const uri = process.env.MONGODB_URL;

const pick = (arr, n) => arr.slice(0, n);

const imagesPool = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
  'https://images.unsplash.com/photo-1505692794403-34d4982a83b1?q=80&w=1200',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200'
];

const amenitiesPool = [
  'Wi-Fi','AC','TV','Parking','Pool','Kitchen','Geyser','Power Backup','Breakfast','Laundry'
];

const sampleProps = (partnerId) => ([
  {
    property: {
      propertyName: 'NowStay Budget Hotel',
      propertyType: 'hotel',
      partnerId,
      coverImage: imagesPool[0],
      propertyImages: pick(imagesPool, 3),
      description: 'Comfortable budget hotel with essential amenities.',
      shortDescription: 'Budget friendly stay',
      address: { country: 'India', state: 'MP', city: 'Bhopal', area: 'MP Nagar', fullAddress: 'MP Nagar, Bhopal', pincode: '462011' },
      location: { type: 'Point', coordinates: [77.4126, 23.2599] },
      amenities: pick(amenitiesPool, 6),
      hotelCategory: 'Budget',
      status: 'approved',
      isLive: true,
      avgRating: 4.2
    },
    room: {
      name: 'Deluxe Room',
      inventoryType: 'room',
      roomCategory: 'private',
      maxAdults: 2,
      maxChildren: 1,
      bedsPerRoom: 1,
      totalInventory: 10,
      pricePerNight: 1499,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 5),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay Luxury Villa',
      propertyType: 'villa',
      partnerId,
      coverImage: imagesPool[1],
      propertyImages: pick(imagesPool, 4),
      description: 'Private villa ideal for families and groups.',
      shortDescription: 'Entire villa',
      address: { country: 'India', state: 'MP', city: 'Indore', area: 'Vijay Nagar', fullAddress: 'Vijay Nagar, Indore', pincode: '452010' },
      location: { type: 'Point', coordinates: [75.8577, 22.7196] },
      amenities: pick(amenitiesPool, 7),
      status: 'approved',
      isLive: true,
      avgRating: 4.5
    },
    room: {
      name: 'Entire Villa',
      inventoryType: 'entire',
      roomCategory: 'entire',
      maxAdults: 8,
      maxChildren: 2,
      totalInventory: 1,
      pricePerNight: 8999,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 7),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay Nature Resort',
      propertyType: 'resort',
      partnerId,
      coverImage: imagesPool[2],
      propertyImages: pick(imagesPool, 4),
      description: 'Relaxing resort with pool and activities.',
      shortDescription: 'Resort stay',
      resortType: 'jungle',
      address: { country: 'India', state: 'MP', city: 'Pachmarhi', area: 'Satpura', fullAddress: 'Satpura, Pachmarhi', pincode: '461881' },
      location: { type: 'Point', coordinates: [78.434, 22.467] },
      amenities: pick(amenitiesPool, 8),
      status: 'approved',
      isLive: true,
      avgRating: 4.3
    },
    room: {
      name: 'Premium Cottage',
      inventoryType: 'room',
      roomCategory: 'private',
      maxAdults: 3,
      maxChildren: 1,
      totalInventory: 6,
      pricePerNight: 3499,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 6),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay Cozy Homestay',
      propertyType: 'homestay',
      partnerId,
      coverImage: imagesPool[3],
      propertyImages: pick(imagesPool, 3),
      description: 'Warm homestay experience with local flavor.',
      shortDescription: 'Comfortable rooms',
      hostLivesOnProperty: true,
      address: { country: 'India', state: 'MP', city: 'Ujjain', area: 'Freeganj', fullAddress: 'Freeganj, Ujjain', pincode: '456001' },
      location: { type: 'Point', coordinates: [75.7849, 23.1793] },
      amenities: pick(amenitiesPool, 6),
      status: 'approved',
      isLive: true,
      avgRating: 4.1
    },
    room: {
      name: 'Family Room',
      inventoryType: 'room',
      roomCategory: 'private',
      maxAdults: 4,
      maxChildren: 1,
      totalInventory: 2,
      pricePerNight: 1999,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 5),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay Backpackers Hostel',
      propertyType: 'hostel',
      partnerId,
      coverImage: imagesPool[4],
      propertyImages: pick(imagesPool, 3),
      description: 'Clean and social hostel for backpackers.',
      shortDescription: 'Dorm beds',
      hostelType: 'mixed',
      address: { country: 'India', state: 'MP', city: 'Gwalior', area: 'City Center', fullAddress: 'City Center, Gwalior', pincode: '474001' },
      location: { type: 'Point', coordinates: [78.1828, 26.2183] },
      amenities: pick(amenitiesPool, 5),
      status: 'approved',
      isLive: true,
      avgRating: 4.0
    },
    room: {
      name: '6-Bed Mixed Dorm',
      inventoryType: 'bed',
      roomCategory: 'shared',
      maxAdults: 1,
      maxChildren: 0,
      bedsPerRoom: 6,
      totalInventory: 12,
      pricePerNight: 399,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 4),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay City PG',
      propertyType: 'pg',
      partnerId,
      coverImage: imagesPool[0],
      propertyImages: pick(imagesPool, 3),
      description: 'Affordable PG accommodation with basic facilities.',
      shortDescription: 'PG beds',
      pgType: 'unisex',
      address: { country: 'India', state: 'MP', city: 'Bhopal', area: 'Arera Colony', fullAddress: 'Arera Colony, Bhopal', pincode: '462016' },
      location: { type: 'Point', coordinates: [77.4126, 23.2099] },
      amenities: pick(amenitiesPool, 5),
      status: 'approved',
      isLive: true,
      avgRating: 3.9
    },
    room: {
      name: 'Shared Bed',
      inventoryType: 'bed',
      roomCategory: 'shared',
      maxAdults: 1,
      maxChildren: 0,
      bedsPerRoom: 4,
      totalInventory: 20,
      pricePerNight: 299,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 4),
      isActive: true
    }
  },
  {
    property: {
      propertyName: 'NowStay Desert Tents',
      propertyType: 'tent',
      partnerId,
      coverImage: imagesPool[2],
      propertyImages: pick(imagesPool, 3),
      description: 'Desert camping with cozy tents.',
      shortDescription: 'Glamping tents',
      structureDetails: { tentType: 'Dome Tent', bathroomType: 'Shared Complex', electricity: true },
      address: { country: 'India', state: 'RJ', city: 'Jaisalmer', area: 'Sam Sand Dunes', fullAddress: 'Sam, Jaisalmer', pincode: '345001' },
      location: { type: 'Point', coordinates: [70.9029, 26.9157] },
      amenities: pick(amenitiesPool, 5),
      status: 'approved',
      isLive: true,
      avgRating: 4.4
    },
    room: {
      name: 'Dome Tent',
      inventoryType: 'tent',
      roomCategory: 'Dome Tent',
      bathroomType: 'Shared Complex',
      maxAdults: 2,
      maxChildren: 1,
      totalInventory: 15,
      pricePerNight: 1299,
      images: pick(imagesPool, 3),
      amenities: pick(amenitiesPool, 4),
      isActive: true
    }
  }
]);

async function ensurePartner() {
  let partner = await Partner.findOne();
  if (partner) return partner;
  const passwordHash = await bcrypt.hash('Demo@1234', 10);
  partner = new Partner({
    name: 'Demo Partner',
    email: 'partner@example.com',
    phone: '9990000001',
    password: passwordHash,
    role: 'partner',
    isPartner: true,
    isVerified: true,
    partnerApprovalStatus: 'approved'
  });
  await partner.save();
  return partner;
}

async function run() {
  if (!uri) {
    console.error('MONGODB_URL missing');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const partner = await ensurePartner();
  const defs = sampleProps(partner._id);
  for (const def of defs) {
    const existing = await Property.findOne({ propertyName: def.property.propertyName, propertyType: def.property.propertyType });
    let prop;
    if (existing) {
      Object.assign(existing, def.property);
      existing.status = 'approved';
      existing.isLive = true;
      prop = await existing.save();
    } else {
      prop = await Property.create(def.property);
    }
    let rt = await RoomType.findOne({ propertyId: prop._id, name: def.room.name });
    if (rt) {
      Object.assign(rt, { ...def.room, propertyId: prop._id });
      await rt.save();
    } else {
      await RoomType.create({ ...def.room, propertyId: prop._id });
    }
  }
  console.log('Sample properties seed completed');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
