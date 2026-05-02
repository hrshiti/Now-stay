import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { propertyService, hotelService } from "../../../services/apiService";
import {
  CheckCircle,
  FileText,
  Home,
  Image,
  Plus,
  Trash2,
  MapPin,
  Search,
  BedDouble,
  Wifi,
  Coffee,
  Car,
  Users,
  CheckSquare,
  Snowflake,
  Tv,
  ShowerHead,
  ArrowLeft,
  ArrowRight,
  Clock,
  Loader2,
  Camera,
  X,
  Eye
} from "lucide-react";
import { isFlutterApp, openFlutterCamera } from "../../../utils/flutterBridge";
const REQUIRED_DOCS_HOMESTAY = [
  { type: "electricity_bill", name: "Electricity Bill", required: true }
];
const HOMESTAY_AMENITIES = [
  "WiFi",
  "Breakfast",
  "Local Assistance",
  "Parking",
  "Kitchen",
  "Garden",
  "Pet Friendly",
  "Power Backup"
];
const ROOM_AMENITIES = [
  { label: "AC", icon: Snowflake },
  { label: "WiFi", icon: Wifi },
  { label: "TV", icon: Tv },
  { label: "Geyser", icon: ShowerHead },
  { label: "Balcony", icon: BedDouble },
  { label: "Tea/Coffee", icon: Coffee },
  { label: "Attached Washroom", icon: CheckSquare }
];
const HOUSE_RULES_OPTIONS = ["No smoking", "No pets", "No loud music", "ID required at check-in", "Visitors not allowed"];
const AddHomestayWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingProperty = location.state?.property || null;
  const isEditMode = !!existingProperty;
  const initialStep = location.state?.initialStep || 1;
  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdProperty, setCreatedProperty] = useState(null);
  const [nearbySearchQuery, setNearbySearchQuery] = useState("");
  const [nearbyResults, setNearbyResults] = useState([]);
  const [editingNearbyIndex, setEditingNearbyIndex] = useState(null);
  const [tempNearbyPlace, setTempNearbyPlace] = useState({ name: "", type: "tourist", distanceKm: "" });
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
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
    propertyName: "",
    description: "",
    shortDescription: "",
    hostLivesOnProperty: "",
    coverImage: "",
    propertyImages: [],
    address: { country: "", state: "", city: "", area: "", fullAddress: "", pincode: "" },
    location: { type: "Point", coordinates: ["", ""] },
    nearbyPlaces: [],
    amenities: [],
    checkInTime: "",
    checkOutTime: "",
    contactNumber: "",
    cancellationPolicy: "",
    suitability: "none",
    houseRules: [],
    documents: REQUIRED_DOCS_HOMESTAY.map((d) => ({ type: d.type, name: d.name, required: d.required, fileUrl: "" }))
  });
  const [roomTypes, setRoomTypes] = useState([]);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [editingRoomTypeIndex, setEditingRoomTypeIndex] = useState(null);
  const [originalRoomTypeIds, setOriginalRoomTypeIds] = useState([]);
  const STORAGE_KEY = `rukko_homestay_wizard_draft_${existingProperty?._id || "new"}`;
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
        console.error("Failed to load homestay draft", e);
      }
    }
  }, []);
  useEffect(() => {
    if (isEditMode) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, propertyForm, roomTypes, createdProperty }));
    }, 1e3);
    return () => clearTimeout(timeout);
  }, [step, propertyForm, roomTypes, createdProperty]);
  useEffect(() => {
    try {
      const currentHash = window.location.hash;
      const targetHash = `#step${step}`;
      if (currentHash !== targetHash) {
        if (step === 1 && (!currentHash || currentHash === "#step1")) {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${targetHash}`);
        } else {
          window.history.pushState(null, "", `${window.location.pathname}${window.location.search}${targetHash}`);
        }
      }
    } catch (e) {
      console.warn("[History] Navigation failed:", e);
    }
  }, [step]);
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#step")) {
        const hashStep = parseInt(hash.replace("#step", ""), 10);
        if (!isNaN(hashStep)) {
          setStep(hashStep);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  useEffect(() => {
    setEditingRoomType(null);
    setEditingRoomTypeIndex(null);
    setEditingNearbyIndex(null);
    setError("");
  }, [step]);
  const updatePropertyForm = (path, value) => {
    setPropertyForm((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = Array.isArray(path) ? path : String(path).split(".");
      let ref = clone;
      for (let i = 0; i < keys.length - 1; i++) ref = ref[keys[i]];
      ref[keys[keys.length - 1]] = value;
      return clone;
    });
  };
  const useCurrentLocation = async () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      return;
    }
    setLoadingLocation(true);
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15e3
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const res = await hotelService.getAddressFromCoordinates(lat, lng);
      updatePropertyForm(["location", "coordinates"], [String(lng), String(lat)]);
      updatePropertyForm("address", {
        country: res.country || "",
        state: res.state || "",
        city: res.city || "",
        area: res.area || "",
        fullAddress: res.fullAddress || "",
        pincode: res.pincode || ""
      });
    } catch (err) {
      console.error("Location Error:", err);
      if (err.code === 1) {
        setError("Location permission denied. Please enable it in browser settings.");
      } else if (err.code === 2) {
        setError("Location unavailable. Check your GPS/network.");
      } else if (err.code === 3) {
        setError("Location request timed out.");
      } else {
        setError(err.message || "Failed to fetch address from coordinates");
      }
    } finally {
      setLoadingLocation(false);
    }
  };
  const searchLocationForAddress = async () => {
    try {
      setError("");
      if (!locationSearchQuery.trim()) return;
      const res = await hotelService.searchLocation(locationSearchQuery.trim());
      setLocationResults(Array.isArray(res?.results) ? res.results : []);
    } catch {
      setError("Failed to search location");
    }
  };
  const selectLocationResult = async (place) => {
    try {
      setError("");
      const lat = place.lat;
      const lng = place.lng;
      if (typeof lat !== "number" || typeof lng !== "number") return;
      const res = await hotelService.getAddressFromCoordinates(lat, lng);
      updatePropertyForm(["location", "coordinates"], [String(lng), String(lat)]);
      updatePropertyForm("address", {
        country: res.country || "",
        state: res.state || "",
        city: res.city || "",
        area: res.area || "",
        fullAddress: res.fullAddress || "",
        pincode: res.pincode || ""
      });
      setLocationResults([]);
    } catch {
      setError("Failed to use selected location");
    }
  };
  const searchNearbyPlaces = async () => {
    try {
      setError("");
      if (!nearbySearchQuery.trim()) return;
      const res = await hotelService.searchLocation(nearbySearchQuery.trim());
      setNearbyResults(Array.isArray(res?.results) ? res.results : []);
    } catch {
      setError("Failed to search places");
    }
  };
  const selectNearbyPlace = async (place) => {
    try {
      const originLat = Number(propertyForm.location.coordinates[1] || 0);
      const originLng = Number(propertyForm.location.coordinates[0] || 0);
      const destLat = place.lat;
      const destLng = place.lng;
      let km = "";
      if (originLat && originLng && destLat && destLng) {
        const distRes = await hotelService.calculateDistance(originLat, originLng, destLat, destLng);
        km = distRes?.distanceKm ? String(distRes.distanceKm) : "";
      }
      setTempNearbyPlace((prev) => ({ ...prev, name: place.name || "", distanceKm: km }));
      setNearbyResults([]);
      setNearbySearchQuery("");
    } catch {
      setTempNearbyPlace((prev) => ({ ...prev, name: place.name || "" }));
    }
  };
  const startAddNearbyPlace = () => {
    if (propertyForm.nearbyPlaces.length >= 5) {
      setError("Maximum 5 nearby places allowed");
      return;
    }
    setError("");
    setEditingNearbyIndex(-1);
    setTempNearbyPlace({ name: "", type: "tourist", distanceKm: "" });
    setNearbySearchQuery("");
    setNearbyResults([]);
  };
  const startEditNearbyPlace = (index) => {
    setError("");
    setEditingNearbyIndex(index);
    setTempNearbyPlace({ ...propertyForm.nearbyPlaces[index] });
    setNearbySearchQuery("");
    setNearbyResults([]);
  };
  const saveNearbyPlace = () => {
    if (!tempNearbyPlace.name || !tempNearbyPlace.distanceKm) {
      setError("Name and Distance are required");
      return;
    }
    const arr = [...propertyForm.nearbyPlaces];
    if (editingNearbyIndex === -1) {
      arr.push(tempNearbyPlace);
    } else {
      arr[editingNearbyIndex] = tempNearbyPlace;
    }
    updatePropertyForm("nearbyPlaces", arr);
    setEditingNearbyIndex(null);
    setEditingRoomType(null);
    setEditingRoomTypeIndex(null);
    setError("");
  };
  const deleteNearbyPlace = (index) => {
    const arr = propertyForm.nearbyPlaces.filter((_, i) => i !== index);
    updatePropertyForm("nearbyPlaces", arr);
  };
  const cancelEditNearbyPlace = () => {
    setEditingNearbyIndex(null);
    setError("");
  };
  const startAddRoomType = () => {
    setError("");
    setEditingRoomTypeIndex(-1);
    setEditingRoomType({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: "",
      inventoryType: "room",
      roomCategory: "private",
      maxAdults: "",
      maxChildren: "",
      totalInventory: "",
      pricePerNight: "",
      extraAdultPrice: "",
      extraChildPrice: "",
      images: [],
      amenities: [],
      baseAdults: "",
      baseChildren: "",
      isActive: true
    });
  };
  const startEditRoomType = (index) => {
    setError("");
    setEditingRoomTypeIndex(index);
    const rt = roomTypes[index];
    setEditingRoomType({
      ...rt,
      maxChildren: rt.maxChildren === 0 ? "" : rt.maxChildren,
      extraAdultPrice: rt.extraAdultPrice === 0 ? "" : rt.extraAdultPrice,
      extraChildPrice: rt.extraChildPrice === 0 ? "" : rt.extraChildPrice,
      pricePerNight: rt.pricePerNight === 0 ? "" : rt.pricePerNight,
      images: Array.isArray(rt.images) ? rt.images : [],
      amenities: Array.isArray(rt.amenities) ? rt.amenities : []
    });
  };
  const deleteRoomType = (index) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
    if (editingRoomTypeIndex === index) {
      setEditingRoomType(null);
      setEditingRoomTypeIndex(null);
    }
  };
  const cancelEditRoomType = () => {
    setEditingRoomType(null);
    setEditingRoomTypeIndex(null);
    setError("");
  };
  const saveRoomType = () => {
    if (!editingRoomType) return;
    if (!editingRoomType.name || !editingRoomType.pricePerNight) {
      setError("Room type name and price required");
      return;
    }
    if (Number(editingRoomType.baseAdults || 0) > Number(editingRoomType.maxAdults || 0)) {
      setError("Base Adults cannot be greater than Max Adults");
      return;
    }
    if (Number(editingRoomType.baseChildren || 0) > Number(editingRoomType.maxChildren || 0)) {
      setError("Base Children cannot be greater than Max Children");
      return;
    }
    if ((editingRoomType.images || []).filter(Boolean).length < 3) {
      setError("Please upload at least 3 images for this inventory");
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
    setEditingNearbyIndex(null);
    setError("");
  };
  const toggleRoomAmenity = (label) => {
    setEditingRoomType((prev) => {
      if (!prev) return prev;
      const has = prev.amenities.includes(label);
      return {
        ...prev,
        amenities: has ? prev.amenities.filter((a) => a !== label) : [...prev.amenities, label]
      };
    });
  };
  const changeInventoryType = (type) => {
    if (!editingRoomType) return;
    setEditingRoomType((prev) => ({
      ...prev,
      inventoryType: type,
      roomCategory: type === "entire" ? "entire" : "private",
      name: type === "entire" ? "Entire Homestay" : "Deluxe Private Room",
      maxAdults: type === "entire" ? 6 : 2,
      maxChildren: type === "entire" ? 3 : 1,
      totalInventory: type === "entire" ? 1 : 3,
      pricePerNight: type === "entire" ? 12e3 : 3500,
      amenities: []
      // reset amenities on type switch
    }));
  };
  const uploadImages = async (files, type, onDone) => {
    try {
      setUploading(type);
      const fd = new FormData();
      const fileArray = Array.from(files);
      console.log(`Processing ${fileArray.length} images...`);
      for (const file of fileArray) {
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
          throw new Error(`File ${file.name} must be an image or PDF`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is too large. Maximum 10MB allowed.`);
        }
        console.log(`Adding ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)...`);
        fd.append("images", file);
      }
      const res = await hotelService.uploadImages(fd);
      const urls = Array.isArray(res?.urls) ? res.urls : [];
      console.log("Upload done, urls:", urls);
      onDone(urls);
    } catch (err) {
      console.error("Upload failed", err);
      let msg = "Upload failed";
      if (typeof err === "string") msg = err;
      else if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      if (msg === "Network Error" || err?.response && err.response.status === 413) {
        msg = "Upload failed: File size may be too large (Max 10MB).";
      }
      setError(msg);
    } finally {
      setUploading(null);
    }
  };
  const handleRemoveImage = async (url, type, index = null) => {
    if (!url) return;
    try {
      if (url.includes("cloudinary.com") && url.includes("rukkoin")) {
        await hotelService.deleteImage(url);
      }
    } catch (err) {
      console.warn("Delete image failed:", err);
    }
    if (type === "cover") {
      updatePropertyForm("coverImage", "");
    } else if (type === "gallery") {
      const arr = [...propertyForm.propertyImages];
      arr.splice(index, 1);
      updatePropertyForm("propertyImages", arr);
    } else if (type === "room") {
      setEditingRoomType((prev) => {
        const next = [...prev.images || []];
        next.splice(index, 1);
        return { ...prev, images: next };
      });
    }
  };
  useEffect(() => {
    setIsFlutter(isFlutterApp());
  }, []);
  const handleCameraUpload = async (type, onDone) => {
    try {
      setError("");
      console.log("[Camera] Opening Flutter camera...");
      const result = await openFlutterCamera();
      setUploading(type);
      if (!result.success || !result.base64) {
        throw new Error("Camera capture failed");
      }
      console.log("[Camera] Image captured, uploading...");
      const isSingle = type === "cover" || type === "room" || type.startsWith("doc");
      const res = await hotelService.uploadImagesBase64(result.images || [result]);
      if (res && res.success && res.files && res.files.length > 0) {
        if (isSingle) {
          onDone(res.files[0].url);
        } else {
          const urls = res.files.map((f) => f.url);
          onDone(urls);
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (err) {
      console.error("[Camera] Error:", err);
      setError(err.message || "Camera capture failed");
    } finally {
      setUploading(null);
    }
  };
  useEffect(() => {
    const loadForEdit = async () => {
      if (!isEditMode || !existingProperty?._id) return;
      setLoading(true);
      setError("");
      try {
        const res = await propertyService.getDetails(existingProperty._id);
        const prop = res.property || existingProperty;
        const docs = res.documents?.documents || [];
        const rts = res.roomTypes || [];
        setCreatedProperty(prop);
        setPropertyForm({
          propertyName: prop.propertyName || "",
          description: prop.description || "",
          shortDescription: prop.shortDescription || "",
          hostLivesOnProperty: prop.hostLivesOnProperty ?? true,
          coverImage: prop.coverImage || "",
          propertyImages: prop.propertyImages || [],
          address: {
            country: prop.address?.country || "",
            state: prop.address?.state || "",
            city: prop.address?.city || "",
            area: prop.address?.area || "",
            fullAddress: prop.address?.fullAddress || "",
            pincode: prop.address?.pincode || ""
          },
          location: {
            type: "Point",
            coordinates: [
              typeof prop.location?.coordinates?.[0] === "number" ? String(prop.location.coordinates[0]) : "",
              typeof prop.location?.coordinates?.[1] === "number" ? String(prop.location.coordinates[1]) : ""
            ]
          },
          nearbyPlaces: Array.isArray(prop.nearbyPlaces) && prop.nearbyPlaces.length ? prop.nearbyPlaces.map((p) => ({
            name: p.name || "",
            type: p.type || "tourist",
            distanceKm: typeof p.distanceKm === "number" ? String(p.distanceKm) : ""
          })) : [],
          amenities: prop.amenities || [],
          checkInTime: prop.checkInTime || "",
          checkOutTime: prop.checkOutTime || "",
          cancellationPolicy: prop.cancellationPolicy || "",
          houseRules: prop.houseRules || [],
          contactNumber: prop.contactNumber || "",
          suitability: prop.suitability || "none",
          documents: docs.length ? docs.map((d) => ({ type: d.type || d.name, name: d.name, fileUrl: d.fileUrl || "", required: REQUIRED_DOCS_HOMESTAY.find((rd) => rd.type === (d.type || d.name))?.required || false })) : REQUIRED_DOCS_HOMESTAY.map((d) => ({ type: d.type, name: d.name, required: d.required, fileUrl: "" }))
        });
        if (rts.length) {
          setRoomTypes(rts.map((rt) => ({
            id: rt._id,
            backendId: rt._id,
            name: rt.name,
            inventoryType: rt.inventoryType || "room",
            roomCategory: rt.roomCategory || "private",
            maxAdults: rt.maxAdults ?? 1,
            maxChildren: rt.maxChildren ?? 0,
            totalInventory: rt.totalInventory ?? 1,
            pricePerNight: rt.pricePerNight ?? "",
            extraAdultPrice: rt.extraAdultPrice ?? 0,
            extraChildPrice: rt.extraChildPrice ?? 0,
            images: rt.images || [],
            amenities: rt.amenities || [],
            isActive: rt.isActive ?? true
          })));
          setOriginalRoomTypeIds(rts.map((rt) => rt._id));
        } else {
          setOriginalRoomTypeIds([]);
        }
      } catch (e) {
        setError(e?.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    loadForEdit();
  }, [isEditMode, existingProperty]);
  const nextFromBasic = () => {
    setError("");
    if (!propertyForm.propertyName || !propertyForm.shortDescription) {
      setError("Property Name and Short Description required");
      return;
    }
    setStep(2);
  };
  const nextFromLocation = () => {
    setError("");
    if (!propertyForm.address.fullAddress || !propertyForm.address.city || !propertyForm.location.coordinates[0]) {
      setError("Full Address and Map Location are required");
      return;
    }
    setStep(3);
  };
  const nextFromAmenities = () => {
    setError("");
    if (propertyForm.amenities.length === 0) {
      setError("Please select at least one amenity");
      return;
    }
    setStep(4);
  };
  const nextFromNearby = () => {
    setError("");
    if (propertyForm.nearbyPlaces.length < 1) {
      setError("Please add at least 1 nearby place");
      return;
    }
    setStep(5);
  };
  const nextFromImages = () => {
    setError("");
    if (!propertyForm.coverImage) {
      setError("Cover image is required");
      return;
    }
    if (propertyForm.propertyImages.length < 4) {
      setError("Please upload at least 4 property images");
      return;
    }
    setStep(6);
  };
  const nextFromRoomTypes = () => {
    setError("");
    if (!roomTypes.length) {
      setError("Please add at least one inventory type (Room or Entire Place)");
      return;
    }
    setStep(7);
  };
  const nextFromRules = () => {
    setError("");
    if (!propertyForm.checkInTime || !propertyForm.checkOutTime) {
      setError("Check-in and Check-out times required");
      return;
    }
    if (!propertyForm.cancellationPolicy) {
      setError("Cancellation Policy required");
      return;
    }
    setStep(8);
  };
  const nextFromDocs = () => {
    setError("");
    const missing = propertyForm.documents.filter((d) => d.required && !d.fileUrl);
    if (missing.length > 0) {
      setError(`Please upload required documents: ${missing.map((d) => d.name).join(", ")}`);
      return;
    }
    setStep(9);
  };
  const submitAll = async () => {
    setLoading(true);
    setError("");
    try {
      const searchParams = new URLSearchParams(location.search);
      const queryType = searchParams.get("type");
      const propertyPayload = {
        propertyType: queryType || "homestay",
        propertyTemplate: "homestay",
        propertyName: propertyForm.propertyName,
        contactNumber: propertyForm.contactNumber,
        description: propertyForm.description,
        shortDescription: propertyForm.shortDescription,
        hostLivesOnProperty: propertyForm.hostLivesOnProperty,
        coverImage: propertyForm.coverImage,
        propertyImages: propertyForm.propertyImages.filter(Boolean),
        address: propertyForm.address,
        location: {
          type: "Point",
          coordinates: [Number(propertyForm.location.coordinates[0]), Number(propertyForm.location.coordinates[1])]
        },
        nearbyPlaces: propertyForm.nearbyPlaces.map((p) => ({
          name: p.name,
          type: p.type,
          distanceKm: Number(p.distanceKm || 0)
        })),
        amenities: propertyForm.amenities,
        checkInTime: propertyForm.checkInTime,
        checkOutTime: propertyForm.checkOutTime,
        cancellationPolicy: propertyForm.cancellationPolicy,
        suitability: propertyForm.suitability,
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
            inventoryType: rt.inventoryType,
            roomCategory: rt.roomCategory,
            baseAdults: Number(rt.baseAdults || 0),
            baseChildren: Number(rt.baseChildren || 0),
            maxAdults: Number(rt.maxAdults),
            maxChildren: Number(rt.maxChildren || 0),
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
          if (!persistedIds.includes(id)) await propertyService.deleteRoomType(propId, id);
        }
      } else {
        propertyPayload.roomTypes = roomTypes.map((rt) => ({
          name: rt.name,
          inventoryType: rt.inventoryType,
          roomCategory: rt.roomCategory,
          baseAdults: Number(rt.baseAdults || 0),
          baseChildren: Number(rt.baseChildren || 0),
          maxAdults: Number(rt.maxAdults),
          maxChildren: Number(rt.maxChildren || 0),
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
      setError(e?.message || "Failed to submit homestay");
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    setError("");
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
      setPropertyForm((prev) => ({ ...prev, propertyName: "", description: "", shortDescription: "", hostLivesOnProperty: true }));
    } else if (step === 2) {
      updatePropertyForm("address", { country: "India", state: "Goa", city: "", area: "", fullAddress: "", pincode: "" });
      updatePropertyForm(["location", "coordinates"], ["", ""]);
    } else if (step === 3) {
      updatePropertyForm("amenities", []);
    } else if (step === 4) {
      updatePropertyForm("nearbyPlaces", []);
    } else if (step === 5) {
      setPropertyForm((prev) => ({ ...prev, coverImage: "", propertyImages: [] }));
    } else if (step === 6) {
      setRoomTypes([]);
      setEditingRoomType(null);
      setEditingRoomTypeIndex(null);
    } else if (step === 7) {
      setPropertyForm((prev) => ({ ...prev, checkInTime: "12:00 PM", checkOutTime: "11:00 AM", cancellationPolicy: "", houseRules: [] }));
    } else if (step === 8) {
      updatePropertyForm("documents", REQUIRED_DOCS_HOMESTAY.map((d) => ({ type: d.type, name: d.name, fileUrl: "" })));
    }
  };
  const handleNext = () => {
    if (loading) return;
    switch (step) {
      case 1:
        nextFromBasic();
        break;
      case 2:
        nextFromLocation();
        break;
      case 3:
        nextFromAmenities();
        break;
      case 4:
        nextFromNearby();
        break;
      case 5:
        nextFromImages();
        break;
      case 6:
        nextFromRoomTypes();
        break;
      case 7:
        nextFromRules();
        break;
      case 8:
        nextFromDocs();
        break;
      case 9:
        submitAll();
        break;
      default:
        break;
    }
  };
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Basic Info";
      case 2:
        return "Location";
      case 3:
        return "Homestay Amenities";
      case 4:
        return "Nearby Places";
      case 5:
        return "Property Images";
      case 6:
        return "Inventory Setup";
      case 7:
        return "House Rules";
      case 8:
        return "Documents";
      case 9:
        return "Review & Submit";
      default:
        return "";
    }
  };
  const isEditingSubItem = step === 4 && editingNearbyIndex !== null || step === 6 && editingRoomType !== null;
  const handleExit = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate(-1);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 flex flex-col font-sans" }, /* @__PURE__ */ React.createElement("header", { className: "h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm" }, /* @__PURE__ */ React.createElement("button", { onClick: handleBack, className: "p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-gray-900" }, step <= 9 ? `Step ${step} of 9` : "Registration Complete"), /* @__PURE__ */ React.createElement("button", { onClick: handleExit, className: "p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" }, /* @__PURE__ */ React.createElement(X, { size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "w-full h-1 bg-gray-200 sticky top-16 z-20" }, /* @__PURE__ */ React.createElement("div", { className: "h-full bg-emerald-600 transition-all duration-500 ease-out", style: { width: `${step / 9 * 100}%` } })), /* @__PURE__ */ React.createElement("main", { className: "flex-1 w-full max-w-2xl mx-auto p-4 md:p-6 pb-32" }, /* @__PURE__ */ React.createElement("div", { className: "mb-6" }, /* @__PURE__ */ React.createElement("h1", { className: "text-2xl font-extrabold text-gray-900 mb-2" }, getStepTitle())), /* @__PURE__ */ React.createElement("div", { className: "bg-white md:p-6 md:rounded-2xl md:shadow-sm md:border md:border-gray-100 space-y-6" }, step === 1 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Homestay Name"), /* @__PURE__ */ React.createElement("input", { className: "input w-full", placeholder: "e.g. Grandma's Heritage Home", value: propertyForm.propertyName, onChange: (e) => updatePropertyForm("propertyName", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Description"), /* @__PURE__ */ React.createElement("textarea", { className: "input w-full", placeholder: "Brief summary (e.g. Private rooms in a heritage house)...", value: propertyForm.shortDescription, onChange: (e) => updatePropertyForm("shortDescription", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "hidden" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Detailed Description"), /* @__PURE__ */ React.createElement("textarea", { className: "input w-full min-h-[100px]", placeholder: "Tell guests about your home, the neighborhood, and what to expect...", value: propertyForm.description, onChange: (e) => updatePropertyForm("description", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "pt-2" }, /* @__PURE__ */ React.createElement("label", { className: `flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-all ${propertyForm.hostLivesOnProperty ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500" : "bg-gray-50 border-gray-200 hover:bg-white"}` }, /* @__PURE__ */ React.createElement("div", { className: `w-5 h-5 rounded flex items-center justify-center border ${propertyForm.hostLivesOnProperty ? "bg-emerald-600 border-transparent text-white" : "bg-white border-gray-300"}` }, propertyForm.hostLivesOnProperty && /* @__PURE__ */ React.createElement(CheckCircle, { size: 14 })), /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: propertyForm.hostLivesOnProperty, onChange: (e) => updatePropertyForm("hostLivesOnProperty", e.target.checked), className: "hidden" }), /* @__PURE__ */ React.createElement("span", { className: `text-sm font-bold ${propertyForm.hostLivesOnProperty ? "text-emerald-900" : "text-gray-700"}` }, "Host Lives on Property"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Contact Number (For Guest Inquiries)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      className: "input w-full",
      placeholder: "9876543210",
      value: propertyForm.contactNumber,
      onChange: (e) => {
        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
        updatePropertyForm("contactNumber", digitsOnly);
      },
      maxLength: 10
    }
  ), propertyForm.contactNumber && propertyForm.contactNumber.length === 10 && (/^[6-9]\d{9}$/.test(propertyForm.contactNumber) ? /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), " Valid mobile number") : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0"), " Mobile number must start with 6, 7, 8, or 9")), propertyForm.contactNumber && propertyForm.contactNumber.length > 0 && propertyForm.contactNumber.length < 10 && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 font-medium mt-1" }, 10 - propertyForm.contactNumber.length, " more digit(s) required")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 mb-1 block" }, "Suitability"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "input w-full appearance-none",
      value: propertyForm.suitability,
      onChange: (e) => updatePropertyForm("suitability", e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "none" }, "None"),
    /* @__PURE__ */ React.createElement("option", { value: "Couple Friendly" }, "Couple Friendly"),
    /* @__PURE__ */ React.createElement("option", { value: "Family Friendly" }, "Family Friendly"),
    /* @__PURE__ */ React.createElement("option", { value: "Both" }, "Both")
  )))), step === 2 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400" }, /* @__PURE__ */ React.createElement(Search, { size: 18 })), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "input pl-11",
      placeholder: "Search for your address...",
      value: locationSearchQuery,
      onChange: (e) => {
        setLocationSearchQuery(e.target.value);
        if (e.target.value.length > 2) searchLocationForAddress();
      }
    }
  ), locationResults.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full mt-2 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto" }, locationResults.map((r, i) => /* @__PURE__ */ React.createElement("button", { key: i, type: "button", onClick: () => selectLocationResult(r), className: "w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 text-sm transition-colors last:border-0" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-800" }, r.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 truncate" }, r.formatted_address))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-200 flex-1" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-semibold text-gray-400 uppercase tracking-wider" }, "Or Enter Manually"), /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-200 flex-1" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "Country", value: propertyForm.address.country, onChange: (e) => updatePropertyForm(["address", "country"], e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "State/Province", value: propertyForm.address.state, onChange: (e) => updatePropertyForm(["address", "state"], e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "City", value: propertyForm.address.city, onChange: (e) => updatePropertyForm(["address", "city"], e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "Area / Sector", value: propertyForm.address.area, onChange: (e) => updatePropertyForm(["address", "area"], e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "input col-span-2", placeholder: "Full Street Address", value: propertyForm.address.fullAddress, onChange: (e) => updatePropertyForm(["address", "fullAddress"], e.target.value) }), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "Pincode / Zip", maxLength: 6, value: propertyForm.address.pincode, onChange: (e) => updatePropertyForm(["address", "pincode"], e.target.value.replace(/\D/g, "")) })), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: useCurrentLocation,
      disabled: loadingLocation,
      className: "w-full py-4 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
    },
    loadingLocation ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 18 }), /* @__PURE__ */ React.createElement("span", null, "Fetching Location...")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(MapPin, { size: 18 }), /* @__PURE__ */ React.createElement("span", null, "Use Current Location"))
  ))), step === 3 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, HOMESTAY_AMENITIES.map((am) => {
    const isSelected = propertyForm.amenities.includes(am);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: am,
        type: "button",
        onClick: () => {
          const has = propertyForm.amenities.includes(am);
          updatePropertyForm("amenities", has ? propertyForm.amenities.filter((x) => x !== am) : [...propertyForm.amenities, am]);
        },
        className: `p-4 rounded-xl border transition-all flex items-center gap-3 text-left ${isSelected ? "bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500" : "bg-white border-gray-200 hover:bg-gray-50"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: `w-5 h-5 rounded-full flex items-center justify-center border ${isSelected ? "bg-emerald-600 border-transparent text-white" : "border-gray-300 bg-white"}` }, isSelected && /* @__PURE__ */ React.createElement(CheckCircle, { size: 12 })),
      /* @__PURE__ */ React.createElement("span", { className: `text-sm font-semibold ${isSelected ? "text-emerald-900" : "text-gray-700"}` }, am)
    );
  }))), step === 4 && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), !isEditingSubItem && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, propertyForm.nearbyPlaces.map((place, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-emerald-200 transition-colors shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(MapPin, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900" }, place.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 font-medium uppercase tracking-wide" }, place.type, " \u2022 ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-600" }, place.distanceKm, " km")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => startEditNearbyPlace(idx),
      className: "p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React.createElement(FileText, { size: 18 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => deleteNearbyPlace(idx),
      className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    },
    /* @__PURE__ */ React.createElement(Trash2, { size: 18 })
  )))), propertyForm.nearbyPlaces.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-center py-10 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3" }, /* @__PURE__ */ React.createElement(MapPin, { size: 24 })), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 font-medium" }, "No nearby places added yet"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Add tourist spots, transport hubs, etc.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: startAddNearbyPlace,
      disabled: propertyForm.nearbyPlaces.length >= 5,
      className: "w-full py-4 border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 20 }),
    "Add Nearby Place"
  )), isEditingSubItem && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-800 text-sm" }, editingNearbyIndex === -1 ? "Add New Place" : "Edit Place"), /* @__PURE__ */ React.createElement("button", { onClick: cancelEditNearbyPlace, className: "text-emerald-600 hover:bg-emerald-100 p-1 rounded-md" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold" }, "Close"))), /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 mb-1 block" }, "Search Place"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "input w-full",
      placeholder: "Type to search...",
      value: nearbySearchQuery,
      onChange: (e) => setNearbySearchQuery(e.target.value)
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: searchNearbyPlaces,
      className: "px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold text-sm"
    },
    "Search"
  )), nearbyResults.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto" }, nearbyResults.slice(0, 6).map((p, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i,
      type: "button",
      onClick: () => selectNearbyPlace(p),
      className: "w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-0 text-sm"
    },
    /* @__PURE__ */ React.createElement("div", { className: "font-semibold text-gray-900" }, p.name),
    /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 truncate" }, p.address || p.formatted_address)
  )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 pt-2 border-t border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "input w-full", value: tempNearbyPlace.name, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Type"), /* @__PURE__ */ React.createElement("select", { className: "input w-full appearance-none", value: tempNearbyPlace.type, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, type: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "tourist" }, "Tourist Attraction"), /* @__PURE__ */ React.createElement("option", { value: "airport" }, "Airport"), /* @__PURE__ */ React.createElement("option", { value: "market" }, "Market"), /* @__PURE__ */ React.createElement("option", { value: "railway" }, "Railway Station"), /* @__PURE__ */ React.createElement("option", { value: "bus_stop" }, "Bus Stop"), /* @__PURE__ */ React.createElement("option", { value: "hospital" }, "Hospital"), /* @__PURE__ */ React.createElement("option", { value: "restaurant" }, "Restaurant"), /* @__PURE__ */ React.createElement("option", { value: "other" }, "Other"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Distance (km)"), /* @__PURE__ */ React.createElement("input", { className: "input w-full", type: "number", value: tempNearbyPlace.distanceKm, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, distanceKm: e.target.value.replace(/^0+(?!$)/, "") }) })))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: cancelEditNearbyPlace, className: "flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: saveNearbyPlace, className: "flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all transform active:scale-95" }, "Save Place"))))), step === 5 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Main Cover Image"), /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => !uploading && (isFlutter ? handleCameraUpload("cover", (u) => updatePropertyForm("coverImage", u)) : coverImageFileInputRef.current?.click()),
      className: `relative w-full aspect-video sm:aspect-[21/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${propertyForm.coverImage ? "border-transparent" : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/10"}`
    },
    uploading === "cover" ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-2 text-emerald-600" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold" }, "Uploading Cover...")) : propertyForm.coverImage ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { src: propertyForm.coverImage, className: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold text-sm bg-white/20 backdrop-blur-md px-4 py-2 rounded-full" }, "Change Cover")), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: (e) => {
      e.stopPropagation();
      handleRemoveImage(propertyForm.coverImage, "cover");
    }, className: "absolute top-3 right-3 p-1.5 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 transition-colors z-10" }, /* @__PURE__ */ React.createElement(X, { size: 16 }))) : /* @__PURE__ */ React.createElement("div", { className: "text-center p-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3" }, /* @__PURE__ */ React.createElement(Image, { size: 24 })), /* @__PURE__ */ React.createElement("p", { className: "font-semibold text-gray-700" }, isFlutter ? "Take/Upload Cover" : "Click to upload cover"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Recommended 1920x1080")),
    /* @__PURE__ */ React.createElement("input", { ref: coverImageFileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => uploadImages(e.target.files, "cover", (u) => u[0] && updatePropertyForm("coverImage", u[0])) })
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Property Gallery"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium" }, propertyForm.propertyImages.length, " / 4 minimum")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-3" }, propertyForm.propertyImages.map((img, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "relative aspect-square rounded-xl overflow-hidden border border-gray-200 group" }, /* @__PURE__ */ React.createElement("img", { src: img, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-emerald-700/20 transition-all" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => handleRemoveImage(img, "gallery", i),
      className: "absolute top-1 right-1 bg-white/90 text-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
    },
    /* @__PURE__ */ React.createElement(X, { size: 12 })
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => isFlutter ? handleCameraUpload("gallery", (u) => updatePropertyForm("propertyImages", [...propertyForm.propertyImages, ...u])) : propertyImagesFileInputRef.current?.click(),
      disabled: !!uploading,
      className: "aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all"
    },
    uploading === "gallery" ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-emerald-600", size: 24 }) : isFlutter ? /* @__PURE__ */ React.createElement(Camera, { size: 24 }) : /* @__PURE__ */ React.createElement(Plus, { size: 24 })
  )), /* @__PURE__ */ React.createElement("input", { ref: propertyImagesFileInputRef, type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: (e) => uploadImages(e.target.files, "gallery", (u) => updatePropertyForm("propertyImages", [...propertyForm.propertyImages, ...u])) })))), step === 6 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), !isEditingSubItem && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Define your homestay inventory (Entire place or rooms).")), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3" }, roomTypes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3" }, /* @__PURE__ */ React.createElement(BedDouble, { size: 24 })), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 font-medium" }, "No inventory added yet"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Add rooms or entire house options")) : roomTypes.map((rt, index) => /* @__PURE__ */ React.createElement("div", { key: rt.id, className: "p-4 border border-gray-200 rounded-2xl bg-white group hover:border-emerald-200 transition-all shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900 text-lg" }, rt.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-sm text-gray-500 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider" }, rt.inventoryType === "entire" ? "Entire Place" : "Private Room"), /* @__PURE__ */ React.createElement("span", null, "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "font-semibold text-gray-900" }, "\u20B9 ", rt.pricePerNight), /* @__PURE__ */ React.createElement("span", { className: "text-xs" }, "/ night")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Users, { size: 12 }), " Max ", rt.maxAdults, " Adults"), /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Users, { size: 12 }), " Max ", rt.maxChildren, " Kids"), /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1" }, "Inventory: ", rt.totalInventory))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => startEditRoomType(index), className: "p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" }, /* @__PURE__ */ React.createElement(FileText, { size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteRoomType(index), className: "p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" }, /* @__PURE__ */ React.createElement(Trash2, { size: 16 }))))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: startAddRoomType,
      className: "w-full py-4 border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 20 }),
    " Add Inventory"
  )), editingRoomType && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-800 text-sm" }, editingRoomTypeIndex === -1 ? "Add Inventory" : "Edit Inventory"), /* @__PURE__ */ React.createElement("button", { onClick: cancelEditRoomType, className: "text-emerald-600 hover:bg-emerald-100 p-1 rounded-md" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold" }, "Close"))), /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "p-1 bg-gray-100 rounded-xl flex" }, /* @__PURE__ */ React.createElement("button", { onClick: () => changeInventoryType("room"), className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingRoomType.inventoryType === "room" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}` }, "Private Room"), /* @__PURE__ */ React.createElement("button", { onClick: () => changeInventoryType("entire"), className: `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingRoomType.inventoryType === "entire" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}` }, "Entire Homestay")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "e.g. Deluxe Room or Entire 3BHK Villa", value: editingRoomType.name, onChange: (e) => setEditingRoomType({ ...editingRoomType, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Price per Night (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10", type: "number", placeholder: "0", value: editingRoomType.pricePerNight, onChange: (e) => setEditingRoomType({ ...editingRoomType, pricePerNight: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Inventory Count"), /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", placeholder: "1", value: editingRoomType.totalInventory, onChange: (e) => setEditingRoomType({ ...editingRoomType, totalInventory: e.target.value.replace(/^0+(?!$)/, "") }) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Max Adults"), /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", placeholder: "2", value: editingRoomType.maxAdults, onChange: (e) => setEditingRoomType({ ...editingRoomType, maxAdults: e.target.value.replace(/^0+(?!$)/, "") }) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Max Children"), /* @__PURE__ */ React.createElement("input", { className: "input", type: "number", placeholder: "1", value: editingRoomType.maxChildren, onChange: (e) => setEditingRoomType({ ...editingRoomType, maxChildren: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-emerald-800 uppercase tracking-wider" }, "Pricing Configuration"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Base Adults Included"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: `input w-full bg-white ${Number(editingRoomType.baseAdults) > Number(editingRoomType.maxAdults) ? "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500" : ""}`,
      type: "number",
      value: editingRoomType.baseAdults,
      onChange: (e) => setEditingRoomType((prev) => ({ ...prev, baseAdults: e.target.value.replace(/^0+(?!$)/, "") })),
      placeholder: "e.g. 2"
    }
  ), Number(editingRoomType.baseAdults) > Number(editingRoomType.maxAdults) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-red-500 font-bold animate-pulse mt-0.5" }, "Exceeds Max Adults (", editingRoomType.maxAdults, ")")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Base Children Included"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: `input w-full bg-white ${Number(editingRoomType.baseChildren) > Number(editingRoomType.maxChildren) ? "border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500" : ""}`,
      type: "number",
      value: editingRoomType.baseChildren,
      onChange: (e) => setEditingRoomType((prev) => ({ ...prev, baseChildren: e.target.value.replace(/^0+(?!$)/, "") })),
      placeholder: "e.g. 0"
    }
  ), Number(editingRoomType.baseChildren) > Number(editingRoomType.maxChildren) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-red-500 font-bold animate-pulse mt-0.5" }, "Exceeds Max Children (", editingRoomType.maxChildren, ")"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Extra Adult Price (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10 w-full bg-white", type: "number", value: editingRoomType.extraAdultPrice, onChange: (e) => setEditingRoomType({ ...editingRoomType, extraAdultPrice: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Extra Child Price (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10 w-full bg-white", type: "number", value: editingRoomType.extraChildPrice, onChange: (e) => setEditingRoomType({ ...editingRoomType, extraChildPrice: e.target.value.replace(/^0+(?!$)/, "") }) }))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Images (Max 3)"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, (editingRoomType.images || []).length, "/3")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 overflow-x-auto pb-2" }, (editingRoomType.images || []).map((img, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "relative w-20 h-20 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden group" }, /* @__PURE__ */ React.createElement("img", { src: img, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => handleRemoveImage(img, "room", i), className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(X, { size: 12 })))), (editingRoomType.images || []).length < 3 && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => isFlutter ? handleCameraUpload("room", (url) => setEditingRoomType((prev) => ({ ...prev, images: [...prev.images || [], url].slice(0, 3) }))) : roomImagesFileInputRef.current?.click(), disabled: !!uploading, className: "w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/20 transition-all" }, uploading === "room" ? /* @__PURE__ */ React.createElement(Loader2, { size: 20, className: "animate-spin text-emerald-600" }) : /* @__PURE__ */ React.createElement(Plus, { size: 20 })), /* @__PURE__ */ React.createElement("input", { ref: roomImagesFileInputRef, type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: (e) => {
    if (e.target.files?.length) uploadImages(e.target.files, "room", (urls) => urls.length && setEditingRoomType((prev) => ({ ...prev, images: [...prev.images || [], ...urls].slice(0, 3) })));
  } }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Amenities"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, ROOM_AMENITIES.map((opt) => {
    const isSelected = editingRoomType.amenities.includes(opt.label);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.label,
        type: "button",
        onClick: () => toggleRoomAmenity(opt.label),
        className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`
      },
      /* @__PURE__ */ React.createElement(opt.icon, { size: 12 }),
      opt.label
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 flex flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: cancelEditRoomType, className: "flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200" }, "Cancel"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        if (window.confirm("Clear all fields for this inventory?")) {
          if (editingRoomTypeIndex === -1 || editingRoomTypeIndex == null) {
            startAddRoomType();
          } else {
            startEditRoomType(editingRoomTypeIndex);
          }
        }
      },
      className: "flex-1 py-3 text-red-600 font-semibold bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors"
    },
    "Clear"
  ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: saveRoomType, className: "flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100" }, editingRoomTypeIndex === -1 ? "Add Inventory" : "Save Changes"))))), step === 7 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Check-In Time"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "input !pl-10",
      value: propertyForm.checkInTime,
      onChange: (e) => updatePropertyForm("checkInTime", e.target.value),
      onClick: (e) => e.target.showPicker?.()
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" }, /* @__PURE__ */ React.createElement(Clock, { size: 18 })))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Check-Out Time"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "time",
      className: "input !pl-10",
      value: propertyForm.checkOutTime,
      onChange: (e) => updatePropertyForm("checkOutTime", e.target.value),
      onClick: (e) => e.target.showPicker?.()
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" }, /* @__PURE__ */ React.createElement(Clock, { size: 18 }))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Cancellation Policy"), /* @__PURE__ */ React.createElement("textarea", { className: "input min-h-[80px]", placeholder: "e.g. Free cancellation up to 48 hours before check-in...", value: propertyForm.cancellationPolicy, onChange: (e) => updatePropertyForm("cancellationPolicy", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "House Rules"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, HOUSE_RULES_OPTIONS.map((r) => {
    const isSelected = propertyForm.houseRules.includes(r);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: r,
        type: "button",
        onClick: () => {
          const has = propertyForm.houseRules.includes(r);
          updatePropertyForm("houseRules", has ? propertyForm.houseRules.filter((x) => x !== r) : [...propertyForm.houseRules, r]);
        },
        className: `px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`
      },
      isSelected && /* @__PURE__ */ React.createElement(CheckCircle, { size: 12 }),
      r
    );
  })))), step === 8 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-700" }, "Please provide the following documents"), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3" }, propertyForm.documents.map((doc, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "p-4 border border-gray-200 rounded-2xl bg-white hover:border-emerald-200 transition-colors shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900" }, doc.name), /* @__PURE__ */ React.createElement("div", { className: `text-xs mt-0.5 ${doc.required ? "text-red-500 font-semibold" : "text-gray-400"}` }, doc.required ? "Required *" : "Optional")), doc.fileUrl ? /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 text-emerald-700 p-1.5 rounded-full" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 18 })) : /* @__PURE__ */ React.createElement("div", { className: "bg-gray-100 text-gray-400 p-1.5 rounded-full" }, /* @__PURE__ */ React.createElement(FileText, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => isFlutter ? handleCameraUpload(`doc_${idx}`, (url) => {
        const next = [...propertyForm.documents];
        next[idx].fileUrl = url;
        updatePropertyForm("documents", next);
      }) : documentInputRefs.current[idx]?.click(),
      className: `flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-sm font-bold transition-all ${doc.fileUrl ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-gray-300 bg-gray-50 text-gray-600 hover:bg-white hover:border-emerald-400 hover:text-emerald-600"}`
    },
    uploading === `doc_${idx}` ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { size: 16, className: "animate-spin" }), " Uploading...") : doc.fileUrl ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Change File") : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Plus, { size: 16 }), " Upload")
  ), doc.fileUrl && /* @__PURE__ */ React.createElement("a", { href: doc.fileUrl, target: "_blank", rel: "noreferrer", className: "p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-200 hover:border-emerald-200 bg-white" }, /* @__PURE__ */ React.createElement(Eye, { size: 18 }))), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      className: "hidden",
      accept: ".jpg,.jpeg,.png,.webp,.pdf",
      ref: (el) => documentInputRefs.current[idx] = el,
      onChange: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        uploadImages([file], `doc_${idx}`, (urls) => {
          if (urls[0]) {
            const updated = [...propertyForm.documents];
            updated[idx] = { ...updated[idx], fileUrl: urls[0] };
            updatePropertyForm("documents", updated);
          }
        });
        e.target.value = "";
      }
    }
  )))))), step === 9 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex gap-4 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white text-emerald-600 p-3 rounded-2xl shadow-sm" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 24 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-900" }, "Review Your Listing"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-0.5" }, "Please check all details before submitting for approval."))), error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Basic Information"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(1), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-4" }, propertyForm.coverImage && /* @__PURE__ */ React.createElement("img", { src: propertyForm.coverImage, className: "w-20 h-20 rounded-xl object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-emerald-900 leading-tight" }, propertyForm.propertyName || "No Name"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-1 line-clamp-2" }, propertyForm.shortDescription || "No description"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-tighter" }, "Contact: ", propertyForm.contactNumber || "N/A"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-tighter" }, propertyForm.suitability || "General")))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Location & Nearby"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(2), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 text-sm text-gray-700 items-start" }, /* @__PURE__ */ React.createElement(MapPin, { size: 16, className: "text-gray-400 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("span", null, propertyForm.address.fullAddress || "No address provided")), propertyForm.nearbyPlaces.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 pt-2" }, propertyForm.nearbyPlaces.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100" }, p.name, " (", p.distanceKm, "km)"))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Inventory Types (", roomTypes.length, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(6), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-50" }, roomTypes.map((rt, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "py-2 first:pt-0 last:pb-0 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-gray-800" }, rt.name), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400" }, "Inventory: ", rt.totalInventory, " \xB7 ", rt.maxAdults, "A, ", rt.maxChildren, "C")), /* @__PURE__ */ React.createElement("div", { className: "text-emerald-600 font-extrabold text-sm" }, "\u20B9 ", rt.pricePerNight))), roomTypes.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-red-500 font-medium py-2" }, "No inventory added yet!"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" }, "Amenities"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, propertyForm.amenities.slice(0, 4).map((a) => /* @__PURE__ */ React.createElement("span", { key: a, className: "px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[9px] font-bold rounded border border-gray-100" }, a)), propertyForm.amenities.length > 4 && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400" }, "+", propertyForm.amenities.length - 4, " more"))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" }, "Rules & Policy"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-600" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Check-in:"), " ", propertyForm.checkInTime || "--:--"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-600" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Check-out:"), " ", propertyForm.checkOutTime || "--:--"), /* @__PURE__ */ React.createElement("div", { className: "text-[9px] text-gray-400 line-clamp-1 italic mt-1" }, propertyForm.cancellationPolicy || "No policy")))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400" }, /* @__PURE__ */ React.createElement(FileText, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-gray-900" }, "Required Documents"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-500" }, propertyForm.documents.filter((d) => d.fileUrl).length, " of ", propertyForm.documents.length, " uploaded"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(8), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")))), step === 10 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center py-12 text-center space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center transition-all animate-bounce" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 48 })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-extrabold text-gray-900" }, "Registration Submitted!"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 max-w-sm mx-auto" }, "Your homestay registration has been sent for verification. Our team will review it and get back to you shortly.")), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => navigate("/hotel/properties"),
      className: "px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
    },
    "Go to My Properties"
  )))), step < 10 && /* @__PURE__ */ React.createElement("footer", { className: "fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 z-40" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto flex items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBack,
      disabled: step === 1 || loading || isEditingSubItem,
      className: "px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    },
    "Back"
  ), step < 9 && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: clearCurrentStep,
      disabled: loading,
      className: "px-4 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 disabled:opacity-50 transition-all text-sm"
    },
    "Clear Step"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: step === 9 ? submitAll : handleNext,
      disabled: loading || isEditingSubItem || step === 6 && roomTypes.length === 0,
      className: "flex-1 px-6 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
    },
    loading ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }), "Processing...") : /* @__PURE__ */ React.createElement(React.Fragment, null, step === 9 ? "Submit Property" : "Next Step")
  ))));
};
export default AddHomestayWizard;
