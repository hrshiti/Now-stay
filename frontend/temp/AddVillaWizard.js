import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { propertyService, hotelService } from "../../../services/apiService";
import { CheckCircle, FileText, Home, Image, Plus, Trash2, MapPin, Search, BedDouble, Wifi, Snowflake, Coffee, ShowerHead, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Upload, X, Clock, Loader2, Camera, Eye } from "lucide-react";
import { isFlutterApp, openFlutterCamera } from "../../../utils/flutterBridge";
const REQUIRED_DOCS_VILLA = [
  { type: "trade_license", name: "Trade License", required: true },
  { type: "electricity_bill", name: "Electricity Bill", required: false }
];
const VILLA_AMENITIES = ["Private Pool", "Garden", "Parking", "Kitchen", "WiFi"];
const HOUSE_RULES_OPTIONS = ["No smoking", "No pets", "No loud music", "ID required at check-in", "Visitors not allowed"];
const ROOM_AMENITIES = [
  { key: "pool", label: "Private Pool", icon: Snowflake },
  { key: "wifi", label: "WiFi", icon: Wifi },
  { key: "kitchen", label: "Kitchen", icon: Coffee },
  { key: "geyser", label: "Geyser", icon: ShowerHead },
  { key: "balcony", label: "Balcony", icon: BedDouble }
];
const AddVillaWizard = () => {
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
  const [customHouseRulesDraft, setCustomHouseRulesDraft] = useState("");
  useEffect(() => {
    setIsFlutter(isFlutterApp());
  }, []);
  useEffect(() => {
    if (step === 7) {
      setCustomHouseRulesDraft(propertyForm.houseRules.filter((r) => !HOUSE_RULES_OPTIONS.includes(r)).join(", "));
    }
  }, [step]);
  const coverImageFileInputRef = useRef(null);
  const propertyImagesFileInputRef = useRef(null);
  const roomImagesFileInputRef = useRef(null);
  const documentInputRefs = useRef([]);
  const [propertyForm, setPropertyForm] = useState({
    propertyName: "",
    description: "",
    shortDescription: "",
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
    documents: REQUIRED_DOCS_VILLA.map((d) => ({ type: d.type, name: d.name, required: d.required, fileUrl: "" }))
  });
  const [roomTypes, setRoomTypes] = useState([]);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [editingRoomTypeIndex, setEditingRoomTypeIndex] = useState(null);
  const [originalRoomTypeIds, setOriginalRoomTypeIds] = useState([]);
  const STORAGE_KEY = `rukko_villa_wizard_draft_${existingProperty?._id || "new"}`;
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
        console.error("Failed to load villa draft", e);
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
          documents: docs.length ? docs.map((d) => ({ type: d.type || d.name, name: d.name, fileUrl: d.fileUrl || "", required: REQUIRED_DOCS_VILLA.find((rd) => rd.type === (d.type || d.name))?.required || false })) : REQUIRED_DOCS_VILLA.map((d) => ({ type: d.type, name: d.name, required: d.required, fileUrl: "" }))
        });
        if (rts.length) {
          setRoomTypes(
            rts.map((rt) => ({
              id: rt._id,
              backendId: rt._id,
              name: rt.name || "Entire Villa",
              inventoryType: "entire",
              roomCategory: "entire",
              maxAdults: rt.maxAdults ?? 6,
              maxChildren: rt.maxChildren ?? 3,
              totalInventory: rt.totalInventory ?? 1,
              pricePerNight: rt.pricePerNight ?? "",
              extraAdultPrice: rt.extraAdultPrice ?? 0,
              extraChildPrice: rt.extraChildPrice ?? 0,
              images: rt.images || ["", "", "", ""],
              amenities: rt.amenities || ["Private Pool", "Kitchen", "WiFi"],
              isActive: typeof rt.isActive === "boolean" ? rt.isActive : true
            }))
          );
          setOriginalRoomTypeIds(rts.map((rt) => rt._id));
        } else {
          setOriginalRoomTypeIds([]);
          setRoomTypes([]);
        }
      } catch (e) {
        setError(e?.message || "Failed to load property details");
      } finally {
        setLoading(false);
      }
    };
    loadForEdit();
  }, [isEditMode, existingProperty]);
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
      console.log("Selecting nearby place:", place);
      let originLat = Number(propertyForm.location.coordinates[1] || 0);
      let originLng = Number(propertyForm.location.coordinates[0] || 0);
      const destLat = place.lat;
      const destLng = place.lng;
      if ((!originLat || !originLng) && propertyForm.address.fullAddress) {
        try {
          console.log("Auto-geocoding address for distance calculation...");
          const query = `${propertyForm.address.fullAddress}, ${propertyForm.address.city}`;
          const res = await hotelService.searchLocation(query);
          if (res?.results?.[0]?.lat) {
            originLat = res.results[0].lat;
            originLng = res.results[0].lng;
            updatePropertyForm(["location", "coordinates"], [String(originLng), String(originLat)]);
            console.log("Auto-geocoded coordinates:", originLat, originLng);
          }
        } catch (e) {
          console.warn("Failed to auto-geocode address", e);
        }
      }
      let km = "";
      if (originLat && originLng && destLat && destLng) {
        console.log(`Calculating distance: ${originLat},${originLng} -> ${destLat},${destLng}`);
        const distRes = await hotelService.calculateDistance(originLat, originLng, destLat, destLng);
        console.log("Distance calculation result:", distRes);
        if (distRes && typeof distRes.distanceKm !== "undefined") {
          km = String(distRes.distanceKm);
        }
      } else {
        console.warn("Missing coordinates for distance calculation", { originLat, originLng, destLat, destLng });
      }
      const newPlace = {
        name: place.name || "",
        type: place.type || "tourist",
        distanceKm: km
      };
      setTempNearbyPlace((prev) => ({
        ...prev,
        name: newPlace.name,
        distanceKm: newPlace.distanceKm
      }));
      setNearbyResults([]);
      setNearbySearchQuery("");
    } catch (err) {
      console.error("Error selecting nearby place:", err);
      setTempNearbyPlace((prev) => ({ ...prev, name: place.name || "" }));
      setNearbyResults([]);
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
  const deleteNearbyPlace = (index) => {
    const arr = propertyForm.nearbyPlaces.filter((_, i) => i !== index);
    updatePropertyForm("nearbyPlaces", arr);
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
  const cancelEditNearbyPlace = () => {
    setEditingNearbyIndex(null);
    setError("");
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
        msg = "Upload failed: File size may be too large.";
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
  const startAddRoomType = () => {
    setError("");
    setEditingRoomTypeIndex(-1);
    setEditingRoomType({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      name: "",
      inventoryType: "entire",
      roomCategory: "entire",
      maxAdults: "",
      maxChildren: "",
      totalInventory: "1",
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
  const cancelEditRoomType = () => {
    setEditingRoomTypeIndex(null);
    setEditingRoomType(null);
    setError("");
  };
  const saveEditingRoomType = () => {
    const rt = editingRoomType;
    if (!rt.name || !rt.pricePerNight) {
      setError("Room type name and price required");
      return;
    }
    if (Number(rt.baseAdults || 0) > Number(rt.maxAdults || 0)) {
      setError("Base Adults cannot be greater than Max Adults");
      return;
    }
    if (Number(rt.baseChildren || 0) > Number(rt.maxChildren || 0)) {
      setError("Base Children cannot be greater than Max Children");
      return;
    }
    if (!rt.images || rt.images.filter(Boolean).length < 4) {
      setError("At least 4 images required \u2014 please upload at least 4 photos");
      return;
    }
    const payload = { ...rt, totalInventory: 1 };
    if (editingRoomTypeIndex === -1) {
      setRoomTypes((prev) => [{ ...payload }, ...prev]);
    } else {
      setRoomTypes((prev) => prev.map((x, i) => i === editingRoomTypeIndex ? payload : x));
    }
    setEditingRoomTypeIndex(null);
    setEditingRoomType(null);
    setEditingNearbyIndex(null);
    setError("");
  };
  const deleteRoomType = (index) => {
    setRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };
  const nextFromBasic = () => {
    setError("");
    if (!propertyForm.propertyName || !propertyForm.shortDescription) {
      setError("Name and short description required");
      return;
    }
    setStep(2);
  };
  const nextFromLocation = () => {
    setError("");
    const { country, state, city, area, fullAddress, pincode } = propertyForm.address;
    if (!country || !state || !city || !area || !fullAddress || !pincode) {
      setError("All address fields are required");
      return;
    }
    if (!propertyForm.location.coordinates[0] || !propertyForm.location.coordinates[1]) {
      setError("Location coordinates are required");
      return;
    }
    setStep(3);
  };
  const nextFromAmenities = () => {
    setError("");
    setStep(4);
  };
  const nextFromNearbyPlaces = () => {
    if (propertyForm.nearbyPlaces.length < 1) {
      setError("Please add at least 1 nearby place");
      return;
    }
    setStep(5);
  };
  const nextFromImages = () => {
    setError("");
    if (!propertyForm.coverImage) {
      setError("Cover image required");
      return;
    }
    if ((propertyForm.propertyImages || []).filter(Boolean).length < 4) {
      setError("Minimum 4 property images required");
      return;
    }
    setStep(6);
  };
  const nextFromRoomTypes = () => {
    setError("");
    if (!roomTypes.length) {
      setError("At least one RoomType required");
      return;
    }
    for (const rt of roomTypes) {
      if (!rt.name || !rt.pricePerNight) {
        setError("Room type name and price required");
        return;
      }
      if (!rt.images || rt.images.filter(Boolean).length < 4) {
        setError("Each room type must have at least 4 images");
        return;
      }
    }
    setStep(7);
  };
  const syncHouseRulesFromDraft = () => {
    const customRules = customHouseRulesDraft.split(",").map((s) => s.trim()).filter(Boolean);
    const selectedPredefined = propertyForm.houseRules.filter((r) => HOUSE_RULES_OPTIONS.includes(r));
    updatePropertyForm("houseRules", [...selectedPredefined, ...customRules]);
  };
  const nextFromRules = () => {
    setError("");
    syncHouseRulesFromDraft();
    if (!propertyForm.checkInTime || !propertyForm.checkOutTime) {
      setError("Check-in and Check-out times are required");
      return;
    }
    setStep(8);
  };
  const nextFromDocuments = () => {
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
        propertyType: queryType || "villa",
        propertyTemplate: "villa",
        propertyName: propertyForm.propertyName,
        contactNumber: propertyForm.contactNumber,
        description: propertyForm.description,
        shortDescription: propertyForm.shortDescription,
        coverImage: propertyForm.coverImage,
        propertyImages: propertyForm.propertyImages.filter(Boolean),
        address: propertyForm.address,
        location: {
          type: "Point",
          coordinates: [
            Number(propertyForm.location.coordinates[0]),
            Number(propertyForm.location.coordinates[1])
          ]
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
            inventoryType: "entire",
            roomCategory: "entire",
            baseAdults: Number(rt.baseAdults || 0),
            baseChildren: Number(rt.baseChildren || 0),
            maxAdults: Number(rt.maxAdults),
            maxChildren: Number(rt.maxChildren || 0),
            totalInventory: Number(rt.totalInventory || 1),
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
        propertyPayload.roomTypes = roomTypes.map((rt) => ({
          name: rt.name,
          inventoryType: "entire",
          roomCategory: "entire",
          baseAdults: Number(rt.baseAdults || 0),
          baseChildren: Number(rt.baseChildren || 0),
          maxAdults: Number(rt.maxAdults),
          maxChildren: Number(rt.maxChildren || 0),
          totalInventory: Number(rt.totalInventory || 1),
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
      setError(e?.message || "Failed to submit property");
    } finally {
      setLoading(false);
    }
  };
  const isEditingSubItem = editingRoomType !== null || editingNearbyIndex !== null;
  const handleBack = () => {
    setError("");
    if (step === 1) {
      localStorage.removeItem(STORAGE_KEY);
      navigate(-1);
    } else {
      if (step === 7) syncHouseRulesFromDraft();
      setStep((prev) => prev - 1);
    }
  };
  const clearCurrentStep = () => {
    if (!window.confirm("Clear all fields in this step?")) return;
    if (step === 1) {
      setPropertyForm((prev) => ({ ...prev, propertyName: "", description: "", shortDescription: "", coverImage: "" }));
    } else if (step === 2) {
      updatePropertyForm("address", { country: "", state: "", city: "", area: "", fullAddress: "", pincode: "" });
      updatePropertyForm(["location", "coordinates"], ["", ""]);
    } else if (step === 3) {
      updatePropertyForm("amenities", []);
    } else if (step === 4) {
      updatePropertyForm("nearbyPlaces", []);
    } else if (step === 5) {
      updatePropertyForm("coverImage", "");
      updatePropertyForm("propertyImages", []);
    } else if (step === 6) {
      setRoomTypes([]);
      setEditingRoomType(null);
      setEditingRoomTypeIndex(null);
    } else if (step === 7) {
      setPropertyForm((prev) => ({ ...prev, checkInTime: "", checkOutTime: "", cancellationPolicy: "", houseRules: [] }));
      setCustomHouseRulesDraft("");
    } else if (step === 8) {
      updatePropertyForm("documents", REQUIRED_DOCS_VILLA.map((d) => ({ type: d.type, name: d.name, fileUrl: "" })));
    }
  };
  const handleNext = () => {
    if (loading) return;
    if (step === 1) nextFromBasic();
    else if (step === 2) nextFromLocation();
    else if (step === 3) nextFromAmenities();
    else if (step === 4) nextFromNearbyPlaces();
    else if (step === 5) nextFromImages();
    else if (step === 6) nextFromRoomTypes();
    else if (step === 7) nextFromRules();
    else if (step === 8) nextFromDocuments();
    else if (step === 9) submitAll();
  };
  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Basic Info";
      case 2:
        return "Location";
      case 3:
        return "Amenities";
      case 4:
        return "Nearby Places";
      case 5:
        return "Property Images";
      case 6:
        return "Villa Details";
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
  const handleExit = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate(-1);
  };
  return /* @__PURE__ */ React.createElement("div", { className: "min-h-screen bg-gray-50 flex flex-col font-sans" }, /* @__PURE__ */ React.createElement("div", { className: "sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 h-16 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("button", { onClick: handleBack, className: "p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" }, /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-gray-900" }, step <= 9 ? `Step ${step} of 9` : "Registration Complete"), /* @__PURE__ */ React.createElement("button", { onClick: handleExit, className: "p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors" }, /* @__PURE__ */ React.createElement(X, { size: 20 }))), /* @__PURE__ */ React.createElement("div", { className: "h-1 bg-gray-100 w-full" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "h-full bg-emerald-500 transition-all duration-300 ease-out",
      style: { width: `${step / 9 * 100}%` }
    }
  ))), /* @__PURE__ */ React.createElement("main", { className: "flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-32" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-xl mx-auto" }, step === 1 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Property Name"), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "input",
      placeholder: "e.g. Sunset Villa",
      value: propertyForm.propertyName,
      onChange: (e) => updatePropertyForm("propertyName", e.target.value)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Description"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "input min-h-[100px] leading-relaxed",
      placeholder: "Brief summary (e.g. Luxury 3BHK Villa with Private Pool)",
      value: propertyForm.shortDescription,
      onChange: (e) => updatePropertyForm("shortDescription", e.target.value)
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end text-[10px] text-gray-400" }, propertyForm.shortDescription.length, " chars")), /* @__PURE__ */ React.createElement("div", { className: "hidden" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "About Property"), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "input min-h-[120px] leading-relaxed",
      placeholder: "Describe the villa, its unique features, and surroundings...",
      value: propertyForm.description,
      onChange: (e) => updatePropertyForm("description", e.target.value)
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Contact Number (For Guest Inquiries)"), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "tel",
      className: "input",
      placeholder: "9876543210",
      value: propertyForm.contactNumber,
      onChange: (e) => {
        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
        updatePropertyForm("contactNumber", digitsOnly);
      },
      maxLength: 10
    }
  ), propertyForm.contactNumber && propertyForm.contactNumber.length === 10 && (/^[6-9]\d{9}$/.test(propertyForm.contactNumber) ? /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-green-600 font-medium flex items-center gap-1 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "\u2713"), " Valid mobile number") : /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-red-500 font-medium flex items-center gap-1 mt-1" }, /* @__PURE__ */ React.createElement("span", null, "\u26A0"), " Mobile number must start with 6, 7, 8, or 9")), propertyForm.contactNumber && propertyForm.contactNumber.length > 0 && propertyForm.contactNumber.length < 10 && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 font-medium mt-1" }, 10 - propertyForm.contactNumber.length, " more digit(s) required")), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Suitability"), /* @__PURE__ */ React.createElement(
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
  ))), error && /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 16, className: "rotate-45" }), " ", error)), step === 2 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl p-1 relative z-20" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400", size: 20 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      className: "w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-xl text-gray-800 placeholder:text-gray-400 focus:ring-0",
      placeholder: "Search area, street or landmark...",
      value: locationSearchQuery,
      onChange: (e) => {
        setLocationSearchQuery(e.target.value);
        if (e.target.value.length > 2) searchLocationForAddress();
      }
    }
  ), locationResults.length > 0 && locationSearchQuery && /* @__PURE__ */ React.createElement("div", { className: "absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto" }, locationResults.map((p, i) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: i,
      onClick: () => {
        selectLocationResult(p);
        setLocationSearchQuery("");
        setLocationResults([]);
      },
      className: "w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-0 text-sm text-gray-600 transition-colors"
    },
    /* @__PURE__ */ React.createElement("span", { className: "font-medium text-gray-900 block mb-0.5" }, p.name),
    /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 truncate block" }, p.display_name)
  ))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-200 flex-1" }), /* @__PURE__ */ React.createElement("span", { className: "text-xs text-gray-400 font-medium uppercase tracking-wider" }, "Or Enter Manually"), /* @__PURE__ */ React.createElement("div", { className: "h-px bg-gray-200 flex-1" })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Country"), /* @__PURE__ */ React.createElement("input", { className: "input", value: propertyForm.address.country, onChange: (e) => updatePropertyForm(["address", "country"], e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "State/Province"), /* @__PURE__ */ React.createElement("input", { className: "input", value: propertyForm.address.state, onChange: (e) => updatePropertyForm(["address", "state"], e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "City"), /* @__PURE__ */ React.createElement("input", { className: "input", value: propertyForm.address.city, onChange: (e) => updatePropertyForm(["address", "city"], e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Area/Sector"), /* @__PURE__ */ React.createElement("input", { className: "input", value: propertyForm.address.area, onChange: (e) => updatePropertyForm(["address", "area"], e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Full Street Address"), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "House/Flat No, Building Name...", value: propertyForm.address.fullAddress, onChange: (e) => updatePropertyForm(["address", "fullAddress"], e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Pincode/Zip"), /* @__PURE__ */ React.createElement("input", { className: "input", maxLength: 6, value: propertyForm.address.pincode, onChange: (e) => updatePropertyForm(["address", "pincode"], e.target.value.replace(/\D/g, "")) }))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: useCurrentLocation,
      disabled: loadingLocation,
      className: "w-full py-4 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 text-emerald-700 font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-50"
    },
    loadingLocation ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 20 }), /* @__PURE__ */ React.createElement("span", null, "Fetching Location...")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(MapPin, { size: 20 }), /* @__PURE__ */ React.createElement("span", null, "Use Current Location"))
  )), step === 3 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, VILLA_AMENITIES.map((am) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: am,
      type: "button",
      onClick: () => {
        const has = propertyForm.amenities.includes(am);
        const arr = has ? propertyForm.amenities.filter((x) => x !== am) : [...propertyForm.amenities, am];
        updatePropertyForm("amenities", arr);
      },
      className: `p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${propertyForm.amenities.includes(am) ? "border-emerald-500 bg-emerald-50 shadow-sm ring-1 ring-emerald-500" : "border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50"}`
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: `w-10 h-10 rounded-full flex items-center justify-center transition-colors ${propertyForm.amenities.includes(am) ? "bg-white text-emerald-600" : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-emerald-600"}` }, am === "Private Pool" && /* @__PURE__ */ React.createElement(Snowflake, { size: 20 }), am === "Garden" && /* @__PURE__ */ React.createElement(Home, { size: 20 }), am === "Parking" && /* @__PURE__ */ React.createElement(Home, { size: 20 }), am === "Kitchen" && /* @__PURE__ */ React.createElement(Coffee, { size: 20 }), am === "WiFi" && /* @__PURE__ */ React.createElement(Wifi, { size: 20 }), !["Private Pool", "Garden", "Parking", "Kitchen", "WiFi"].includes(am) && /* @__PURE__ */ React.createElement(CheckCircle, { size: 20 })), /* @__PURE__ */ React.createElement("span", { className: `font-bold text-sm ${propertyForm.amenities.includes(am) ? "text-emerald-800" : "text-gray-700"}` }, am)),
    propertyForm.amenities.includes(am) && /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 right-3 text-emerald-500" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 18, className: "fill-current" }))
  )))), step === 4 && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), !isEditingSubItem && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, propertyForm.nearbyPlaces.map((place, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-white hover:border-emerald-200 transition-colors shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(MapPin, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900" }, place.name), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 font-medium uppercase tracking-wide" }, place.type, " \u2022 ", /* @__PURE__ */ React.createElement("span", { className: "text-emerald-600" }, place.distanceKm, " km")))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1" }, /* @__PURE__ */ React.createElement(
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
  )))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 pt-2 border-t border-gray-100" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "input w-full", value: tempNearbyPlace.name, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Type"), /* @__PURE__ */ React.createElement("select", { className: "input w-full appearance-none", value: tempNearbyPlace.type, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, type: e.target.value }) }, /* @__PURE__ */ React.createElement("option", { value: "tourist" }, "Tourist Attraction"), /* @__PURE__ */ React.createElement("option", { value: "airport" }, "Airport"), /* @__PURE__ */ React.createElement("option", { value: "market" }, "Market"), /* @__PURE__ */ React.createElement("option", { value: "railway" }, "Railway Station"), /* @__PURE__ */ React.createElement("option", { value: "bus_stop" }, "Bus Stop"), /* @__PURE__ */ React.createElement("option", { value: "hospital" }, "Hospital"), /* @__PURE__ */ React.createElement("option", { value: "restaurant" }, "Restaurant"), /* @__PURE__ */ React.createElement("option", { value: "other" }, "Other"))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Distance (km)"), /* @__PURE__ */ React.createElement("input", { className: "input w-full", type: "number", value: tempNearbyPlace.distanceKm, onChange: (e) => setTempNearbyPlace({ ...tempNearbyPlace, distanceKm: e.target.value }) })))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 pt-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: cancelEditNearbyPlace, className: "flex-1 py-3 text-gray-600 font-semibold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" }, "Cancel"), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: saveNearbyPlace, className: "flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all transform active:scale-95" }, "Save Place"))))), step === 5 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Cover Image"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => !uploading && (isFlutter ? handleCameraUpload("cover", (u) => updatePropertyForm("coverImage", u)) : coverImageFileInputRef.current?.click()),
      className: "w-full aspect-video sm:aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-3 overflow-hidden group hover:border-emerald-400 hover:bg-emerald-50/10 transition-all relative"
    },
    uploading === "cover" ? /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center gap-2 text-emerald-600" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 32 }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold" }, "Uploading Cover...")) : propertyForm.coverImage ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("img", { src: propertyForm.coverImage, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-white font-bold bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/50" }, "Change Cover")), /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => {
          e.stopPropagation();
          updatePropertyForm("coverImage", "");
        },
        className: "absolute top-3 right-3 p-2 bg-white text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
      },
      /* @__PURE__ */ React.createElement(X, { size: 16 })
    )) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform" }, /* @__PURE__ */ React.createElement(Plus, { size: 24 })), /* @__PURE__ */ React.createElement("div", { className: "text-center" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-600 group-hover:text-emerald-700" }, isFlutter ? "Take/Upload Cover Photo" : "Add Cover Photo"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-400" }, "High quality landscape image")))
  ), /* @__PURE__ */ React.createElement("input", { ref: coverImageFileInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => uploadImages(e.target.files, "cover", (u) => updatePropertyForm("coverImage", u[0])) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wider" }, "Property Gallery"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, propertyForm.propertyImages.length, " images (min 4)")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-3" }, propertyForm.propertyImages.map((img, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "aspect-square rounded-xl bg-gray-100 relative group overflow-hidden border border-gray-200" }, /* @__PURE__ */ React.createElement("img", { src: img, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-black/0 group-hover:bg-emerald-700/20 transition-all" }), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => updatePropertyForm("propertyImages", propertyForm.propertyImages.filter((_, x) => x !== i)),
      className: "absolute top-1 right-1 p-1.5 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
    },
    /* @__PURE__ */ React.createElement(X, { size: 14 })
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => isFlutter ? handleCameraUpload("gallery", (u) => updatePropertyForm("propertyImages", [...propertyForm.propertyImages, ...u])) : propertyImagesFileInputRef.current?.click(),
      disabled: !!uploading,
      className: "aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all"
    },
    uploading === "gallery" ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-emerald-600", size: 20 }) : isFlutter ? /* @__PURE__ */ React.createElement(Camera, { size: 20, className: "text-gray-400" }) : /* @__PURE__ */ React.createElement(Plus, { size: 20, className: "text-gray-400" }),
    uploading !== "gallery" && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-gray-500" }, "Add")
  )), /* @__PURE__ */ React.createElement("input", { ref: propertyImagesFileInputRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: (e) => uploadImages(e.target.files, "gallery", (u) => updatePropertyForm("propertyImages", [...propertyForm.propertyImages, ...u])) })))), step === 6 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), !isEditingSubItem && /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Add details for the villa (e.g., entire villa, specific rooms).")), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3" }, roomTypes.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3" }, /* @__PURE__ */ React.createElement(BedDouble, { size: 24 })), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 font-medium" }, "No details added yet"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400 mt-1" }, "Add 'Entire Villa' or individual rooms")) : roomTypes.map((rt, index) => /* @__PURE__ */ React.createElement("div", { key: rt.id, className: "p-4 border border-gray-200 rounded-2xl bg-white group hover:border-emerald-200 transition-all shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200" }, rt.images?.[0] ? /* @__PURE__ */ React.createElement("img", { src: rt.images[0], className: "w-full h-full object-cover" }) : /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center text-gray-400" }, /* @__PURE__ */ React.createElement(BedDouble, { size: 20 }))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900 text-lg" }, rt.name), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 text-sm text-gray-500 mt-1" }, /* @__PURE__ */ React.createElement("span", { className: "bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider" }, "\u20B9 ", rt.pricePerNight, " / night")), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mt-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1" }, "Adults: ", rt.maxAdults), /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1" }, "Children: ", rt.maxChildren)))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => startEditRoomType(index), className: "p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors" }, /* @__PURE__ */ React.createElement(FileText, { size: 16 })), /* @__PURE__ */ React.createElement("button", { onClick: () => deleteRoomType(index), className: "p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" }, /* @__PURE__ */ React.createElement(Trash2, { size: 16 }))))))), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: startAddRoomType,
      className: "w-full py-4 border border-emerald-200 text-emerald-700 bg-emerald-50/50 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 20 }),
    " Add Villa Details"
  )), editingRoomType && /* @__PURE__ */ React.createElement("div", { className: "bg-white rounded-2xl border border-emerald-100 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-emerald-800 text-sm" }, editingRoomTypeIndex === -1 ? "Add Details" : "Edit Details"), /* @__PURE__ */ React.createElement("button", { onClick: cancelEditRoomType, className: "text-emerald-600 hover:bg-emerald-100 p-1 rounded-md" }, /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold" }, "Close"))), /* @__PURE__ */ React.createElement("div", { className: "p-4 space-y-5" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Name"), /* @__PURE__ */ React.createElement("input", { className: "input", placeholder: "e.g. Entire Villa", value: editingRoomType.name, onChange: (e) => setEditingRoomType({ ...editingRoomType, name: e.target.value }) })), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Price per Night (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10", type: "number", placeholder: "0", value: editingRoomType.pricePerNight, onChange: (e) => setEditingRoomType({ ...editingRoomType, pricePerNight: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("input", { type: "hidden", value: "1" }), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Max Adults"), /* @__PURE__ */ React.createElement("input", { className: "input w-full bg-white", type: "number", placeholder: "1", value: editingRoomType.maxAdults, onChange: (e) => setEditingRoomType({ ...editingRoomType, maxAdults: e.target.value.replace(/^0+(?!$)/, "") }) })), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Max Children"), /* @__PURE__ */ React.createElement("input", { className: "input w-full bg-white", type: "number", placeholder: "0", value: editingRoomType.maxChildren, onChange: (e) => setEditingRoomType({ ...editingRoomType, maxChildren: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-emerald-800 uppercase tracking-wider" }, "Pricing Configuration"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Base Adults Included"), /* @__PURE__ */ React.createElement(
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
  ), Number(editingRoomType.baseChildren) > Number(editingRoomType.maxChildren) && /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-red-500 font-bold animate-pulse mt-0.5" }, "Exceeds Max Children (", editingRoomType.maxChildren, ")"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Extra Adult Price (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10 w-full bg-white", type: "number", value: editingRoomType.extraAdultPrice, onChange: (e) => setEditingRoomType({ ...editingRoomType, extraAdultPrice: e.target.value.replace(/^0+(?!$)/, "") }) }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Extra Child Price (\u20B9)"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("span", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 font-bold" }, "\u20B9"), /* @__PURE__ */ React.createElement("input", { className: "input !pl-10 w-full bg-white", type: "number", value: editingRoomType.extraChildPrice, onChange: (e) => setEditingRoomType({ ...editingRoomType, extraChildPrice: e.target.value.replace(/^0+(?!$)/, "") }) }))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Images (Max 4)"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400" }, (editingRoomType.images || []).length, "/4")), /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 overflow-x-auto pb-2" }, (editingRoomType.images || []).map((img, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "relative w-20 h-20 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden group" }, /* @__PURE__ */ React.createElement("img", { src: img, className: "w-full h-full object-cover" }), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => handleRemoveImage(img, "room", i), className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-red-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" }, /* @__PURE__ */ React.createElement(X, { size: 12 })))), (editingRoomType.images || []).length < 4 && /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => isFlutter ? handleCameraUpload("room", (url) => setEditingRoomType((prev) => ({ ...prev, images: [...prev.images || [], url].slice(0, 4) }))) : roomImagesFileInputRef.current?.click(), disabled: !!uploading, className: "w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/20 transition-all" }, uploading === "room" ? /* @__PURE__ */ React.createElement(Loader2, { size: 20, className: "animate-spin text-emerald-600" }) : /* @__PURE__ */ React.createElement(Plus, { size: 20 })), /* @__PURE__ */ React.createElement("input", { ref: roomImagesFileInputRef, type: "file", multiple: true, accept: "image/*", className: "hidden", onChange: (e) => {
    if (e.target.files?.length) uploadImages(e.target.files, "room", (urls) => urls.length && setEditingRoomType((prev) => ({ ...prev, images: [...prev.images || [], ...urls].slice(0, 4) })));
  } }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Amenities & Features"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, ROOM_AMENITIES.map((opt) => {
    const isSelected = editingRoomType.amenities.includes(opt.label);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: opt.label,
        type: "button",
        onClick: () => {
          const updated = isSelected ? editingRoomType.amenities.filter((x) => x !== opt.label) : [...editingRoomType.amenities, opt.label];
          setEditingRoomType({ ...editingRoomType, amenities: updated });
        },
        className: `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`
      },
      /* @__PURE__ */ React.createElement(opt.icon, { size: 12 }),
      opt.label
    );
  }))), /* @__PURE__ */ React.createElement("div", { className: "pt-2 flex flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("button", { type: "button", onClick: cancelEditRoomType, className: "flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200" }, "Close"), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => {
        if (window.confirm("Clear all fields for this detail?")) {
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
  ), /* @__PURE__ */ React.createElement("button", { type: "button", onClick: saveEditingRoomType, className: "flex-1 py-3 text-white font-bold bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100" }, editingRoomTypeIndex === -1 ? "Add Details" : "Save Changes"))))), step === 7 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Check-In Time"), /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement(
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
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute left-[14px] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" }, /* @__PURE__ */ React.createElement(Clock, { size: 18 }))))), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "Cancellation Policy"), /* @__PURE__ */ React.createElement(
    "select",
    {
      className: "input w-full appearance-none",
      value: propertyForm.cancellationPolicy,
      onChange: (e) => updatePropertyForm("cancellationPolicy", e.target.value)
    },
    /* @__PURE__ */ React.createElement("option", { value: "" }, "Select a policy"),
    /* @__PURE__ */ React.createElement("option", { value: "No refund after check-in" }, "No refund after check-in"),
    /* @__PURE__ */ React.createElement("option", { value: "Free cancellation up to 24hrs" }, "Free cancellation up to 24hrs"),
    /* @__PURE__ */ React.createElement("option", { value: "Strict" }, "Strict (No refund)"),
    /* @__PURE__ */ React.createElement("option", { value: "Moderate" }, "Moderate")
  )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-xs font-semibold text-gray-500" }, "House Rules"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 mb-3" }, HOUSE_RULES_OPTIONS.map((rule) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: rule,
      onClick: () => {
        const customRules = customHouseRulesDraft.split(",").map((s) => s.trim()).filter(Boolean);
        const selectedPredefined = propertyForm.houseRules.filter((r) => HOUSE_RULES_OPTIONS.includes(r));
        const has = selectedPredefined.includes(rule);
        const newPredefined = has ? selectedPredefined.filter((x) => x !== rule) : [...selectedPredefined, rule];
        updatePropertyForm("houseRules", [...newPredefined, ...customRules]);
      },
      className: `px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${propertyForm.houseRules.includes(rule) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`
    },
    rule
  ))), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      className: "input w-full min-h-[100px]",
      placeholder: "Add other rules (e.g. No alcohol, No guests after 9 PM...)",
      value: customHouseRulesDraft,
      onChange: (e) => setCustomHouseRulesDraft(e.target.value),
      onBlur: syncHouseRulesFromDraft
    }
  ), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, "Separate custom rules with commas."))), step === 8 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-lg" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-semibold text-gray-700" }, "Please provide the following documents"), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3" }, propertyForm.documents.map((doc, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "p-4 border border-gray-200 rounded-2xl bg-white hover:border-emerald-200 transition-colors shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-gray-900" }, doc.name), /* @__PURE__ */ React.createElement("div", { className: `text-xs mt-0.5 ${doc.required ? "text-red-500 font-semibold" : "text-gray-400"}` }, doc.required ? "Required *" : "Optional")), doc.fileUrl ? /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 text-emerald-700 p-1.5 rounded-full" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 18 })) : /* @__PURE__ */ React.createElement("div", { className: "bg-gray-100 text-gray-400 p-1.5 rounded-full" }, /* @__PURE__ */ React.createElement(FileText, { size: 18 }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
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
  )))))), step === 9 && /* @__PURE__ */ React.createElement("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex gap-4 items-center" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white text-emerald-600 p-3 rounded-2xl shadow-sm" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 24 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-900" }, "Review Your Listing"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-600 mt-0.5" }, "Please check all details before submitting for approval."))), error && /* @__PURE__ */ React.createElement("div", { className: "p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium" }, error), /* @__PURE__ */ React.createElement("div", { className: "space-y-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-4" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Basic Information"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(1), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-4" }, propertyForm.coverImage && /* @__PURE__ */ React.createElement("img", { src: propertyForm.coverImage, className: "w-20 h-20 rounded-xl object-cover" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg font-bold text-emerald-900 leading-tight" }, propertyForm.propertyName || "No Name"), /* @__PURE__ */ React.createElement("div", { className: "text-xs text-gray-500 mt-1 line-clamp-2" }, propertyForm.shortDescription || "No description"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-tighter" }, "Contact: ", propertyForm.contactNumber || "N/A"), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-tighter" }, propertyForm.suitability || "General")))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Location & Nearby"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(2), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 text-sm text-gray-700 items-start" }, /* @__PURE__ */ React.createElement(MapPin, { size: 16, className: "text-gray-400 shrink-0 mt-0.5" }), /* @__PURE__ */ React.createElement("span", null, propertyForm.address.fullAddress || "No address provided")), propertyForm.nearbyPlaces.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2 pt-2" }, propertyForm.nearbyPlaces.map((p, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-100" }, p.name, " (", p.distanceKm, "km)"))))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-sm font-bold text-gray-900 uppercase tracking-wider" }, "Villa Inventory (", roomTypes.length, ")"), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(6), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")), /* @__PURE__ */ React.createElement("div", { className: "divide-y divide-gray-50" }, roomTypes.map((rt, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "py-2 first:pt-0 last:pb-0 flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-sm font-bold text-gray-800" }, rt.name), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400" }, "Inventory: ", rt.totalInventory, " \xB7 ", rt.maxAdults, "A, ", rt.maxChildren, "C")), /* @__PURE__ */ React.createElement("div", { className: "text-emerald-600 font-extrabold text-sm" }, "\u20B9 ", rt.pricePerNight))), roomTypes.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "text-xs text-red-500 font-medium py-2" }, "No inventory added yet!"))), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" }, "Amenities"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1" }, propertyForm.amenities.slice(0, 4).map((a) => /* @__PURE__ */ React.createElement("span", { key: a, className: "px-1.5 py-0.5 bg-gray-50 text-gray-600 text-[9px] font-bold rounded border border-gray-100" }, a)), propertyForm.amenities.length > 4 && /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400" }, "+", propertyForm.amenities.length - 4, " more"))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-5 shadow-sm" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xs font-bold text-gray-400 uppercase tracking-wider mb-2" }, "Rules & Policy"), /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-600" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Check-in:"), " ", propertyForm.checkInTime || "--:--"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-600" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold" }, "Check-out:"), " ", propertyForm.checkOutTime || "--:--"), /* @__PURE__ */ React.createElement("div", { className: "text-[9px] text-gray-400 line-clamp-1 italic mt-1" }, propertyForm.cancellationPolicy || "No policy")))), /* @__PURE__ */ React.createElement("div", { className: "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400" }, /* @__PURE__ */ React.createElement(FileText, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "text-xs font-bold text-gray-900" }, "Required Documents"), /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-500" }, propertyForm.documents.filter((d) => d.fileUrl).length, " of ", propertyForm.documents.length, " uploaded"))), /* @__PURE__ */ React.createElement("button", { onClick: () => setStep(8), className: "text-emerald-600 text-xs font-bold hover:underline" }, "Edit")))), step === 10 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center py-12 text-center space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center transition-all animate-bounce" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 48 })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("h2", { className: "text-3xl font-extrabold text-gray-900" }, "Registration Submitted!"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 max-w-sm mx-auto" }, "Your villa registration has been sent for verification. Our team will review it and get back to you shortly.")), /* @__PURE__ */ React.createElement(
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
export default AddVillaWizard;
