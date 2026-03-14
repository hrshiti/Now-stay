import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Property from '../models/Property.js';
import RoomType from '../models/RoomType.js';
import Partner from '../models/Partner.js';

const imagesPool = [
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200',
  'https://images.unsplash.com/photo-1505692794403-34d4982a83b1?q=80&w=1200',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200'
];

const amenitiesPool = [
  'Wi-Fi', 'AC', 'TV', 'Parking', 'Pool', 'Kitchen', 'Geyser', 'Power Backup', 'Breakfast', 'Laundry'
];

const jitter = (val, km) => {
  // Roughly 1 degree lat ~ 111km, 1 degree lng ~ 111km * cos(lat)
  const deg = km / 111;
  return val + (Math.random() * 2 - 1) * deg;
};

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

export const seedNearbyProperties = async (req, res) => {
  try {
    if (process.env.ALLOW_DEV_SEED !== 'true') {
      return res.status(403).json({ message: 'Dev seed is disabled' });
    }
    const { lat, lng } = req.body || {};
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: 'Valid lat and lng are required' });
    }

    const partner = await ensurePartner();
    const baseAddr = {
      country: 'India',
      state: '',
      city: 'Nearby City',
      area: 'Local Area',
      fullAddress: 'Nearby',
      pincode: ''
    };

    const defs = [
      { name: 'Budget Hotel', type: 'hotel', inv: { inventoryType: 'room', roomCategory: 'private', maxAdults: 2, maxChildren: 1, bedsPerRoom: 1, totalInventory: 8, pricePerNight: 1299 } },
      { name: 'Luxury Villa', type: 'villa', inv: { inventoryType: 'entire', roomCategory: 'entire', maxAdults: 6, maxChildren: 2, totalInventory: 1, pricePerNight: 7999 } },
      { name: 'Nature Resort', type: 'resort', inv: { inventoryType: 'room', roomCategory: 'private', maxAdults: 3, maxChildren: 1, totalInventory: 5, pricePerNight: 3299 } },
      { name: 'Cozy Homestay', type: 'homestay', inv: { inventoryType: 'room', roomCategory: 'private', maxAdults: 4, maxChildren: 1, totalInventory: 2, pricePerNight: 1899 } },
      { name: 'Backpackers Hostel', type: 'hostel', inv: { inventoryType: 'bed', roomCategory: 'shared', maxAdults: 1, maxChildren: 0, bedsPerRoom: 6, totalInventory: 12, pricePerNight: 349 } },
      { name: 'City PG', type: 'pg', inv: { inventoryType: 'bed', roomCategory: 'shared', maxAdults: 1, maxChildren: 0, bedsPerRoom: 4, totalInventory: 16, pricePerNight: 249 } },
      { name: 'Desert Tents', type: 'tent', inv: { inventoryType: 'tent', roomCategory: 'Dome Tent', bathroomType: 'Shared Complex', maxAdults: 2, maxChildren: 1, totalInventory: 10, pricePerNight: 1199 } },
    ];

    const created = [];
    for (let i = 0; i < defs.length; i++) {
      const d = defs[i];
      const jitterKm = Math.max(0.5, (i % 3) + 0.5); // distribute within ~0.5-2.5km
      const jLat = jitter(latitude, jitterKm);
      const jLng = jitter(longitude, jitterKm / Math.cos((latitude * Math.PI) / 180));
      const propertyName = `NowStay ${d.name} (${latitude.toFixed(2)},${longitude.toFixed(2)})`;

      let prop = await Property.findOne({ propertyName, propertyType: d.type });
      if (!prop) {
        prop = new Property({
          propertyName,
          propertyType: d.type,
          partnerId: partner._id,
          coverImage: imagesPool[i % imagesPool.length],
          propertyImages: imagesPool.slice(0, 3),
          description: `${d.name} seeded nearby demo property.`,
          shortDescription: d.name,
          address: baseAddr,
          location: { type: 'Point', coordinates: [jLng, jLat] },
          amenities: amenitiesPool.slice(0, 6),
          status: 'approved',
          isLive: true,
          avgRating: 4.0
        });
        if (d.type === 'hostel') prop.hostelType = 'mixed';
        if (d.type === 'pg') prop.pgType = 'unisex';
        if (d.type === 'resort') prop.resortType = 'jungle';
        if (d.type === 'hotel') prop.hotelCategory = 'Budget';
        await prop.save();
      } else {
        prop.location = { type: 'Point', coordinates: [jLng, jLat] };
        prop.status = 'approved';
        prop.isLive = true;
        await prop.save();
      }

      let rt = await RoomType.findOne({ propertyId: prop._id, name: d.name });
      const rtPayload = {
        name: d.name,
        ...d.inv,
        images: imagesPool.slice(0, 3),
        amenities: amenitiesPool.slice(0, 5),
        isActive: true,
        propertyId: prop._id
      };
      if (rt) {
        Object.assign(rt, rtPayload);
        await rt.save();
      } else {
        rt = await RoomType.create(rtPayload);
      }
      created.push({ propertyId: prop._id, name: prop.propertyName });
    }

    res.json({ success: true, created: created.length });
  } catch (e) {
    console.error('Seed Nearby Error:', e);
    res.status(500).json({ message: e.message });
  }
};
