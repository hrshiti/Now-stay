import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertyService, hotelService } from '../../../services/apiService';
// Compression removed - Cloudinary handles optimization
import { CheckCircle, FileText, Home, Image, Bed, MapPin, Search, Plus, Trash2, ChevronLeft, ChevronRight, Upload, X, ArrowLeft, ArrowRight, BedDouble, Users, Wifi, Clock, Loader2, Camera, AlertCircle, ImageIcon } from 'lucide-react';
import logo from '../../../assets/rokologin-removebg-preview.png';
import { isFlutterApp, openFlutterCamera } from '../../../utils/flutterBridge';

const REQUIRED_DOCS_HOSTEL = [
  { type: 'trade_license', name: 'Trade License' },
  { type: 'fire_safety', name: 'Fire Safety Certificate' },
  { type: 'police_verification', name: 'Police Verification' },
  { type: 'owner_id_proof', name: 'Owner ID Proof' }
];

const HOSTEL_AMENITIES = [
  { name: 'WiFi', icon: 'wifi' },
  { name: 'Laundry', icon: 'washing-machine' },
  { name: 'Housekeeping', icon: 'broom' },
  { name: 'CCTV', icon: 'camera' },
  { name: 'Security', icon: 'shield' }
];

const ROOM_AMENITIES = [
  { key: 'bunk_bed', label: 'Bunk Bed', icon: Bed },
  { key: 'personal_locker', label: 'Personal Locker', icon: FileText },
  { key: 'fan', label: 'Fan', icon: CheckCircle },
  { key: 'common_washroom', label: 'Common Washroom', icon: MapPin }
];

const AddHostelWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingProperty = location.state?.property || null;
  const isEditMode = !!existingProperty;
  const initialStep = location.state?.initialStep || 1;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdProperty, setCreatedProperty] = useState(null);

  const [nearbySearchQuery, setNearbySearchQuery] = useState('');
  const [nearbyResults, setNearbyResults] = useState([]);
  const [editingNearbyIndex, setEditingNearbyIndex] = useState(null);
  const [tempNearbyPlace, setTempNearbyPlace] = useState({ name: '', type: 'tourist', distanceKm: '' });
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isFlutter, setIsFlutter] = useState(false);

  useEffect(() => {
    setIsFlutter(isFlutterApp());
  }, []);

  const coverImageFileInputRef = useRef(null);
  const propertyImagesFileInputRef = useRef(null);
  const roomImagesFileInputRef = useRef(null);
  const documentInputRefs = useRef([]);

  const [propertyForm, setPropertyForm] = useState({
    propertyName: '',
    propertyType: 'hostel',
    hostelType: 'boys',
    description: '',
    shortDescription: '',
    coverImage: '',
    propertyImages: [],
    address: { country: '', state: '', city: '', area: '', fullAddress: '', pincode: '' },
    location: { type: 'Point', coordinates: ['', ''] },
    nearbyPlaces: [],
    amenities: [],
    checkInTime: '',
    checkOutTime: '',
    contactNumber: '',
    cancellationPolicy: '',
    houseRules: [],
    documents: REQUIRED_DOCS_HOSTEL.map(d => ({ type: d.type, name: d.name, fileUrl: '' }))
  });

  const [roomTypes, setRoomTypes] = useState([]);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [editingRoomTypeIndex, setEditingRoomTypeIndex] = useState(null);
  const [originalRoomTypeIds, setOriginalRoomTypeIds] = useState([]);

  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    propertyName: '',
    shortDescription: '',
    description: '',
    contactNumber: '',
    country: '',
    state: '',
    city: '',
    area: '',
    fullAddress: '',
    pincode: '',
    checkInTime: '',
    checkOutTime: '',
    cancellationPolicy: '',
    hostelType: '',
    amenities: '',
    nearbyPlaces: '',
    coverImage: '',
    propertyImages: '',
    roomTypes: '',
    tempNearbyPlace: { name: '', type: '', distanceKm: '' },
    editingRoomType: { name: '', pricePerNight: '', totalInventory: '', bedsPerRoom: '', maxAdults: '', images: '' }
  });

  // Validation helper functions
  const validatePropertyName = (value) => {
    if (!value || value.trim().length === 0) return 'Property name is required';
    if (value.trim().length < 3) return 'Property name must be at least 3 characters';
    if (value.trim().length > 100) return 'Property name must not exceed 100 characters';
    if (!/[a-zA-Z]/.test(value)) return 'Property name must contain at least one letter';
    return '';
  };

  const validateShortDescription = (value) => {
    if (!value || value.trim().length === 0) return 'Short description is required';
    if (value.trim().length < 10) return 'Short description must be at least 10 characters';
    if (value.trim().length > 200) return 'Short description must not exceed 200 characters';
    return '';
  };

  const validateDescription = (value) => {
    if (value && value.trim().length > 0 && value.trim().length < 20) {
      return 'Description must be at least 20 characters if provided';
    }
    if (value && value.trim().length > 2000) return 'Description must not exceed 2000 characters';
    return '';
  };

  const validateContactNumber = (value) => {
    if (!value || value.trim().length === 0) return 'Contact number is required';
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length !== 10) return `Contact number must be exactly 10 digits (found: ${digitsOnly.length})`;
    if (!/^[6-9]/.test(digitsOnly)) return 'Contact number must start with 6, 7, 8, or 9';
    return '';
  };

  const validateAddress = (field, value) => {
    if (!value || value.trim().length === 0) return `${field} is required`;
    if (value.trim().length < 2) return `${field} must be at least 2 characters`;
    if (value.trim().length > 100) return `${field} must not exceed 100 characters`;
    return '';
  };

  const validatePincode = (value) => {
    if (!value || value.trim().length === 0) return 'Pincode is required';
    if (!/^\d{6}$/.test(value.replace(/\s/g, ''))) return 'Pincode must be exactly 6 digits';
    return '';
  };

  const validateTime = (value, fieldName) => {
    if (!value || value.trim().length === 0) return `${fieldName} is required`;
    return '';
  };

  const validateCancellationPolicy = (value) => {
    if (!value || value.trim().length === 0) return 'Cancellation policy is required';
    if (value.trim().length < 10) return 'Cancellation policy must be at least 10 characters';
    if (value.trim().length > 500) return 'Cancellation policy must not exceed 500 characters';
    return '';
  };

  const validateNearbyPlaceName = (value) => {
    if (!value || value.trim().length === 0) return 'Place name is required';
    if (value.trim().length < 2) return 'Place name must be at least 2 characters';
    if (value.trim().length > 100) return 'Place name must not exceed 100 characters';
    return '';
  };

  const validateDistance = (value) => {
    if (!value || value.trim().length === 0) return 'Distance is required';
    const num = Number(value);
    if (isNaN(num)) return 'Distance must be a number';
    if (num <= 0) return 'Distance must be greater than 0';
    if (num > 100) return 'Distance must not exceed 100 km';
    return '';
  };

  const validateRoomName = (value) => {
    if (!value || value.trim().length === 0) return 'Inventory name is required';
    if (value.trim().length < 3) return 'Inventory name must be at least 3 characters';
    if (value.trim().length > 100) return 'Inventory name must not exceed 100 characters';
    return '';
  };

  const validatePrice = (value) => {
    if (!value || value.trim().length === 0) return 'Price is required';
    const num = Number(value);
    if (isNaN(num)) return 'Price must be a number';
    if (num <= 0) return 'Price must be greater than 0';
    if (num > 100000) return 'Price must not exceed ₹100,000';
    return '';
  };

  const validateInventoryCount = (value, fieldName) => {
    if (!value || value.trim().length === 0) return `${fieldName} is required`;
    const num = Number(value);
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (num <= 0) return `${fieldName} must be greater than 0`;
    if (num > 1000) return `${fieldName} must not exceed 1000`;
    return '';
  };

  // Update field error
  const updateFieldError = (fieldPath, error) => {
    setFieldErrors(prev => {
      const keys = Array.isArray(fieldPath) ? fieldPath : String(fieldPath).split('.');
      const clone = JSON.parse(JSON.stringify(prev));
      let ref = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!ref[keys[i]]) ref[keys[i]] = {};
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = error;
      return clone;
    });
  };

  // --- Persistence Logic ---
  const STORAGE_KEY = `rukko_hostel_wizard_draft_${existingProperty?._id || 'new'}`;

  // 1. Load from localStorage
  useEffect(() => {
    if (isEditMode) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { step: savedStep, propertyForm: savedForm, roomTypes: savedRooms, createdProperty: savedProp } = JSON.parse(saved);
        setStep(savedStep);
        setPropertyForm(savedForm);
        setRoomTypes(savedRooms);
        if (savedProp) setCreatedProperty(savedProp);
      } catch (e) {
        console.error("Failed to load hostel draft", e);
      }
    }
  }, []);

  // 2. Save to localStorage
  useEffect(() => {
    if (isEditMode) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, propertyForm, roomTypes, createdProperty }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [step, propertyForm, roomTypes, createdProperty]);

  const updatePropertyForm = (path, value) => {
    setPropertyForm(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = Array.isArray(path) ? path : String(path).split('.');
      let ref = clone;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return clone;
    });

    // Real-time field validation
    const pathStr = Array.isArray(path) ? path.join('.') : path;
    
    if (pathStr === 'propertyName') {
      updateFieldError('propertyName', validatePropertyName(value));
    } else if (pathStr === 'shortDescription') {
      updateFieldError('shortDescription', validateShortDescription(value));
    } else if (pathStr === 'description') {
      updateFieldError('description', validateDescription(value));
    } else if (pathStr === 'contactNumber') {
      updateFieldError('contactNumber', validateContactNumber(value));
    } else if (pathStr === 'address.country') {
      updateFieldError('country', validateAddress('Country', value));
    } else if (pathStr === 'address.state') {
      updateFieldError('state', validateAddress('State', value));
    } else if (pathStr === 'address.city') {
      updateFieldError('city', validateAddress('City', value));
    } else if (pathStr === 'address.area') {
      updateFieldError('area', validateAddress('Area', value));
    } else if (pathStr === 'address.fullAddress') {
      updateFieldError('fullAddress', validateAddress('Full Address', value));
    } else if (pathStr === 'address.pincode') {
      updateFieldError('pincode', validatePincode(value));
    } else if (pathStr === 'checkInTime') {
      updateFieldError('checkInTime', validateTime(value, 'Check-in time'));
    } else if (pathStr === 'checkOutTime') {
      updateFieldError('checkOutTime', validateTime(value, 'Check-out time'));
    } else if (pathStr === 'cancellationPolicy') {
      updateFieldError('cancellationPolicy', validateCancellationPolicy(value));
    }
  };

  useEffect(() => {
    const loadForEdit = async () => {
      if (!isEditMode || !existingProperty?._id) return;
      setLoading(true);
      setError('');
      try {
        const res = await propertyService.getDetails(existingProperty._id);
        const prop = res.property || existingProperty;
        const docs = res.documents?.documents || [];
        const rts = res.roomTypes || [];
        setCreatedProperty(prop);
        setPropertyForm({
          propertyName: prop.propertyName || '',
          hostelType: prop.hostelType || 'boys',
          description: prop.description || '',
          shortDescription: prop.shortDescription || '',
          coverImage: prop.coverImage || '',
          propertyImages: prop.propertyImages || [],
          address: {
            country: prop.address?.country || '',
            state: prop.address?.state || '',
            city: prop.address?.city || '',
            area: prop.address?.area || '',
            fullAddress: prop.address?.fullAddress || '',
            pincode: prop.address?.pincode || ''
          },
          location: {
            type: 'Point',
            coordinates: [
              typeof prop.location?.coordinates?.[0] === 'number'
                ? String(prop.location.coordinates[0])
                : '',
              typeof prop.location?.coordinates?.[1] === 'number'
                ? String(prop.location.coordinates[1])
                : ''
            ]
          },
          nearbyPlaces: Array.isArray(prop.nearbyPlaces) && prop.nearbyPlaces.length
            ? prop.nearbyPlaces.map(p => ({
              name: p.name || '',
              type: p.type || 'tourist',
              distanceKm: typeof p.distanceKm === 'number' ? String(p.distanceKm) : ''
            }))
            : [],
          amenities: prop.amenities || [],
          checkInTime: prop.checkInTime || '12:00 PM',
          checkOutTime: prop.checkOutTime || '10:00 AM',
          cancellationPolicy: prop.cancellationPolicy || 'No refund after check-in',
          houseRules: prop.houseRules || [],
          contactNumber: prop.contactNumber || '',
          documents: docs.length
            ? docs.map(d => ({ type: d.type || d.name, name: d.name, fileUrl: d.fileUrl || '' }))
            : REQUIRED_DOCS_HOSTEL.map(d => ({ type: d.type, name: d.name, fileUrl: '' }))
        });
        if (rts.length) {
          setRoomTypes(
            rts.map(rt => ({
              id: rt._id,
              backendId: rt._id,
              name: rt.name || '',
              inventoryType: rt.inventoryType || 'bed',
              roomCategory: rt.roomCategory || 'shared',
              maxAdults: rt.maxAdults ?? 1,
              maxChildren: rt.maxChildren ?? 0,
              bedsPerRoom: rt.bedsPerRoom ?? 4,
              totalInventory: rt.totalInventory ?? 20,
              pricePerNight: rt.pricePerNight ?? '',
              extraAdultPrice: rt.extraAdultPrice ?? 0,
              extraChildPrice: rt.extraChildPrice ?? 0,
              images: rt.images || ['', '', '', ''],
              amenities: rt.amenities || [],
              isActive: typeof rt.isActive === 'boolean' ? rt.isActive : true
            }))
          );
          setOriginalRoomTypeIds(rts.map(rt => rt._id));
        } else {
          setOriginalRoomTypeIds([]);
        }
      } catch (e) {
        setError(e?.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };
    loadForEdit();
  }, [isEditMode, existingProperty]);

  const useCurrentLocation = async () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    try {
      // 1. Get Coordinates
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000
        });
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      // 2. Call Backend API
      const res = await hotelService.getAddressFromCoordinates(lat, lng);

      updatePropertyForm(['location', 'coordinates'], [String(lng), String(lat)]);
      updatePropertyForm('address', {
        country: res.country || '',
        state: res.state || '',
        city: res.city || '',
        area: res.area || '',
        fullAddress: res.fullAddress || '',
        pincode: res.pincode || ''
      });
    } catch (err) {
      console.error("Location Error:", err);
      if (err.code === 1) { // PERMISSION_DENIED
        setError('Location permission denied. Please enable it in browser settings.');
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setError('Location unavailable. Check your GPS/network.');
      } else if (err.code === 3) { // TIMEOUT
        setError('Location request timed out.');
      } else {
        setError(err.message || 'Failed to fetch address from coordinates');
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const searchLocationForAddress = async () => {
    try {
      setError('');
      if (!locationSearchQuery.trim()) return;
      const res = await hotelService.searchLocation(locationSearchQuery.trim());
      setLocationResults(Array.isArray(res?.results) ? res.results : []);
    } catch {
      setError('Failed to search location');
    }
  };

  const selectLocationResult = async (place) => {
    try {
      setError('');
      const lat = place.lat;
      const lng = place.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      const res = await hotelService.getAddressFromCoordinates(lat, lng);
      updatePropertyForm(['location', 'coordinates'], [String(lng), String(lat)]);
      updatePropertyForm('address', {
        country: res.country || '',
        state: res.state || '',
        city: res.city || '',
        area: res.area || '',
        fullAddress: res.fullAddress || '',
        pincode: res.pincode || ''
      });
    } catch {
      setError('Failed to use selected location');
    }
  };

  const searchNearbyPlaces = async () => {
    try {
      setError('');
      if (!nearbySearchQuery.trim()) return;
      const res = await hotelService.searchLocation(nearbySearchQuery.trim());
      setNearbyResults(Array.isArray(res?.results) ? res.results : []);
    } catch {
      setError('Failed to search places');
    }
  };

  const selectNearbyPlace = async (place) => {
    try {
      const originLat = Number(propertyForm.location.coordinates[1] || 0);
      const originLng = Number(propertyForm.location.coordinates[0] || 0);
      const destLat = place.lat;
      const destLng = place.lng;

      let km = '';
      if (originLat && originLng && destLat && destLng) {
        const distRes = await hotelService.calculateDistance(originLat, originLng, destLat, destLng);
        km = distRes?.distanceKm ? String(distRes.distanceKm) : '';
      }

      setTempNearbyPlace(prev => ({
        ...prev,
        name: place.name || '',
        distanceKm: km
      }));
      setNearbyResults([]);
      setNearbySearchQuery('');
    } catch {
      setTempNearbyPlace(prev => ({ ...prev, name: place.name || '' }));
    }
  };

  const startAddNearbyPlace = () => {
    if (propertyForm.nearbyPlaces.length >= 5) {
      setError('Maximum 5 nearby places allowed');
      return;
    }
    setError('');
    setEditingNearbyIndex(-1);
    setTempNearbyPlace({ name: '', type: 'tourist', distanceKm: '' });
    setNearbySearchQuery('');
    setNearbyResults([]);
  };

  const startEditNearbyPlace = (index) => {
    setError('');
    setEditingNearbyIndex(index);
    setTempNearbyPlace({ ...propertyForm.nearbyPlaces[index] });
    setNearbySearchQuery('');
    setNearbyResults([]);
  };

  const deleteNearbyPlace = (index) => {
    const arr = propertyForm.nearbyPlaces.filter((_, i) => i !== index);
    updatePropertyForm('nearbyPlaces', arr);
  };

  const saveNearbyPlace = () => {
    if (!tempNearbyPlace.name || !tempNearbyPlace.distanceKm) {
      setError('Name and Distance are required');
      return;
    }
    const arr = [...propertyForm.nearbyPlaces];
    if (editingNearbyIndex === -1) {
      arr.push(tempNearbyPlace);
    } else {
      arr[editingNearbyIndex] = tempNearbyPlace;
    }
    updatePropertyForm('nearbyPlaces', arr);
    setEditingNearbyIndex(null);
    setError('');
  };

  const cancelEditNearbyPlace = () => {
    setEditingNearbyIndex(null);
    setError('');


  };

  useEffect(() => {
    setIsFlutter(isFlutterApp());
  }, []);

  const handleCameraUpload = async (type, onDone) => {
    try {
      setUploading(type);
      setError('');
      console.log('[Camera] Opening Flutter camera...');

      const result = await openFlutterCamera();

      if (!result.success || !result.base64) {
        throw new Error('Camera capture failed');
      }

      console.log('[Camera] Image captured, uploading...');

      const isSingle = type === 'cover' || type === 'room' || type.startsWith('doc');

      const res = await hotelService.uploadImagesBase64([result]);

      if (res && res.success && res.files && res.files.length > 0) {
        if (isSingle) {
          onDone(res.files[0].url);
        } else {
          onDone([res.files[0].url]);
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('[Camera] Error:', err);
      setError(err.message || 'Camera capture failed');
    } finally {
      setUploading(null);
    }
  };

  const uploadImages = async (files, type, onDone) => {
    try {
      setUploading(type);
      const fd = new FormData();

      const fileArray = Array.from(files);
      console.log(`Processing ${fileArray.length} images...`);

      for (const file of fileArray) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is too large. Maximum 10MB allowed.`);
        }
        console.log(`Adding ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
        fd.append('images', file);
      }

      const res = await hotelService.uploadImages(fd);
      const urls = Array.isArray(res?.urls) ? res.urls : [];
      console.log('Upload done, urls:', urls);
      onDone(urls);
    } catch (err) {
      console.error("Upload failed", err);
      let msg = 'Upload failed';
      if (typeof err === 'string') msg = err;
      else if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;

      if (msg === 'Network Error' || (err?.response && err.response.status === 413)) {
        msg = 'Upload failed: File size may be too large (Max 10MB).';
      }
      setError(msg);
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = async (url, type, index = null) => {
    if (!url) return;
    try {
      if (url.includes('cloudinary.com') && url.includes('rukkoin')) {
        await hotelService.deleteImage(url);
      }
    } catch (err) {
      console.warn("Delete image failed:", err);
    }

    if (type === 'cover') {
      updatePropertyForm('coverImage', '');
    } else if (type === 'gallery') {
      const arr = [...propertyForm.propertyImages];
      arr.splice(index, 1);
      updatePropertyForm('propertyImages', arr);
    } else if (type === 'room') {
      setEditingRoomType(prev => {
        const next = [...(prev.images || [])];
        next.splice(index, 1);
        return { ...prev, images: next };
      });
    }
  };

  const startAddRoomType = () => {
    setError('');
    setEditingRoomTypeIndex(-1);
    setEditingRoomType({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: '',
      inventoryType: 'bed',
      roomCategory: 'shared',
      maxAdults: '',
      maxChildren: 0,
      bedsPerRoom: '',
      totalInventory: '',
      pricePerNight: '',
      extraAdultPrice: 0,
      extraChildPrice: 0,
      images: [],
      amenities: [],
      isActive: true
    });
  };

  const startEditRoomType = (index) => {
    setError('');
    setEditingRoomTypeIndex(index);
    const rt = roomTypes[index];
    setEditingRoomType({
      ...rt,
      images: Array.isArray(rt.images) ? rt.images : [],
      amenities: Array.isArray(rt.amenities) ? rt.amenities : []
    });
  };

  const cancelEditRoomType = () => {
    setEditingRoomTypeIndex(null);
    setEditingRoomType(null);
    setError('');
  };

  const saveRoomType = () => {
    if (!editingRoomType) return;
    if (!editingRoomType.name || !editingRoomType.pricePerNight) {
      setError('Room type name and price required');
      return;
    }
    if (!editingRoomType.amenities || editingRoomType.amenities.length === 0) {
      setError('Please select at least 1 room/bed amenity');
      return;
    }
    const imageCount = (editingRoomType.images || []).filter(Boolean).length;
    if (imageCount < 3) {
      setError('Please upload at least 3 room images');
      return;
    }
    const next = [...roomTypes];
    if (editingRoomTypeIndex === -1 || editingRoomTypeIndex == null) {
      next.push(editingRoomType);
    } else {
      next[editingRoomTypeIndex] = editingRoomType;
    }
    setRoomTypes(next);
    setEditingRoomType(null);
    setEditingRoomTypeIndex(null);
    setError('');
  };

  const deleteRoomType = (index) => {
    setRoomTypes(prev => prev.filter((_, i) => i !== index));
  };

  const nextFromBasic = () => {
    setError('');
    
    // Validate each field
    const nameErr = validatePropertyName(propertyForm.propertyName);
    const shortDescErr = validateShortDescription(propertyForm.shortDescription);
    const contactErr = validateContactNumber(propertyForm.contactNumber);
    
    // Update field errors
    updateFieldError('propertyName', nameErr);
    updateFieldError('shortDescription', shortDescErr);
    updateFieldError('contactNumber', contactErr);
    
    // Check if any errors exist
    if (nameErr || shortDescErr || contactErr) {
      setError('Please fix all required fields');
      return;
    }
    
    setStep(2);
  };

  const nextFromLocation = () => {
    setError('');
    const { country, state, city, area, fullAddress, pincode } = propertyForm.address;
    
    // Validate each field and set field errors
    const countryErr = validateAddress('Country', country);
    const stateErr = validateAddress('State', state);
    const cityErr = validateAddress('City', city);
    const areaErr = validateAddress('Area', area);
    const fullAddressErr = validateAddress('Full Address', fullAddress);
    const pincodeErr = validatePincode(pincode);
    
    // Update field errors
    updateFieldError('country', countryErr);
    updateFieldError('state', stateErr);
    updateFieldError('city', cityErr);
    updateFieldError('area', areaErr);
    updateFieldError('fullAddress', fullAddressErr);
    updateFieldError('pincode', pincodeErr);
    
    // Check if any errors exist
    if (countryErr || stateErr || cityErr || areaErr || fullAddressErr || pincodeErr) {
      setError('Please fix all address fields');
      return;
    }
    
    // Coordinates are optional - user can add them later via search or "Use Current Location"
    setStep(3);
  };

  const nextFromAmenities = () => {
    setError('');
    if (propertyForm.amenities.length < 1) {
      setError('Please add at least 1 amenity');
      updateFieldError('amenities', 'At least 1 amenity is required');
      return;
    }
    setStep(4);
  };

  const nextFromNearbyPlaces = () => {
    setError('');
    if (propertyForm.nearbyPlaces.length < 1) {
      setError('Please add at least 1 nearby place');
      updateFieldError('nearbyPlaces', 'At least 1 nearby place is required');
      return;
    }
    
    // Validate each nearby place
    for (let i = 0; i < propertyForm.nearbyPlaces.length; i++) {
      const place = propertyForm.nearbyPlaces[i];
      
      // Validate name
      const nameErr = validateNearbyPlaceName(place.name);
      if (nameErr) {
        setError(`Nearby place ${i + 1}: ${nameErr}`);
        return;
      }
      
      // Validate distance
      const distErr = validateDistance(String(place.distanceKm));
      if (distErr) {
        setError(`Nearby place ${i + 1}: ${distErr}`);
        return;
      }
    }
    
    setStep(5);
  };

  const nextFromImages = () => {
    setError('');
    if (!propertyForm.coverImage) {
      setError('Cover image is required');
      updateFieldError('coverImage', 'Cover image is required');
      return;
    }
    
    const validImages = propertyForm.propertyImages.filter(Boolean);
    if (validImages.length < 4) {
      setError(`Please upload at least 4 property images (currently: ${validImages.length})`);
      updateFieldError('propertyImages', `At least 4 images required (currently: ${validImages.length})`);
      return;
    }
    
    setStep(6);
  };

  const nextFromRoomTypes = () => {
    setError('');
    if (!roomTypes.length) {
      setError('At least one bed inventory is required');
      return;
    }
    
    for (let i = 0; i < roomTypes.length; i++) {
      const rt = roomTypes[i];
      
      // Validate name
      const nameErr = validateRoomName(rt.name);
      if (nameErr) {
        setError(`Inventory ${i + 1}: ${nameErr}`);
        return;
      }
      
      // Validate price
      const priceErr = validatePrice(String(rt.pricePerNight));
      if (priceErr) {
        setError(`Inventory ${i + 1}: ${priceErr}`);
        return;
      }
      
      // Validate max adults
      if (!rt.maxAdults || rt.maxAdults === '') {
        setError(`Inventory ${i + 1}: Max occupancy is required`);
        return;
      }
      const maxAdults = Number(rt.maxAdults);
      if (isNaN(maxAdults) || maxAdults < 1) {
        setError(`Inventory ${i + 1}: Max occupancy must be at least 1`);
        return;
      }
      if (maxAdults > 20) {
        setError(`Inventory ${i + 1}: Max occupancy cannot exceed 20`);
        return;
      }
      
      // Validate images
      const validImages = (rt.images || []).filter(Boolean);
      if (validImages.length < 3) {
        setError(`Inventory ${i + 1}: At least 3 images required (currently: ${validImages.length})`);
        return;
      }
      if (validImages.length > 15) {
        setError(`Inventory ${i + 1}: Maximum 15 images allowed`);
        return;
      }
      
      // Validate amenities
      if (!rt.amenities || rt.amenities.length === 0) {
        setError(`Inventory ${i + 1}: At least 1 amenity must be selected`);
        return;
      }
    }
    
    setStep(7);
  };

  const nextFromRules = () => {
    setError('');
    
    // Validate each field
    const checkInErr = validateTime(propertyForm.checkInTime, 'Check-in time');
    const checkOutErr = validateTime(propertyForm.checkOutTime, 'Check-out time');
    const policyErr = validateCancellationPolicy(propertyForm.cancellationPolicy);
    
    // Update field errors
    updateFieldError('checkInTime', checkInErr);
    updateFieldError('checkOutTime', checkOutErr);
    updateFieldError('cancellationPolicy', policyErr);
    
    // Check if any errors exist
    if (checkInErr || checkOutErr || policyErr) {
      setError('Please fix all required fields');
      return;
    }
    
    setStep(8);
  };

  const nextFromDocuments = () => {
    setError('');
    
    // Check if all documents are uploaded
    const missingDocs = propertyForm.documents.filter(doc => !doc.fileUrl);
    if (missingDocs.length > 0) {
      setError(`Please upload all required documents (${propertyForm.documents.length - missingDocs.length}/${propertyForm.documents.length} uploaded)`);
      return;
    }
    
    setStep(9);
  };

  const validateBeforeSubmit = () => {
    // Step 1: Basic Info
    if (!propertyForm.propertyName || propertyForm.propertyName.trim().length === 0) {
      setError('Property name is required');
      return false;
    }
    if (!/[a-zA-Z]/.test(propertyForm.propertyName)) {
      setError('Property name must contain at least one letter');
      return false;
    }
    if (!propertyForm.shortDescription || propertyForm.shortDescription.trim().length === 0) {
      setError('Short description is required');
      return false;
    }
    if (!propertyForm.contactNumber) {
      setError('Contact number is required');
      return false;
    }
    const contactDigitsOnly = propertyForm.contactNumber.replace(/\D/g, '');
    if (contactDigitsOnly.length !== 10) {
      setError('Contact number must contain exactly 10 digits');
      return false;
    }

    // Step 2: Location
    const { country, state, city, area, fullAddress, pincode } = propertyForm.address;
    if (!country || !state || !city || !area || !fullAddress || !pincode) {
      setError('All address fields are required');
      return false;
    }
    if (!propertyForm.location.coordinates[0] || !propertyForm.location.coordinates[1]) {
      setError('Location coordinates are required');
      return false;
    }

    // Step 3: Amenities (optional but good to have)
    if (!propertyForm.amenities || propertyForm.amenities.length === 0) {
      setError('Please select at least one amenity');
      return false;
    }

    // Step 4: Nearby Places
    if (!propertyForm.nearbyPlaces || propertyForm.nearbyPlaces.length === 0) {
      setError('Please add at least one nearby place');
      return false;
    }

    // Step 5: Images
    if (!propertyForm.coverImage) {
      setError('Cover image is required');
      return false;
    }
    const validPropertyImages = propertyForm.propertyImages.filter(Boolean);
    if (validPropertyImages.length < 4) {
      setError(`Please upload at least 4 property images (currently: ${validPropertyImages.length})`);
      return false;
    }

    // Step 6: Room Types
    if (!roomTypes || roomTypes.length === 0) {
      setError('At least one bed inventory is required');
      return false;
    }
    for (let i = 0; i < roomTypes.length; i++) {
      const rt = roomTypes[i];
      if (!rt.name || rt.name.trim().length === 0) {
        setError(`Inventory ${i + 1}: Name is required`);
        return false;
      }
      if (!rt.pricePerNight || Number(rt.pricePerNight) <= 0) {
        setError(`Inventory ${i + 1}: Price must be greater than 0`);
        return false;
      }
      if (!rt.totalInventory || Number(rt.totalInventory) <= 0) {
        setError(`Inventory ${i + 1}: Total units must be greater than 0`);
        return false;
      }
      if (!rt.bedsPerRoom || Number(rt.bedsPerRoom) <= 0) {
        setError(`Inventory ${i + 1}: Beds per room must be greater than 0`);
        return false;
      }
      if (!rt.maxAdults || Number(rt.maxAdults) <= 0) {
        setError(`Inventory ${i + 1}: Max adults must be greater than 0`);
        return false;
      }
      const validImages = (rt.images || []).filter(Boolean);
      if (validImages.length < 3) {
        setError(`Inventory ${i + 1}: At least 3 images required (currently: ${validImages.length})`);
        return false;
      }
    }

    // Step 7: Rules
    if (!propertyForm.checkInTime || propertyForm.checkInTime.trim().length === 0) {
      setError('Check-in time is required');
      return false;
    }
    if (!propertyForm.checkOutTime || propertyForm.checkOutTime.trim().length === 0) {
      setError('Check-out time is required');
      return false;
    }
    if (!propertyForm.cancellationPolicy || propertyForm.cancellationPolicy.trim().length === 0) {
      setError('Cancellation policy is required');
      return false;
    }

    return true;
  };

  const submitAll = async () => {
    // Validate before submission
    if (!validateBeforeSubmit()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const propertyPayload = {
        propertyType: 'hostel',
        propertyName: propertyForm.propertyName,
        contactNumber: propertyForm.contactNumber,
        hostelType: propertyForm.hostelType,
        description: propertyForm.description,
        shortDescription: propertyForm.shortDescription,
        coverImage: propertyForm.coverImage,
        propertyImages: propertyForm.propertyImages.filter(Boolean),
        address: propertyForm.address,
        location: {
          type: 'Point',
          coordinates: [
            Number(propertyForm.location.coordinates[0]),
            Number(propertyForm.location.coordinates[1])
          ]
        },
        nearbyPlaces: propertyForm.nearbyPlaces.map(p => ({
          name: p.name,
          type: p.type,
          distanceKm: Number(p.distanceKm || 0)
        })),
        amenities: propertyForm.amenities,
        checkInTime: propertyForm.checkInTime,
        checkOutTime: propertyForm.checkOutTime,
        cancellationPolicy: propertyForm.cancellationPolicy,
        houseRules: propertyForm.houseRules,
        documents: propertyForm.documents
      };
      let propId = createdProperty?._id;
      if (propId) {
        const updated = await propertyService.update(propId, propertyPayload);
        propId = updated.property?._id || propId;

        const existingIds = new Set(isEditMode ? originalRoomTypeIds : []);
        const persistedIds = [];
        for (const rt of roomTypes) {
          const payload = {
            name: rt.name,
            inventoryType: 'bed',
            roomCategory: rt.roomCategory,
            maxAdults: Number(rt.maxAdults),
            maxChildren: Number(rt.maxChildren || 0),
            bedsPerRoom: Number(rt.bedsPerRoom),
            totalInventory: Number(rt.totalInventory || 0),
            pricePerNight: Number(rt.pricePerNight),
            extraAdultPrice: Number(rt.extraAdultPrice || 0),
            extraChildPrice: Number(rt.extraChildPrice || 0),
            images: rt.images.filter(Boolean),
            amenities: rt.amenities
          };
          if (rt.backendId) {
            await propertyService.updateRoomType(propId, rt.backendId, payload);
            persistedIds.push(rt.backendId);
          } else {
            const created = await propertyService.addRoomType(propId, payload);
            if (created.roomType?._id) persistedIds.push(created.roomType._id);
          }
        }
        for (const id of existingIds) {
          if (!persistedIds.includes(id)) {
            await propertyService.deleteRoomType(propId, id);
          }
        }
      } else {
        // Atomic Create
        propertyPayload.roomTypes = roomTypes.map(rt => ({
          name: rt.name,
          inventoryType: 'bed',
          roomCategory: rt.roomCategory,
          maxAdults: Number(rt.maxAdults),
          maxChildren: Number(rt.maxChildren || 0),
          bedsPerRoom: Number(rt.bedsPerRoom),
          totalInventory: Number(rt.totalInventory || 0),
          pricePerNight: Number(rt.pricePerNight),
          extraAdultPrice: Number(rt.extraAdultPrice || 0),
          extraChildPrice: Number(rt.extraChildPrice || 0),
          images: rt.images.filter(Boolean),
          amenities: rt.amenities
        }));
        const res = await propertyService.create(propertyPayload);
        propId = res.property?._id;
        setCreatedProperty(res.property);
      }
      localStorage.removeItem(STORAGE_KEY);
      setStep(10);
    } catch (e) {
      setError(e?.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      navigate(-1);
    }
  };

  const clearCurrentStep = () => {
    if (!window.confirm("Clear all fields in this step?")) return;
    if (step === 1) {
      setPropertyForm(prev => ({ ...prev, propertyName: '', description: '', shortDescription: '' }));
    } else if (step === 2) {
      updatePropertyForm('address', { country: 'India', state: '', city: '', area: '', fullAddress: '', pincode: '' });
      updatePropertyForm(['location', 'coordinates'], ['', '']);
    } else if (step === 3) {
      updatePropertyForm('amenities', []);
    } else if (step === 4) {
      updatePropertyForm('nearbyPlaces', []);
    } else if (step === 5) {
      setPropertyForm(prev => ({ ...prev, coverImage: '', propertyImages: [] }));
    } else if (step === 6) {
      setRoomTypes([]);
    } else if (step === 7) {
      setPropertyForm(prev => ({ ...prev, checkInTime: '12:00 PM', checkOutTime: '10:00 AM', cancellationPolicy: 'No refund after check-in', houseRules: [] }));
    } else if (step === 8) {
      updatePropertyForm('documents', REQUIRED_DOCS_HOSTEL.map(d => ({ type: d.type, name: d.name, fileUrl: '' })));
    }
  };

  const handleNext = () => {
    console.log('handleNext called, step:', step);
    try {
      if (step === 1) {
        console.log('Calling nextFromBasic');
        nextFromBasic();
      } else if (step === 2) {
        console.log('Calling nextFromLocation');
        nextFromLocation();
      } else if (step === 3) {
        console.log('Calling nextFromAmenities');
        nextFromAmenities();
      } else if (step === 4) {
        console.log('Calling nextFromNearbyPlaces');
        nextFromNearbyPlaces();
      } else if (step === 5) {
        console.log('Calling nextFromImages');
        nextFromImages();
      } else if (step === 6) {
        console.log('Calling nextFromRoomTypes');
        nextFromRoomTypes();
      } else if (step === 7) {
        console.log('Calling nextFromRules');
        nextFromRules();
      } else if (step === 8) {
        console.log('Calling nextFromDocuments');
        nextFromDocuments();
      } else if (step === 9) {
        console.log('Calling submitAll');
        submitAll();
      }
    } catch (err) {
      console.error('Error in handleNext:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Basic Info';
      case 2: return 'Location';
      case 3: return 'Amenities';
      case 4: return 'Nearby Places';
      case 5: return 'Images';
      case 6: return 'Bed Inventory';
      case 7: return 'House Rules';
      case 8: return 'Documents';
      case 9: return 'Review & Submit';
      default: return '';
    }
  };

  const isEditingSubItem = (step === 4 && editingNearbyIndex !== null) || (step === 6 && editingRoomType !== null);

  const handleExit = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="text-sm font-bold text-gray-900">
          {step <= 9 ? `Step ${step} of 9` : 'Registration Complete'}
        </div>
        <button onClick={handleExit} className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <X size={20} />
        </button>
      </header>

      <div className="w-full h-1 bg-gray-200 sticky top-16 z-20">
        <div className="h-full bg-emerald-600 transition-all duration-500 ease-out" style={{ width: `${(step / 9) * 100}%` }} />
      </div>

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{getStepTitle()}</h1>
        </div>

        <div className="bg-white md:p-6 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Hostel Name *</label>
                  <input
                    className={`input w-full ${fieldErrors.propertyName ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="e.g. UrbanStay Boys Hostel"
                    value={propertyForm.propertyName}
                    onChange={e => updatePropertyForm('propertyName', e.target.value)}
                  />
                  {fieldErrors.propertyName && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.propertyName}</span>}
                  {!fieldErrors.propertyName && propertyForm.propertyName && <span className="text-xs font-semibold text-green-600">✓ Valid</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Property Type</label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-500 font-semibold rounded-xl text-sm">
                      Hostel
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Hostel Type *</label>
                    <div className="relative">
                      <select
                        className="input appearance-none bg-white pr-10"
                        value={propertyForm.hostelType}
                        onChange={e => updatePropertyForm('hostelType', e.target.value)}
                      >
                        <option value="boys">Boys</option>
                        <option value="girls">Girls</option>
                        <option value="mixed">Mixed</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronLeft size={16} className="-rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Short Description * ({propertyForm.shortDescription.length}/200)</label>
                  <textarea
                    className={`input w-full ${fieldErrors.shortDescription ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Brief summary (e.g. Affordable student accommodation near campus...)"
                    value={propertyForm.shortDescription}
                    onChange={e => updatePropertyForm('shortDescription', e.target.value)}
                  />
                  {fieldErrors.shortDescription && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.shortDescription}</span>}
                  {!fieldErrors.shortDescription && propertyForm.shortDescription && <span className="text-xs font-semibold text-green-600">✓ Valid</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Detailed Description ({propertyForm.description.length}/2000)</label>
                  <textarea
                    className={`input w-full min-h-[100px] ${fieldErrors.description ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="Tell guests about your hostel, facilities, and neighborhood..."
                    value={propertyForm.description}
                    onChange={e => updatePropertyForm('description', e.target.value)}
                  />
                  {fieldErrors.description && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.description}</span>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Contact Number * (10 digits)</label>
                  <input
                    className={`input w-full ${fieldErrors.contactNumber ? 'border-red-300 bg-red-50' : ''}`}
                    placeholder="e.g. 9876543210"
                    inputMode="numeric"
                    maxLength="10"
                    value={propertyForm.contactNumber}
                    onChange={e => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      updatePropertyForm('contactNumber', numericOnly);
                    }}
                  />
                  {fieldErrors.contactNumber && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.contactNumber}</span>}
                  {!fieldErrors.contactNumber && propertyForm.contactNumber && <span className="text-xs font-semibold text-green-600">✓ Valid</span>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Search Location</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Search size={18} />
                  </div>
                  <input
                    className="input pl-12"
                    placeholder="Search for area, street, or landmark..."
                    value={locationSearchQuery}
                    onChange={e => {
                      setLocationSearchQuery(e.target.value);
                      if (e.target.value.length > 2) searchLocationForAddress();
                    }}
                  />
                </div>
                {locationResults.length > 0 && (
                  <div className="absolute z-10 w-full md:w-[600px] mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {locationResults.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { selectLocationResult(p); setLocationResults([]); setLocationSearchQuery(''); }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                        <div className="text-xs text-gray-500 truncate">{p.display_name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-4 my-2">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or Enter Manually</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Country *</label>
                  <input 
                    className={`input ${fieldErrors.country ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.country} 
                    onChange={e => {
                      const alphabetOnly = e.target.value.replace(/[^a-zA-Z\s\-]/g, '');
                      updatePropertyForm(['address', 'country'], alphabetOnly);
                    }}
                  />
                  {fieldErrors.country && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.country}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">State / Province *</label>
                  <input 
                    className={`input ${fieldErrors.state ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.state} 
                    onChange={e => {
                      const alphabetOnly = e.target.value.replace(/[^a-zA-Z\s\-]/g, '');
                      updatePropertyForm(['address', 'state'], alphabetOnly);
                    }}
                  />
                  {fieldErrors.state && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.state}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">City *</label>
                  <input 
                    className={`input ${fieldErrors.city ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.city} 
                    onChange={e => {
                      const alphabetOnly = e.target.value.replace(/[^a-zA-Z\s\-]/g, '');
                      updatePropertyForm(['address', 'city'], alphabetOnly);
                    }}
                  />
                  {fieldErrors.city && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.city}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Area / Sector *</label>
                  <input 
                    className={`input ${fieldErrors.area ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.area} 
                    onChange={e => updatePropertyForm(['address', 'area'], e.target.value)} 
                  />
                  {fieldErrors.area && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.area}</span>}
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Full Street Address *</label>
                  <input 
                    className={`input ${fieldErrors.fullAddress ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.fullAddress} 
                    onChange={e => updatePropertyForm(['address', 'fullAddress'], e.target.value)} 
                  />
                  {fieldErrors.fullAddress && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.fullAddress}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Pincode / Zip * (6 digits)</label>
                  <input 
                    className={`input ${fieldErrors.pincode ? 'border-red-300 bg-red-50' : ''}`}
                    value={propertyForm.address.pincode}
                    inputMode="numeric"
                    maxLength="6"
                    onChange={e => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                      updatePropertyForm(['address', 'pincode'], numericOnly);
                    }}
                  />
                  {fieldErrors.pincode && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.pincode}</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={loadingLocation}
                className="w-full py-4 border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loadingLocation ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Fetching Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin size={20} />
                    <span>Use Current Location</span>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
              
              <div className="grid grid-cols-2 gap-3">
                {HOSTEL_AMENITIES.map(item => {
                  const isSelected = propertyForm.amenities.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        const updated = isSelected
                          ? propertyForm.amenities.filter(a => a !== item.name)
                          : [...propertyForm.amenities, item.name];
                        updatePropertyForm('amenities', updated);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-gray-200 hover:border-emerald-200 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                        {isSelected ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                      </div>
                      <div className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{item.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              {!isEditingSubItem && (
                <div className="space-y-3">
                  {propertyForm.nearbyPlaces.map((place, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-emerald-200 transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{place.name}</div>
                          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            {place.type} • <span className="text-emerald-600">{place.distanceKm} km</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditNearbyPlace(idx)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNearbyPlace(idx)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {propertyForm.nearbyPlaces.length === 0 && (
                    <div className="text-center py-10 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MapPin size={24} />
                      </div>
                      <p className="text-gray-500 font-medium">No nearby places added yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add tourist spots, transport hubs, etc.</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startAddNearbyPlace}
                    disabled={propertyForm.nearbyPlaces.length >= 5}
                    className="w-full py-4 border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={20} />
                    Add Nearby Place
                  </button>
                </div>
              )}

              {isEditingSubItem && (
                <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-sm">
                      {editingNearbyIndex === -1 ? 'Add New Place' : 'Edit Place'}
                    </span>
                    <button onClick={cancelEditNearbyPlace} className="text-emerald-600 hover:bg-emerald-100 p-1 rounded-md">
                      <span className="text-xs font-bold">Close</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    <div className="relative">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Search Place</label>
                      <div className="flex gap-2">
                        <input
                          className="input w-full"
                          placeholder="Type to search..."
                          value={nearbySearchQuery}
                          onChange={e => setNearbySearchQuery(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={searchNearbyPlaces}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl font-semibold text-sm"
                        >
                          Search
                        </button>
                      </div>
                      {nearbyResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {nearbyResults.slice(0, 6).map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectNearbyPlace(p)}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-0 text-sm"
                            >
                              <div className="font-semibold text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500 truncate">{p.address || p.formatted_address}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Name * ({tempNearbyPlace.name.length}/100)</label>
                        <input 
                          className={`input w-full ${fieldErrors.tempNearbyPlace?.name ? 'border-red-300 bg-red-50' : ''}`}
                          value={tempNearbyPlace.name} 
                          onChange={e => {
                            setTempNearbyPlace({ ...tempNearbyPlace, name: e.target.value });
                            updateFieldError(['tempNearbyPlace', 'name'], validateNearbyPlaceName(e.target.value));
                          }} 
                        />
                        {fieldErrors.tempNearbyPlace?.name && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.tempNearbyPlace.name}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500">Type</label>
                          <select 
                            className="input w-full appearance-none" 
                            value={tempNearbyPlace.type} 
                            onChange={e => setTempNearbyPlace({ ...tempNearbyPlace, type: e.target.value })}
                          >
                            <option value="tourist">Tourist Attraction</option>
                            <option value="airport">Airport</option>
                            <option value="market">Market</option>
                            <option value="railway">Railway Station</option>
                            <option value="bus_stop">Bus Stop</option>
                            <option value="hospital">Hospital</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500">Distance (km) *</label>
                          <input 
                            className={`input w-full ${fieldErrors.tempNearbyPlace?.distanceKm ? 'border-red-300 bg-red-50' : ''}`}
                            type="number" 
                            value={tempNearbyPlace.distanceKm} 
                            onChange={e => {
                              setTempNearbyPlace({ ...tempNearbyPlace, distanceKm: e.target.value });
                              updateFieldError(['tempNearbyPlace', 'distanceKm'], validateDistance(e.target.value));
                            }} 
                          />
                          {fieldErrors.tempNearbyPlace?.distanceKm && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.tempNearbyPlace.distanceKm}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={cancelEditNearbyPlace} className="flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                      <button type="button" onClick={saveNearbyPlace} className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all transform active:scale-95">Save Place</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
              
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Main Cover Image</label>
                <div
                  onClick={() => !uploading && (isFlutter ? handleCameraUpload('cover', u => updatePropertyForm('coverImage', u)) : coverImageFileInputRef.current?.click())}
                  className={`relative w-full aspect-video sm:aspect-[21/9] rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer group transition-all ${propertyForm.coverImage ? 'border-transparent' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/10'}`}
                >
                  {uploading === 'cover' ? (
                    <div className="flex flex-col items-center justify-center h-full text-emerald-600 gap-2">
                      <Loader2 className="animate-spin" size={32} />
                      <span className="text-sm font-bold">Uploading...</span>
                    </div>
                  ) : propertyForm.coverImage ? (
                    <>
                      <img src={propertyForm.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold flex items-center gap-2 border border-white/50 px-4 py-2 rounded-full backdrop-blur-md bg-white/10"><Image size={18} /> Change Cover</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); updatePropertyForm('coverImage', ''); }} className="absolute top-3 right-3 p-2 bg-white text-red-600 rounded-full shadow-lg z-10 hover:bg-red-50"><Trash2 size={16} /></button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <Image size={32} />
                      </div>
                      <span className="font-bold text-gray-600">{isFlutter ? 'Take/Upload Cover Image' : 'Upload Cover Image'}</span>
                      <span className="text-xs text-gray-400 mt-1">High quality landscape photo</span>
                    </div>
                  )}
                  <input ref={coverImageFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => uploadImages(e.target.files, 'cover', u => updatePropertyForm('coverImage', u[0]))} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gallery ({propertyForm.propertyImages.length})</label>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500">Min 4 images</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {propertyForm.propertyImages.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      <button type="button" onClick={() => handleRemoveImage(img, 'gallery', i)} className="absolute top-1 right-1 p-1.5 bg-white text-red-600 rounded-lg shadow-md z-10 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button
                    onClick={() => isFlutter ? handleCameraUpload('gallery', u => updatePropertyForm('propertyImages', [...propertyForm.propertyImages, ...u])) : propertyImagesFileInputRef.current?.click()}
                    disabled={!!uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:bg-emerald-50/20 hover:text-emerald-600 transition-all"
                  >
                    {uploading === 'gallery' ? <Loader2 className="animate-spin text-emerald-600" size={24} /> : (isFlutter ? <Camera size={24} /> : <Plus size={24} />)}
                  </button>
                  <input ref={propertyImagesFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => uploadImages(e.target.files, 'gallery', u => updatePropertyForm('propertyImages', [...propertyForm.propertyImages, ...u]))} />
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              {!isEditingSubItem && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Manage your hostel inventory (Beds/Rooms).</p>
                  </div>

                  <div className="grid gap-3">
                    {roomTypes.length === 0 ? (
                      <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bed size={24} />
                        </div>
                        <p className="text-gray-500 font-medium">No inventory added yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add beds, dorms or private rooms</p>
                      </div>
                    ) : (
                      roomTypes.map((rt, index) => (
                        <div key={rt.id} className="p-4 border border-gray-200 rounded-2xl bg-white group hover:border-emerald-200 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                {rt.images?.[0] ? (
                                  <img src={rt.images[0]} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400"><Bed size={20} /></div>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-lg">{rt.name}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{rt.roomCategory}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-gray-900">₹{rt.pricePerNight}</span>
                                  <span className="text-xs">/ night</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">Beds: {rt.bedsPerRoom}</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">Inventory: {rt.totalInventory}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => startEditRoomType(index)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                <FileText size={16} />
                              </button>
                              <button onClick={() => deleteRoomType(index)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={startAddRoomType}
                    className="w-full py-4 border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
                  >
                    <Plus size={20} /> Add Inventory
                  </button>
                </div>
              )}

              {editingRoomType && (
                <div className="bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-sm">
                      {editingRoomTypeIndex === -1 ? 'Add Inventory' : 'Edit Inventory'}
                    </span>
                    <button onClick={cancelEditRoomType} className="text-emerald-600 hover:bg-emerald-100 p-1 rounded-md">
                      <span className="text-xs font-bold">Close</span>
                    </button>
                  </div>

                  <div className="p-4 space-y-5">
                    <div className="p-1 bg-gray-100 rounded-xl flex">
                      <button onClick={() => setEditingRoomType({ ...editingRoomType, roomCategory: 'shared' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingRoomType.roomCategory === 'shared' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Shared Dorm</button>
                      <button onClick={() => setEditingRoomType({ ...editingRoomType, roomCategory: 'private' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingRoomType.roomCategory === 'private' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Private Room</button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Name * ({editingRoomType.name.length}/100)</label>
                      <input 
                        className={`input ${fieldErrors.editingRoomType?.name ? 'border-red-300 bg-red-50' : ''}`}
                        placeholder="e.g. 4 Sharing Air Conditioned Dorm" 
                        value={editingRoomType.name} 
                        onChange={e => {
                          setEditingRoomType({ ...editingRoomType, name: e.target.value });
                          updateFieldError(['editingRoomType', 'name'], validateRoomName(e.target.value));
                        }} 
                      />
                      {fieldErrors.editingRoomType?.name && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.editingRoomType.name}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Price per Night (₹) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                          <input 
                            className={`input pl-10 ${fieldErrors.editingRoomType?.pricePerNight ? 'border-red-300 bg-red-50' : ''}`}
                            type="number" 
                            placeholder="  0" 
                            value={editingRoomType.pricePerNight} 
                            onChange={e => {
                              setEditingRoomType({ ...editingRoomType, pricePerNight: e.target.value });
                              updateFieldError(['editingRoomType', 'pricePerNight'], validatePrice(e.target.value));
                            }} 
                          />
                        </div>
                        {fieldErrors.editingRoomType?.pricePerNight && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.editingRoomType.pricePerNight}</span>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Units/Inventory *</label>
                        <input 
                          className={`input ${fieldErrors.editingRoomType?.totalInventory ? 'border-red-300 bg-red-50' : ''}`}
                          type="number" 
                          placeholder="1" 
                          value={editingRoomType.totalInventory} 
                          onChange={e => {
                            setEditingRoomType({ ...editingRoomType, totalInventory: e.target.value });
                            updateFieldError(['editingRoomType', 'totalInventory'], validateInventoryCount(e.target.value, 'Units'));
                          }} 
                        />
                        {fieldErrors.editingRoomType?.totalInventory && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.editingRoomType.totalInventory}</span>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Beds per Room *</label>
                        <input 
                          className={`input ${fieldErrors.editingRoomType?.bedsPerRoom ? 'border-red-300 bg-red-50' : ''}`}
                          type="number" 
                          placeholder="1" 
                          value={editingRoomType.bedsPerRoom} 
                          onChange={e => {
                            setEditingRoomType({ ...editingRoomType, bedsPerRoom: e.target.value });
                            updateFieldError(['editingRoomType', 'bedsPerRoom'], validateInventoryCount(e.target.value, 'Beds per room'));
                          }} 
                        />
                        {fieldErrors.editingRoomType?.bedsPerRoom && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.editingRoomType.bedsPerRoom}</span>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500">Max Adults *</label>
                        <input 
                          className={`input ${fieldErrors.editingRoomType?.maxAdults ? 'border-red-300 bg-red-50' : ''}`}
                          type="number" 
                          placeholder="1" 
                          value={editingRoomType.maxAdults} 
                          onChange={e => {
                            setEditingRoomType({ ...editingRoomType, maxAdults: e.target.value });
                            updateFieldError(['editingRoomType', 'maxAdults'], validateInventoryCount(e.target.value, 'Max adults'));
                          }} 
                        />
                        {fieldErrors.editingRoomType?.maxAdults && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.editingRoomType.maxAdults}</span>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-500">Images (Max 3)</label>
                        <span className="text-[10px] text-gray-400">{(editingRoomType.images || []).length}/3</span>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {(editingRoomType.images || []).map((img, i) => (
                          <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => handleRemoveImage(img, 'room', i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                          </div>
                        ))}
                        {(editingRoomType.images || []).length < 3 && (
                          <button type="button" onClick={() => isFlutter ? handleCameraUpload('room', url => setEditingRoomType(prev => ({ ...prev, images: [...(prev.images || []), url].slice(0, 3) }))) : roomImagesFileInputRef.current?.click()} disabled={!!uploading} className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/20 transition-all">
                            {uploading === 'room' ? <Loader2 size={20} className="animate-spin text-emerald-600" /> : <Plus size={20} />}
                          </button>
                        )}
                        <input ref={roomImagesFileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => {
                          if (e.target.files?.length) uploadImages(e.target.files, 'room', urls => urls.length && setEditingRoomType(prev => ({ ...prev, images: [...(prev.images || []), ...urls].slice(0, 3) })));
                        }} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500">Room/Bed Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {ROOM_AMENITIES.map(opt => {
                          const isSelected = editingRoomType.amenities.includes(opt.label);
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => {
                                const updated = isSelected
                                  ? editingRoomType.amenities.filter(x => x !== opt.label)
                                  : [...editingRoomType.amenities, opt.label];
                                setEditingRoomType({ ...editingRoomType, amenities: updated });
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                              <opt.icon size={12} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button onClick={cancelEditRoomType} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                      <button onClick={saveRoomType} className="flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200">{editingRoomTypeIndex === -1 ? 'Add Inventory' : 'Save Changes'}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Check-In Time *</label>
                  <div className="relative">
                    <input 
                      className={`input !pl-12 ${fieldErrors.checkInTime ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="e.g. 12:00 PM" 
                      value={propertyForm.checkInTime} 
                      onChange={e => updatePropertyForm('checkInTime', e.target.value)} 
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={18} /></div>
                  </div>
                  {fieldErrors.checkInTime && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.checkInTime}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500">Check-Out Time *</label>
                  <div className="relative">
                    <input 
                      className={`input !pl-12 ${fieldErrors.checkOutTime ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="e.g. 11:00 AM" 
                      value={propertyForm.checkOutTime} 
                      onChange={e => updatePropertyForm('checkOutTime', e.target.value)} 
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={18} /></div>
                  </div>
                  {fieldErrors.checkOutTime && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.checkOutTime}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">Cancellation Policy * ({propertyForm.cancellationPolicy.length}/500)</label>
                <textarea
                  className={`input w-full min-h-[80px] ${fieldErrors.cancellationPolicy ? 'border-red-300 bg-red-50' : ''}`}
                  placeholder="e.g. Free cancellation up to 24 hours before check-in..."
                  value={propertyForm.cancellationPolicy}
                  onChange={e => updatePropertyForm('cancellationPolicy', e.target.value)}
                />
                {fieldErrors.cancellationPolicy && <span className="text-xs font-semibold text-red-500">⚠️ {fieldErrors.cancellationPolicy}</span>}
                {!fieldErrors.cancellationPolicy && propertyForm.cancellationPolicy && <span className="text-xs font-semibold text-green-600">✓ Valid</span>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">House Rules</label>
                <textarea
                  className="input w-full min-h-[100px]"
                  placeholder="No alcohol, No guests after 9 PM..."
                  value={propertyForm.houseRules.join(', ')}
                  onChange={e =>
                    updatePropertyForm(
                      'houseRules',
                      e.target.value.split(',').map(s => s.trim())
                    )
                  }
                />
                <p className="text-xs text-gray-400">Separate rules with commas.</p>
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700">Please provide the following documents</div>
                <div className="grid gap-3">
                  {propertyForm.documents.map((doc, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-2xl bg-white hover:border-emerald-200 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-900">{doc.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">Optional document</div>
                        </div>
                        {doc.fileUrl ? (
                          <div className="bg-emerald-50 text-emerald-700 p-1.5 rounded-full"><CheckCircle size={18} /></div>
                        ) : (
                          <div className="bg-gray-100 text-gray-400 p-1.5 rounded-full"><FileText size={18} /></div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => isFlutter
                            ? handleCameraUpload(`doc_${idx}`, url => {
                              const next = [...propertyForm.documents];
                              next[idx].fileUrl = url;
                              updatePropertyForm('documents', next);
                            })
                            : documentInputRefs.current[idx]?.click()
                          }
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-bold transition-all ${doc.fileUrl
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-white hover:border-emerald-400 hover:text-emerald-600'
                            }`}
                        >
                          {uploading === `doc_${idx}` ? (
                            <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                          ) : doc.fileUrl ? (
                            <>Change File</>
                          ) : (
                            <><Plus size={16} /> Upload</>
                          )}
                        </button>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-200 hover:border-emerald-200 bg-white">
                            <Search size={18} />
                          </a>
                        )}
                      </div>

                      <input
                        type="file"
                        className="hidden"
                        ref={el => (documentInputRefs.current[idx] = el)}
                        onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          uploadImages([file], `doc_${idx}`, urls => {
                            if (urls[0]) {
                              const updated = [...propertyForm.documents];
                              updated[idx] = { ...updated[idx], fileUrl: urls[0] };
                              updatePropertyForm('documents', updated);
                            }
                          });
                          e.target.value = '';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-6">
              <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-600">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Ready to Submit!</h3>
                <p className="text-emerald-700 text-sm mt-1">Review your hostel details below.</p>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden p-4 space-y-3">
                  <div className="flex gap-4">
                    {propertyForm.coverImage ? (
                      <img src={propertyForm.coverImage} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><ImageIcon size={24} /></div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-900">{propertyForm.propertyName || 'Property Name'}</h4>
                      <p className="text-xs text-gray-500 capitalize">{propertyForm.hostelType} Hostel</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">{propertyForm.address.city}, {propertyForm.address.state}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">{propertyForm.propertyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900 capitalize">{propertyForm.hostelType} Hostel</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium text-gray-900">{propertyForm.contactNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Location
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium text-gray-900 text-right">{propertyForm.address.fullAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">City:</span>
                      <span className="font-medium text-gray-900">{propertyForm.address.city}, {propertyForm.address.state}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {propertyForm.amenities.map((am, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200">{am}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Images
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cover Image:</span>
                      <span className={`font-medium ${propertyForm.coverImage ? 'text-emerald-600' : 'text-red-600'}`}>
                        {propertyForm.coverImage ? '✓ Uploaded' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gallery Images:</span>
                      <span className={`font-medium ${propertyForm.propertyImages.filter(Boolean).length >= 4 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {propertyForm.propertyImages.filter(Boolean).length} / 4 minimum
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Inventory Summary
                  </h4>
                  <div className="space-y-2">
                    {roomTypes.map((rt, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-gray-600">{rt.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({rt.bedsPerRoom} beds, {rt.totalInventory} units)</span>
                        </div>
                        <span className="font-bold text-emerald-700">₹{rt.pricePerNight}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    House Rules
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-medium text-gray-900">{propertyForm.checkInTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-medium text-gray-900">{propertyForm.checkOutTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancellation:</span>
                      <span className="font-medium text-gray-900 text-right max-w-xs">{propertyForm.cancellationPolicy}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">✓</span>
                    Documents
                  </h4>
                  <p className="text-xs text-gray-500">{propertyForm.documents.filter(d => d.fileUrl).length} of {propertyForm.documents.length} documents uploaded.</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Please review all information carefully. Once submitted, our team will verify your details within 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="text-center py-12 space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Property Submitted!</h2>
              <p className="text-gray-500 max-w-sm mx-auto">Your hostel listing has been submitted for review. Our team will verify the details and documents within 24-48 hours.</p>
              <button
                type="button"
                onClick={() => navigate('/hotel/properties')}
                className="btn-primary"
              >
                Go to My Properties
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          {step !== 10 && (
            <button
              onClick={handleBack}
              disabled={step === 1 || loading || isEditingSubItem}
              className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
          )}

          {step < 9 && (
            <button
              onClick={clearCurrentStep}
              disabled={loading}
              className="px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50 transition-all text-sm"
            >
              Clear Step
            </button>
          )}

          {step < 10 && (
            <button
              onClick={step === 9 ? submitAll : handleNext}
              disabled={loading}
              className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {step === 9 ? 'Complete Registration' : 'Continue'}
            </button>
          )}
        </div>
      </footer>

      <style>{`
        .btn-primary { background: #004F4D; color: white; font-weight: 700; padding: 10px 16px; border-radius: 12px; transition: transform 0.1s, background 0.1s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-primary:active { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-secondary { background: white; color: #374151; font-weight: 600; padding: 10px 16px; border-radius: 12px; border: 1px solid #e5e7eb; transition: all 0.1s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
      `}</style>
    </div>
  );
};

export default AddHostelWizard;
