import mongoose from 'mongoose';
import Property from '../models/Property.js';
import RoomType from '../models/RoomType.js';
import PropertyDocument from '../models/PropertyDocument.js';
import Partner from '../models/Partner.js';
import { PROPERTY_DOCUMENTS } from '../config/propertyDocumentRules.js';
import emailService from '../services/emailService.js';
import notificationService from '../services/notificationService.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

const notifySubmission = async (property) => {
  try {
    // 1. Notify Admin (Email & Push)
    const admin = await Admin.findOne({ role: { $in: ['admin', 'superadmin'] } });
    if (admin && admin.email) {
      emailService.sendAdminNewPropertyEmail(admin.email, property).catch(e => console.error('Admin Property Email Error:', e));
    }

    notificationService.sendToAdmins({
      title: 'New Property for Review 🏨',
      body: `${property.propertyName} (${property.propertyType}) has been submitted by a partner.`
    }, { type: 'new_property_submission', propertyId: property._id }).catch(e => console.error('Admin Property Push Error:', e));

    // 2. Notify Partner (Email Confirmation)
    const partner = await Partner.findById(property.partnerId);
    if (partner && partner.email) {
      emailService.sendPartnerPropertyAddedEmail(partner, property).catch(e => console.error('Partner Property Email Error:', e));
    }

  } catch (err) {
    console.warn('Could not notify about property submission:', err.message);
  }
};

export const createProperty = async (req, res) => {
  try {
    const { propertyName, contactNumber, propertyType, propertyTemplate, description, shortDescription, coverImage, propertyImages, amenities, address, location, nearbyPlaces, checkInTime, checkOutTime, cancellationPolicy, houseRules, documents, roomTypes, pgType, hostelType, hostLivesOnProperty, resortType, activities, hotelCategory, starRating, mealsIncluded, foodType, noticePeriod } = req.body;
    if (!propertyName || !propertyType || !coverImage) return res.status(400).json({ message: 'Missing required fields' });

    // Validate contact number if provided (Indian mobile: 10 digits, starts with 6-9)
    if (contactNumber && contactNumber.trim() !== '') {
      const digitsOnly = contactNumber.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return res.status(400).json({ message: 'Contact number must be exactly 10 digits' });
      }
      if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
        return res.status(400).json({ message: 'Contact number must be a valid Indian mobile number (starts with 6, 7, 8, or 9)' });
      }
      req.body.contactNumber = digitsOnly;
    }
    const lowerType = propertyType.toLowerCase();
    const requiredDocs = PROPERTY_DOCUMENTS[lowerType] || [];
    const nearbyPlacesArray = Array.isArray(nearbyPlaces) ? nearbyPlaces : [];
    const propertyImagesArray = Array.isArray(propertyImages) ? propertyImages : [];
    const docsArray = Array.isArray(documents) ? documents : [];
    const doc = new Property({
      propertyName,
      contactNumber,
      propertyType: lowerType,
      propertyTemplate: (propertyTemplate || lowerType),
      shortDescription,
      partnerId: req.user._id,
      address,
      location,
      nearbyPlaces: nearbyPlacesArray,
      amenities,
      coverImage,
      propertyImages: propertyImagesArray,
      checkInTime,
      checkOutTime,
      cancellationPolicy,
      houseRules,
      pgType: lowerType === 'pg' ? pgType : undefined,
      hostelType: lowerType === 'hostel' ? hostelType : undefined,
      hostLivesOnProperty: lowerType === 'homestay' ? hostLivesOnProperty : undefined,
      resortType: lowerType === 'resort' ? resortType : undefined,
      activities: (lowerType === 'resort' || lowerType === 'tent') ? activities : undefined,
      hotelCategory: lowerType === 'hotel' ? hotelCategory : undefined,
      starRating: lowerType === 'hotel' ? starRating : undefined,
      mealsIncluded: (lowerType === 'pg' || lowerType === 'homestay') ? mealsIncluded : undefined,
      foodType: (lowerType === 'pg' || lowerType === 'homestay') ? foodType : undefined,
      noticePeriod: lowerType === 'pg' ? noticePeriod : undefined,
      suitability: req.body.suitability || 'none'
    });
    await doc.save();

    // Inline RoomTypes if provided
    if (Array.isArray(roomTypes) && roomTypes.length > 0) {
      await RoomType.insertMany(
        roomTypes.map(rt => ({
          ...rt,
          propertyId: doc._id,
          isActive: true
        }))
      );
    }

    // Inline documents upsert on create
    if (docsArray.length) {
      await PropertyDocument.findOneAndUpdate(
        { propertyId: doc._id },
        {
          propertyType: lowerType,
          documents: docsArray.map(d => ({
            type: d.type,
            name: d.name || d.type,
            fileUrl: d.fileUrl,
            isRequired: requiredDocs.includes(d.name || d.type),
          })),
          verificationStatus: 'pending',
          adminRemark: undefined,
          verifiedAt: undefined
        },
        { new: true, upsert: true }
      );
      doc.status = 'pending';
      doc.isLive = false;
      await doc.save();
    }

    // AUTO-SUBMIT: If room types are provided, we consider it a full submission
    if (Array.isArray(roomTypes) && roomTypes.length > 0 && doc.status === 'draft') {
      doc.status = 'pending';
      await doc.save();
    }

    // NOTIFICATION: Notify Admin only if pending
    if (doc.status === 'pending') {
      notifySubmission(doc).catch(e => console.error(e));
    }

    res.status(201).json({ success: true, property: doc });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (String(property.partnerId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    // Validate contact number if provided
    if (payload.contactNumber !== undefined && payload.contactNumber !== null && String(payload.contactNumber).trim() !== '') {
      const digitsOnly = String(payload.contactNumber).replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        return res.status(400).json({ message: 'Contact number must be exactly 10 digits' });
      }
      if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
        return res.status(400).json({ message: 'Contact number must be a valid Indian mobile number (starts with 6, 7, 8, or 9)' });
      }
      payload.contactNumber = digitsOnly;
    }

    const updatableFields = [
      'propertyName', 'shortDescription', 'address', 'location', 'nearbyPlaces',
      'amenities', 'coverImage', 'propertyImages', 'checkInTime', 'checkOutTime',
      'cancellationPolicy', 'houseRules', 'pgType', 'hostLivesOnProperty', 'resortType',
      'activities', 'hotelCategory', 'starRating', 'contactNumber', 'suitability', 'isLive',
      'mealsIncluded', 'foodType', 'noticePeriod'
    ];

    updatableFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        property[field] = payload[field];
      }
    });

    await property.save();

    if (payload.documents && Array.isArray(payload.documents)) {
      const lowerType = property.propertyType.toLowerCase();
      const requiredDocs = PROPERTY_DOCUMENTS[lowerType] || [];
      await PropertyDocument.findOneAndUpdate(
        { propertyId: property._id },
        {
          propertyType: lowerType,
          documents: payload.documents.map(d => ({
            type: d.type,
            name: d.name || d.type,
            fileUrl: d.fileUrl,
            isRequired: requiredDocs.includes(d.name || d.type),
          })),
          verificationStatus: 'pending',
          adminRemark: undefined,
          verifiedAt: undefined
        },
        { new: true, upsert: true }
      );
      property.status = 'pending';
      await property.save();

      notificationService.sendToAdmins({
        title: 'Property Updated 📝',
        body: `${property.propertyName} has updated documents/details and is pending re-verification.`
      }, { type: 'property_updated', propertyId: property._id }).catch(e => console.error('Admin Update Push Error:', e));
    }

    res.json({ success: true, property });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const addRoomType = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { name, inventoryType, roomCategory, baseAdults, baseChildren, maxAdults, maxChildren, bedsPerRoom, totalInventory, pricePerNight, extraAdultPrice, extraChildPrice, images, amenities } = req.body;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (!pricePerNight) return res.status(400).json({ message: 'pricePerNight required' });

    const template = property.propertyTemplate || property.propertyType;

    if (template === 'villa' && inventoryType !== 'entire') return res.status(400).json({ message: 'Villa must have inventoryType="entire"' });
    if (template === 'hotel' && inventoryType !== 'room') return res.status(400).json({ message: 'Hotel must have inventoryType="room"' });
    if (template === 'resort' && inventoryType !== 'room') return res.status(400).json({ message: 'Resort must have inventoryType="room"' });
    if (template === 'hostel' && inventoryType !== 'bed') return res.status(400).json({ message: 'Hostel must have inventoryType="bed"' });
    if (template === 'pg' && inventoryType !== 'bed') return res.status(400).json({ message: 'PG must have inventoryType="bed"' });
    if (template === 'homestay' && !['room', 'entire'].includes(inventoryType)) return res.status(400).json({ message: 'Homestay must have inventoryType="room" or "entire"' });

    const normalizedImages = Array.isArray(images)
      ? images.filter(Boolean)
      : typeof images === 'string'
        ? images.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const rt = await RoomType.create({
      propertyId, name, inventoryType, roomCategory, baseAdults, baseChildren, maxAdults, maxChildren,
      bedsPerRoom, totalInventory, pricePerNight, extraAdultPrice, extraChildPrice,
      images: normalizedImages, amenities
    });
    res.status(201).json({ success: true, roomType: rt });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateRoomType = async (req, res) => {
  try {
    const { propertyId, roomTypeId } = req.params;
    const payload = req.body;

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (String(property.partnerId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const roomType = await RoomType.findOne({ _id: roomTypeId, propertyId });
    if (!roomType) return res.status(404).json({ message: 'Room type not found' });

    const updatableFields = ['name', 'inventoryType', 'roomCategory', 'baseAdults', 'baseChildren', 'maxAdults', 'maxChildren', 'bedsPerRoom', 'totalInventory', 'pricePerNight', 'extraAdultPrice', 'extraChildPrice', 'images', 'amenities', 'isActive'];
    updatableFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        roomType[field] = payload[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(payload, 'images')) {
      if (Array.isArray(payload.images)) {
        roomType.images = payload.images.filter(Boolean);
      } else if (typeof payload.images === 'string') {
        roomType.images = payload.images.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        roomType.images = [];
      }
    }

    if (payload.inventoryType) {
      const template = property.propertyTemplate || property.propertyType;
      if (template === 'villa' && roomType.inventoryType !== 'entire') return res.status(400).json({ message: 'Villa must have inventoryType="entire"' });
      if (template === 'hotel' && roomType.inventoryType !== 'room') return res.status(400).json({ message: 'Hotel must have inventoryType="room"' });
      if (template === 'resort' && roomType.inventoryType !== 'room') return res.status(400).json({ message: 'Resort must have inventoryType="room"' });
      if (template === 'hostel' && roomType.inventoryType !== 'bed') return res.status(400).json({ message: 'Hostel must have inventoryType="bed"' });
      if (template === 'pg' && roomType.inventoryType !== 'bed') return res.status(400).json({ message: 'PG must have inventoryType="bed"' });
      if (template === 'homestay' && !['room', 'entire'].includes(roomType.inventoryType)) return res.status(400).json({ message: 'Homestay must have inventoryType="room" or "entire"' });
    }

    await roomType.save();
    res.json({ success: true, roomType });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteRoomType = async (req, res) => {
  try {
    const { propertyId, roomTypeId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    if (String(property.partnerId) !== String(req.user._id) && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    const roomType = await RoomType.findOneAndDelete({ _id: roomTypeId, propertyId });
    if (!roomType) return res.status(404).json({ message: 'Room type not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const upsertDocuments = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const template = property.propertyTemplate || property.propertyType;
    const required = PROPERTY_DOCUMENTS[template] || [];
    const payloadDocs = Array.isArray(req.body.documents) ? req.body.documents : [];
    const doc = await PropertyDocument.findOneAndUpdate(
      { propertyId },
      {
        propertyType: property.propertyType,
        documents: payloadDocs.map(d => ({
          type: d.type,
          name: d.name || d.type,
          fileUrl: d.fileUrl,
          isRequired: required.includes(d.name || d.type)
        })),
        verificationStatus: 'pending',
        adminRemark: undefined,
        verifiedAt: undefined
      },
      { new: true, upsert: true }
    );
    const wasDraft = property.status === 'draft';
    property.status = 'pending';
    property.isLive = false;
    await property.save();

    if (wasDraft) {
      notifySubmission(property).catch(e => console.error(e));
    } else {
      notificationService.sendToAdmins({
        title: 'Property Docs Updated 📁',
        body: `Partner has updated documents for "${property.propertyName}". Review needed.`
      }, { type: 'property_docs_updated', propertyId: property._id }).catch(e => console.error('Admin Docs Update Push Error:', e));
    }

    res.json({ success: true, property, propertyDocument: doc });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getPublicProperties = async (req, res) => {
  try {
    const {
      search,
      type,
      minPrice,
      maxPrice,
      amenities,
      lat,
      lng,
      radius = 50,
      guests,
      sort,
      suitability
    } = req.query;

    const pipeline = [];

    // 1. Geospatial Search (Must be first if used)
    if (lat && lng) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: parseFloat(radius) * 1000,
          spherical: true,
          query: { status: 'approved', isLive: true }
        }
      });
    } else {
      pipeline.push({ $match: { status: 'approved', isLive: true } });
    }

    // 2. Text/Filter Match
    const matchConditions = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      matchConditions.$or = [
        { propertyName: regex },
        { "address.city": regex },
        { "address.area": regex },
        { "address.fullAddress": regex }
      ];
    }

    if (type && type !== 'all') {
      const typesList = type.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (typesList.length > 0) {
        // Match ONLY by propertyType to keep categories isolated.
        // Static categories (hotel, tent, etc.) → propertyType = "tent"
        // Dynamic categories (Heritage Stay) → propertyType = their slug e.g. "heritage-stay"
        // propertyTemplate is NOT used for filtering so categories never mix.
        matchConditions.propertyType = { $in: typesList };
      }
    }

    if (amenities) {
      const amList = Array.isArray(amenities) ? amenities : amenities.split(',');
      if (amList.length > 0) {
        matchConditions.amenities = { $all: amList };
      }
    }

    if (req.query.activities) {
      const actList = Array.isArray(req.query.activities) ? req.query.activities : req.query.activities.split(',');
      if (actList.length > 0) {
        matchConditions.activities = { $all: actList };
      }
    }

    if (suitability && suitability !== 'all') {
      if (suitability === 'Couple Friendly') {
        matchConditions.suitability = { $in: ['Couple Friendly', 'Both'] };
      } else if (suitability === 'Family Friendly') {
        matchConditions.suitability = { $in: ['Family Friendly', 'Both'] };
      } else if (suitability === 'Both') {
        matchConditions.suitability = 'Both';
      }
    }

    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // 3. Lookup Room Types (For Price & Guest Capacity)
    const roomTypeCollection = RoomType.collection.name;

    pipeline.push({
      $lookup: {
        from: roomTypeCollection,
        localField: '_id',
        foreignField: 'propertyId',
        as: 'roomTypes'
      }
    });

    // 4. Filter Active Room Types & Guest Capacity
    let roomFilter = { $eq: ['$$rt.isActive', true] };

    if (guests) {
      const guestCount = parseInt(guests);
      roomFilter = {
        $and: [
          { $eq: ['$$rt.isActive', true] },
          { $gte: ['$$rt.maxAdults', guestCount] }
        ]
      };
    }

    pipeline.push({
      $addFields: {
        roomTypes: {
          $filter: {
            input: '$roomTypes',
            as: 'rt',
            cond: roomFilter
          }
        }
      }
    });

    // 5. Calculate Starting Price
    pipeline.push({
      $addFields: {
        startingPrice: {
          $cond: {
            if: { $gt: [{ $size: "$roomTypes" }, 0] },
            then: { $min: "$roomTypes.pricePerNight" },
            else: null
          }
        },
        hasMatchingRooms: { $gt: [{ $size: "$roomTypes" }, 0] }
      }
    });

    // 6. Filter by Price Range
    const priceMatch = { hasMatchingRooms: true };

    if (minPrice) {
      priceMatch.startingPrice = { ...priceMatch.startingPrice, $gte: parseInt(minPrice) };
    }
    if (maxPrice) {
      priceMatch.startingPrice = { ...priceMatch.startingPrice, $lte: parseInt(maxPrice) };
    }

    if (Object.keys(priceMatch).length > 1) {
      pipeline.push({ $match: priceMatch });
    }

    // 7. Sorting
    let sortStage = { createdAt: -1 };
    if (sort) {
      if (sort === 'newest') sortStage = { createdAt: -1 };
      if (sort === 'price_low') sortStage = { startingPrice: 1 };
      if (sort === 'price_high') sortStage = { startingPrice: -1 };
      if (sort === 'rating') sortStage = { avgRating: -1 };
      if (sort === 'distance' && lat && lng) sortStage = { distance: 1 };
    }

    pipeline.push({ $sort: sortStage });

    const list = await Property.aggregate(pipeline);
    res.json(list);

  } catch (e) {
    console.error("Error in getPublicProperties:", e);
    res.status(500).json({ message: e.message });
  }
};

export const getMyProperties = async (req, res) => {
  try {
    const query = { partnerId: req.user._id, status: { $ne: 'draft' } };
    if (req.query.type) {
      query.propertyType = String(req.query.type).toLowerCase();
    }
    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json({ success: true, properties });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getPropertyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const roomTypes = await RoomType.find({ propertyId: id, isActive: true });
    const documents = await PropertyDocument.findOne({ propertyId: id });
    res.json({ property, roomTypes, documents });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = await Property.findOne({ _id: propertyId, partnerId: req.user._id });

    if (!property) {
      return res.status(404).json({ message: 'Property not found or unauthorized' });
    }

    await RoomType.deleteMany({ propertyId });
    await PropertyDocument.deleteMany({ propertyId });

    const deletedPropName = property.propertyName;
    await Property.findByIdAndDelete(propertyId);

    notificationService.sendToAdmins({
      title: 'Property Deleted 🗑️',
      body: `Property "${deletedPropName}" has been deleted by the partner.`
    }, { type: 'property_deleted', propertyId }).catch(e => console.error('Admin Delete Push Error:', e));

    Partner.findById(req.user._id).then(partner => {
      if (partner && partner.email) {
        emailService.sendPartnerPropertyDeletedEmail(partner, property, 'Partner (Self)').catch(e => console.error(e));
      }
    });

    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Failed to delete property' });
  }
};
