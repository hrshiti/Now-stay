import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { propertyService, legalService, reviewService, offerService, availabilityService, userService } from "../../services/apiService";
import {
  MapPin,
  Star,
  Share2,
  Heart,
  ArrowLeft,
  Users,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Tag,
  X,
  Gift,
  CheckCircle,
  Shield,
  Info,
  Clock,
  Wifi,
  Coffee,
  Car
} from "lucide-react";
import toast from "react-hot-toast";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const canReview = new URLSearchParams(location.search).get("canReview") === "true";
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`property_draft_${id}`));
      if (saved && saved.guests) return saved.guests;
      const searchSaved = JSON.parse(sessionStorage.getItem("homeSearchData"));
      if (searchSaved && searchSaved.guests) return searchSaved.guests;
    } catch (e) {
    }
    return { rooms: 1, adults: 2, children: 0 };
  });
  const [dates, setDates] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`property_draft_${id}`));
      if (saved && saved.dates && saved.dates.checkIn && saved.dates.checkOut) return saved.dates;
      const searchSaved = JSON.parse(sessionStorage.getItem("homeSearchData"));
      if (searchSaved && searchSaved.dates && searchSaved.dates.checkIn && searchSaved.dates.checkOut) return searchSaved.dates;
    } catch (e) {
    }
    return { checkIn: "", checkOut: "" };
  });
  const [selectedRoom, setSelectedRoom] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`property_draft_${id}`));
      if (saved && saved.selectedRoom) return saved.selectedRoom;
    } catch (e) {
    }
    return null;
  });
  useEffect(() => {
    if (id) {
      sessionStorage.setItem(`property_draft_${id}`, JSON.stringify({
        dates,
        guests,
        selectedRoom
      }));
    }
  }, [id, dates, guests, selectedRoom]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const checkAvailability = async (directCall = false) => {
    if (!dates.checkIn || !dates.checkOut || !selectedRoom) {
      if (directCall) {
        toast.error("Please select dates and room first");
      }
      setAvailability(null);
      return null;
    }
    setCheckingAvailability(true);
    try {
      const response = await availabilityService.check({
        propertyId: id,
        roomTypeId: selectedRoom._id,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        rooms: guests.rooms
      });
      let result = null;
      if (Array.isArray(response)) {
        const roomAvail = response.find((r) => String(r.roomTypeId) === String(selectedRoom._id));
        if (roomAvail) {
          const requiredUnits = guests.rooms || 1;
          if (roomAvail.availableUnits >= requiredUnits) {
            result = { available: true, unitsLeft: roomAvail.availableUnits };
          } else {
            result = { available: false, message: `Only ${roomAvail.availableUnits} units available`, unitsLeft: roomAvail.availableUnits };
          }
        } else {
          result = { available: false, message: "Sold Out for these dates", unitsLeft: 0 };
        }
      } else {
        result = response;
      }
      setAvailability(result);
      return result;
    } catch (error) {
      console.error("Availability check failed:", error);
      const errorResult = { available: false, message: error.message || "Unable to verify availability" };
      setAvailability(errorResult);
      return errorResult;
    } finally {
      setCheckingAvailability(false);
    }
  };
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });
  const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  useEffect(() => {
    if (showOffersModal || showImageModal) {
      if (window.lenis) window.lenis.stop();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      if (window.lenis) window.lenis.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [showOffersModal, showImageModal]);
  useEffect(() => {
    legalService.getFinancialSettings().then((res) => {
      if (res.success) setTaxRate(res.taxRate || 0);
    }).catch((err) => console.error("Failed to fetch tax rate", err));
  }, []);
  const loadPropertyDetails = async () => {
    try {
      const response = await propertyService.getDetails(id);
      if (response && response.property) {
        const p = response.property;
        const rts = response.roomTypes || [];
        const adapted = {
          ...p,
          _id: p._id,
          name: p.propertyName,
          description: p.shortDescription || p.description,
          address: p.address,
          avgRating: p.avgRating || 0,
          images: { cover: p.coverImage, gallery: p.propertyImages || [] },
          propertyType: p.propertyType ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1) : "",
          propertyTemplate: p.propertyTemplate || p.propertyType || "",
          amenities: p.amenities || [],
          inventory: rts.map((rt) => ({
            _id: rt._id,
            type: rt.name,
            price: rt.pricePerNight,
            description: rt.description || "",
            amenities: rt.amenities || [],
            maxAdults: rt.maxAdults,
            maxChildren: rt.maxChildren,
            baseAdults: rt.baseAdults ?? 2,
            baseChildren: rt.baseChildren ?? 0,
            images: rt.images || [],
            pricing: { basePrice: rt.pricePerNight, extraAdultPrice: rt.extraAdultPrice, extraChildPrice: rt.extraChildPrice },
            inventoryType: rt.inventoryType || (["hostel", "pg"].includes(p.propertyTemplate || p.propertyType) ? "bed" : "room"),
            totalInventory: rt.totalInventory,
            bedsPerRoom: rt.bedsPerRoom
          })),
          policies: {
            checkInTime: p.checkInTime,
            checkOutTime: p.checkOutTime,
            cancellationPolicy: p.cancellationPolicy,
            houseRules: p.houseRules,
            petsAllowed: p.petsAllowed,
            suitability: p.suitability
          },
          config: {
            pgType: p.pgType,
            resortType: p.resortType,
            foodType: p.foodType,
            mealsIncluded: p.mealsIncluded,
            noticePeriod: p.noticePeriod,
            hotelCategory: p.hotelCategory,
            starRating: p.starRating
          }
        };
        setProperty(adapted);
        const isWholeUnitType = p.propertyTemplate === "villa" || ["homestay", "apartment"].includes(p.propertyTemplate) && rts.length <= 1;
        const hasSingleInventory = adapted.inventory && adapted.inventory.length === 1;
        if (isWholeUnitType || hasSingleInventory) {
          if (adapted.inventory && adapted.inventory.length > 0) {
            setSelectedRoom(adapted.inventory[0]);
          } else if (isWholeUnitType) {
            const virtualRoom = {
              _id: "virtual-whole-unit-" + p._id,
              type: p.propertyName || "Whole Unit",
              price: p.minPrice || 0,
              pricing: { basePrice: p.minPrice || 0 },
              description: p.shortDescription || "Full Property Booking",
              amenities: p.amenities || []
            };
            setSelectedRoom(virtualRoom);
          }
        }
      } else {
        setProperty(response);
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadPropertyDetails();
  }, [id]);
  const pTemplate = property?.propertyTemplate?.toLowerCase() || "";
  const propertyType = property?.propertyType;
  const isBedBased = ["hostel", "pg"].includes(pTemplate);
  useEffect(() => {
    if (isBedBased) {
      setGuests((prev) => ({ ...prev, adults: prev.rooms, children: 0 }));
    }
  }, [guests.rooms, isBedBased]);
  useEffect(() => {
    if (id) {
      fetchReviews();
      fetchOffers();
    }
  }, [id]);
  const fetchOffers = async () => {
    try {
      const data = await offerService.getActive();
      setOffers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch offers");
    }
  };
  useEffect(() => {
    if (localStorage.getItem("token")) {
      userService.getSavedHotels().then((res) => {
        const list = res.data || res.savedHotels || [];
        if (Array.isArray(list)) {
          const found = list.some((h) => (typeof h === "object" ? h._id : h) === id);
          setIsSaved(found);
        }
      }).catch((err) => console.error("Failed to fetch saved status", err));
    }
  }, [id]);
  const handleToggleSave = async () => {
    if (!localStorage.getItem("token")) {
      toast.error("Please login to save properties");
      return;
    }
    try {
      const newState = !isSaved;
      setIsSaved(newState);
      await userService.toggleSavedHotel(id);
      toast.success(newState ? "Added to wishlist" : "Removed from wishlist");
    } catch (err) {
      setIsSaved(!isSaved);
      toast.error("Failed to update wishlist");
    }
  };
  const handleShare = async () => {
    const shareData = {
      title: property?.name || "NowStay",
      text: `Check out ${property?.name || "this amazing place"} on NowStay!`,
      url: window.location.href
    };
    if (window.flutter_inappwebview || navigator.userAgent.includes("FlutterWebView")) {
      import("../../utils/flutterBridge").then(({ shareViaFlutter }) => {
        shareViaFlutter(shareData).catch((err) => {
          console.error("Flutter share failed:", err);
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        });
      });
    } else if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };
  const fetchReviews = async () => {
    try {
      const data = await reviewService.getPropertyReviews(id);
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews");
    }
  };
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!localStorage.getItem("token")) {
      toast.error("Please login to submit a review");
      return;
    }
    setSubmitReviewLoading(true);
    try {
      await reviewService.createReview({
        propertyId: id,
        ...reviewData
      });
      toast.success("Review submitted!");
      setReviewData({ rating: 5, comment: "" });
      setShowReviewForm(false);
      fetchReviews();
      loadPropertyDetails();
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmitReviewLoading(false);
    }
  };
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedRoom]);
  if (loading) return /* @__PURE__ */ React.createElement("div", { className: "h-screen flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-surface", size: 40 }));
  if (!property) return /* @__PURE__ */ React.createElement("div", { className: "h-screen flex items-center justify-center" }, "Property not found");
  const {
    _id,
    name,
    address,
    images,
    description,
    avgRating: rating,
    inventory,
    amenities,
    policies,
    config
  } = property;
  const hasInventory = inventory && inventory.length > 0;
  const isWholeUnit = pTemplate === "villa" || ["homestay", "apartment"].includes(pTemplate) && !hasInventory;
  const getNightBreakup = (room) => {
    if (!room || !room.pricing) {
      return { nights: 0, weekdayNights: 0, weekendNights: 0, perNight: getRoomPrice(room) };
    }
    const { basePrice, weekendPrice } = room.pricing;
    if (!dates.checkIn || !dates.checkOut) {
      const base = typeof basePrice === "number" ? basePrice : typeof weekendPrice === "number" ? weekendPrice : getRoomPrice(room);
      return { nights: 0, weekdayNights: 0, weekendNights: 0, perNight: base };
    }
    const start = new Date(dates.checkIn);
    const end = new Date(dates.checkOut);
    if (isNaN(start) || isNaN(end) || end <= start) {
      const base = typeof basePrice === "number" ? basePrice : typeof weekendPrice === "number" ? weekendPrice : getRoomPrice(room);
      return { nights: 0, weekdayNights: 0, weekendNights: 0, perNight: base };
    }
    let current = new Date(start);
    let nights = 0;
    let weekdayNights = 0;
    let weekendNights = 0;
    let total = 0;
    while (current < end) {
      const day = current.getDay();
      const isWeekendDay = day === 5 || day === 6;
      const dayPrice = isWeekendDay && typeof weekendPrice === "number" ? weekendPrice : typeof basePrice === "number" ? basePrice : getRoomPrice(room);
      total += dayPrice;
      nights += 1;
      if (isWeekendDay) weekendNights += 1;
      else weekdayNights += 1;
      current.setDate(current.getDate() + 1);
    }
    const perNight = nights > 0 ? Math.round(total / nights) : getRoomPrice(room);
    return { nights, weekdayNights, weekendNights, perNight };
  };
  const getRoomPrice = (room) => {
    if (!room) return null;
    if (room.pricing) {
      if (typeof room.pricing.basePrice === "number") return room.pricing.basePrice;
      if (typeof room.pricing.weekendPrice === "number") return room.pricing.weekendPrice;
    }
    return room.price || null;
  };
  const getExtraPricingLabels = (room) => {
    if (!room || !room.pricing) return [];
    const labels = [];
    if (typeof room.pricing.extraAdultPrice === "number") {
      labels.push(`Extra adult: \u20B9${room.pricing.extraAdultPrice} / night`);
    }
    if (typeof room.pricing.extraChildPrice === "number") {
      labels.push(`Extra child: \u20B9${room.pricing.extraChildPrice} / night`);
    }
    return labels;
  };
  const getMaxAdults = () => {
    if (selectedRoom) {
      return (selectedRoom.maxAdults || 12) * (isWholeUnit ? 1 : guests.rooms);
    }
    if (isWholeUnit) return property.structure?.maxGuests || property.maxGuests || 12;
    if (isBedBased) return guests.rooms;
    if (propertyType === "Resort") return guests.rooms * 4;
    return guests.rooms * 3;
  };
  const getMaxChildren = () => {
    if (selectedRoom) {
      if (selectedRoom.maxChildren !== void 0) {
        return selectedRoom.maxChildren * (isWholeUnit ? 1 : guests.rooms);
      }
    }
    if (isBedBased) return 0;
    if (isWholeUnit) return 6;
    return guests.rooms * 2;
  };
  const getUnitLabel = () => {
    if (isBedBased) return "Beds";
    if (pTemplate === "tent") return "Tents";
    if (pTemplate === "homestay" || pTemplate === "villa") return "Units";
    return "Rooms";
  };
  const getGalleryImages = () => {
    if (selectedRoom && !isWholeUnit && selectedRoom.images && selectedRoom.images.length > 0) {
      return selectedRoom.images.map((img) => typeof img === "string" ? img : img.url).filter(Boolean);
    }
    const list = [];
    if (images?.cover) list.push(images.cover);
    if (Array.isArray(images?.gallery)) list.push(...images.gallery);
    if (list.length > 0) return list;
    return ["https://via.placeholder.com/800x600"];
  };
  const galleryImages = getGalleryImages();
  const mainImage = galleryImages[Math.min(currentImageIndex, Math.max(galleryImages.length - 1, 0))];
  const activeRoom = selectedRoom || (hasInventory ? inventory[0] : null);
  const stayPricing = getNightBreakup(activeRoom);
  const bookingRoom = selectedRoom || activeRoom;
  const extraPricingLabels = getExtraPricingLabels(bookingRoom);
  const baseAdultsPerUnit = selectedRoom?.baseAdults ?? (selectedRoom?.maxAdults || property?.maxGuests || 2);
  const baseChildrenPerUnit = selectedRoom?.baseChildren ?? (selectedRoom?.maxChildren !== void 0 ? selectedRoom?.maxChildren : 0);
  const getPriceBreakdown = () => {
    let effectiveRoom = selectedRoom;
    if (!effectiveRoom && property) {
      effectiveRoom = {
        _id: "fallback-" + property._id,
        pricing: { basePrice: property.minPrice || 0 },
        price: property.minPrice || 0
      };
    }
    if (!effectiveRoom || !dates.checkIn || !dates.checkOut) return null;
    const currentSelectedRoom = effectiveRoom;
    const { nights, perNight } = stayPricing;
    if (nights === 0) return null;
    const units = isWholeUnit ? 1 : guests.rooms;
    const extraAdultsCount = Math.max(0, guests.adults - baseAdultsPerUnit * units);
    const extraChildrenCount = Math.max(0, guests.children - baseChildrenPerUnit * units);
    const pricePerNight = getRoomPrice(currentSelectedRoom);
    const extraAdultPrice = currentSelectedRoom.pricing?.extraAdultPrice || 0;
    const extraChildPrice = currentSelectedRoom.pricing?.extraChildPrice || 0;
    const totalBasePrice = pricePerNight * nights * units;
    const totalExtraAdultCharge = extraAdultsCount * extraAdultPrice * nights;
    const totalExtraChildCharge = extraChildrenCount * extraChildPrice * nights;
    const grossAmount = totalBasePrice + totalExtraAdultCharge + totalExtraChildCharge;
    let discountAmount = 0;
    if (appliedOffer) {
      if (grossAmount >= (appliedOffer.minBookingAmount || 0)) {
        if (appliedOffer.discountType === "percentage") {
          discountAmount = grossAmount * appliedOffer.discountValue / 100;
          if (appliedOffer.maxDiscount) {
            discountAmount = Math.min(discountAmount, appliedOffer.maxDiscount);
          }
        } else {
          discountAmount = appliedOffer.discountValue;
        }
        discountAmount = Math.floor(discountAmount);
      } else {
        discountAmount = 0;
      }
    }
    discountAmount = Math.min(discountAmount, grossAmount);
    const commissionableAmount = grossAmount;
    const taxableAmount = grossAmount - discountAmount;
    const taxAmount = Math.round(commissionableAmount * taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;
    return {
      nights,
      units,
      baseAdultsPerUnit,
      extraAdultsCount,
      extraChildrenCount,
      pricePerNight,
      extraAdultPrice,
      extraChildPrice,
      totalBasePrice,
      totalExtraAdultCharge,
      totalExtraChildCharge,
      grossAmount,
      discountAmount,
      couponCode: appliedOffer && discountAmount > 0 ? appliedOffer.code : null,
      commissionableAmount,
      taxableAmount,
      taxAmount,
      grandTotal
    };
  };
  const baseBookingBarPrice = stayPricing.nights > 0 ? stayPricing.perNight : getRoomPrice(bookingRoom) || property.minPrice || 0;
  const previewUnits = isWholeUnit ? 1 : guests.rooms;
  const previewExtraAdults = Math.max(0, guests.adults - baseAdultsPerUnit * previewUnits);
  const previewExtraChildren = Math.max(0, guests.children - baseChildrenPerUnit * previewUnits);
  const previewExtraAdultPrice = bookingRoom?.pricing?.extraAdultPrice || bookingRoom?.extraAdultPrice || 0;
  const previewExtraChildPrice = bookingRoom?.pricing?.extraChildPrice || bookingRoom?.extraChildPrice || 0;
  const bookingBarPrice = baseBookingBarPrice + previewExtraAdults * previewExtraAdultPrice + previewExtraChildren * previewExtraChildPrice;
  const priceBreakdown = getPriceBreakdown();
  const handlePrevImage = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };
  const handleNextImage = () => {
    if (galleryImages.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };
  const handleBook = async () => {
    const newErrors = {};
    if (!dates.checkIn || !dates.checkOut) newErrors.dates = true;
    if (!selectedRoom) newErrors.room = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please select dates and room to continue");
      return;
    }
    setErrors({});
    let currentAvailability = availability;
    if (!currentAvailability || checkingAvailability) {
      currentAvailability = await checkAvailability();
    }
    if (!currentAvailability || currentAvailability.available !== true) {
      toast.error(currentAvailability?.message || "Selected room is not available for these dates");
      return;
    }
    if (!priceBreakdown) {
      toast.error("Unable to calculate price. Please check dates.");
      return;
    }
    navigate("/checkout", {
      state: {
        property,
        selectedRoom,
        dates,
        guests: {
          ...guests,
          rooms: guests.rooms
        },
        priceBreakdown,
        taxRate,
        couponCode: priceBreakdown.couponCode
      }
    });
  };
  const handleApplyOffer = (offer) => {
    const gross = priceBreakdown ? priceBreakdown.grossAmount : bookingBarPrice || 0;
    if (offer.minBookingAmount && gross < offer.minBookingAmount) {
      toast.error(`Min booking amount of \u20B9${offer.minBookingAmount} required`);
      return;
    }
    setAppliedOffer(offer);
    setShowOffersModal(false);
    toast.success(`'${offer.code}' applied!`);
  };
  const handleRemoveOffer = () => {
    setAppliedOffer(null);
    toast.success("Coupon removed");
  };
  return /* @__PURE__ */ React.createElement("div", { className: "bg-emerald-100 min-h-screen pb-24" }, /* @__PURE__ */ React.createElement("div", { className: "relative h-[40vh] md:h-[50vh] cursor-zoom-in group" }, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "w-full h-full relative",
      style: { touchAction: "none" },
      drag: "x",
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.5,
      dragMomentum: false,
      animate: { x: 0 },
      transition: { type: "spring", stiffness: 300, damping: 30 },
      onDragEnd: (e, info) => {
        const swipeThreshold = 30;
        const velocityThreshold = 500;
        if (Math.abs(info.velocity.x) > velocityThreshold) {
          if (info.velocity.x < 0) {
            handleNextImage();
          } else {
            handlePrevImage();
          }
          return;
        }
        if (info.offset.x < -swipeThreshold) {
          handleNextImage();
        } else if (info.offset.x > swipeThreshold) {
          handlePrevImage();
        }
      },
      onClick: () => setShowImageModal(true)
    },
    /* @__PURE__ */ React.createElement(AnimatePresence, { mode: "wait" }, /* @__PURE__ */ React.createElement(
      motion.img,
      {
        key: currentImageIndex,
        initial: { opacity: 0.8, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0.8, x: -20 },
        transition: { duration: 0.2, ease: "easeOut" },
        src: mainImage,
        alt: name,
        className: "w-full h-full object-cover pointer-events-none"
      }
    ))
  ), galleryImages.length > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handlePrevImage,
      className: "absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { size: 20 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleNextImage,
      className: "absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full"
    },
    /* @__PURE__ */ React.createElement(ChevronRight, { size: 20 })
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute bottom-3 left-0 right-0 flex justify-center gap-1" }, galleryImages.map((_, index) => /* @__PURE__ */ React.createElement(
    "span",
    {
      key: index,
      className: `w-2 h-2 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 left-4 z-10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate("/listings");
        }
      },
      className: "bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors cursor-pointer"
    },
    /* @__PURE__ */ React.createElement(ArrowLeft, { size: 20, className: "text-surface" })
  )), /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 right-4 flex gap-2 z-10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleShare,
      className: "bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
    },
    /* @__PURE__ */ React.createElement(Share2, { size: 20, className: "text-surface" })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleToggleSave,
      className: "bg-white/90 p-2 rounded-full shadow-md hover:bg-white transition-colors"
    },
    /* @__PURE__ */ React.createElement(
      Heart,
      {
        size: 20,
        className: `${isSaved ? "fill-red-500 text-red-500" : "text-surface"}`
      }
    )
  ))), /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto px-0 md:px-5 -mt-10 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white/80 backdrop-blur-xl rounded-t-3xl md:rounded-3xl shadow-[0_-10px_60px_-15px_rgba(0,40,40,0.1)] p-5 pb-32 md:p-8 min-h-screen md:min-h-fit border border-white/50" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "bg-surface/10 text-surface text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider" }, propertyType), rating !== void 0 && rating !== null && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1 bg-honey/10 text-honey-dark px-2 py-0.5 rounded text-[10px] font-bold" }, Number(rating) > 0 && /* @__PURE__ */ React.createElement(Star, { size: 10, className: "fill-honey text-honey" }), Number(rating) > 0 ? Number(rating).toFixed(1) : "New")), /* @__PURE__ */ React.createElement("h1", { className: "text-xl md:text-3xl font-bold text-textDark mb-1 leading-tight" }, name), /* @__PURE__ */ React.createElement("div", { className: "flex items-start gap-1.5 text-gray-500 text-xs md:text-sm" }, /* @__PURE__ */ React.createElement(MapPin, { size: 14, className: "mt-0.5 shrink-0" }), /* @__PURE__ */ React.createElement("span", { className: "line-clamp-3 md:line-clamp-1" }, address?.fullAddress))), /* @__PURE__ */ React.createElement("div", { className: "hidden md:block text-right" }, /* @__PURE__ */ React.createElement("p", { className: "text-sm text-gray-500" }, "Starting from"), /* @__PURE__ */ React.createElement("p", { className: "text-2xl font-bold text-surface" }, "\u20B9", stayPricing.perNight || getRoomPrice(activeRoom) || property.minPrice || "N/A"), stayPricing.nights > 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[11px] text-gray-400" }, stayPricing.nights, " nights (", stayPricing.weekdayNights, " weekday, ", stayPricing.weekendNights, " weekend)"))), /* @__PURE__ */ React.createElement("hr", { className: "border-gray-100 mb-6" }), /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark mb-3" }, "About this place"), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 leading-relaxed text-sm md:text-base" }, description || "No description available.")), (() => {
    const validPropertyAmenities = amenities?.filter((item) => item && typeof item === "string" && item.trim().length > 0) || [];
    const validRoomAmenities = selectedRoom && selectedRoom.amenities ? selectedRoom.amenities.filter((item) => item && typeof item === "string" && item.trim().length > 0) : [];
    return /* @__PURE__ */ React.createElement("div", { className: "mb-8 space-y-6" }, validPropertyAmenities.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark mb-3" }, "Property Amenities"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4" }, validPropertyAmenities.map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center gap-3 text-gray-600 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-gray-50 rounded-lg shrink-0" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 16, className: "text-surface" })), /* @__PURE__ */ React.createElement("span", null, item))))), validRoomAmenities.length > 0 && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark mb-3" }, "Room Amenities"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4" }, validRoomAmenities.map((item, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center gap-3 text-gray-600 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "p-2 bg-gray-50 rounded-lg shrink-0" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 16, className: "text-surface" })), /* @__PURE__ */ React.createElement("span", null, item))))));
  })(), pTemplate === "pg" && config && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-yellow-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-yellow-900 mb-2" }, "PG Details"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-yellow-800 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, "Type: ", config.pgType), /* @__PURE__ */ React.createElement("li", null, "Food: ", config.mealsIncluded === "Yes" ? `Included (${config.foodType})` : "Not Included"), /* @__PURE__ */ React.createElement("li", null, "Notice Period: ", config.noticePeriod), config.laundryService && /* @__PURE__ */ React.createElement("li", null, "Laundry: ", config.laundryService), config.housekeeping && /* @__PURE__ */ React.createElement("li", null, "Housekeeping: ", config.housekeeping)))), pTemplate === "hotel" && config && (config.hotelCategory || config.starRating) && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-blue-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-blue-900 mb-2" }, "Hotel Info"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-blue-800 space-y-1" }, config.hotelCategory && /* @__PURE__ */ React.createElement("li", null, "Category: ", config.hotelCategory), config.starRating && /* @__PURE__ */ React.createElement("li", null, "Rating: ", config.starRating, " Stars")))), pTemplate === "tent" && (property.tentType || property.washroomType || property.viewType) && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-emerald-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-emerald-900 mb-2" }, "Tent Details"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-emerald-800 space-y-1" }, property.tentType && /* @__PURE__ */ React.createElement("li", { className: "capitalize" }, "Type: ", property.tentType), property.washroomType && /* @__PURE__ */ React.createElement("li", { className: "capitalize" }, "Washroom: ", property.washroomType), property.viewType && /* @__PURE__ */ React.createElement("li", { className: "capitalize" }, "View: ", property.viewType)))), pTemplate === "villa" && (property.structure || config) && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-green-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-green-900 mb-2" }, "Villa Structure"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-green-800 space-y-1" }, property.structure ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("li", null, "Bedrooms: ", property.structure.bedrooms), /* @__PURE__ */ React.createElement("li", null, "Bathrooms: ", property.structure.bathrooms), /* @__PURE__ */ React.createElement("li", null, "Max Guests: ", property.structure.maxGuests), /* @__PURE__ */ React.createElement("li", null, "Kitchen: ", property.structure.kitchenAvailable ? "Available" : "No")) : /* @__PURE__ */ React.createElement("li", null, "Details available on request"))), selectedRoom && /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-white rounded-xl border border-gray-200" }, /* @__PURE__ */ React.createElement("h3", { className: "text-gray-500 text-sm mb-1" }, "Price per night"), /* @__PURE__ */ React.createElement("div", { className: "text-2xl font-bold text-surface mb-2" }, "\u20B9", (getRoomPrice(selectedRoom) || 0).toLocaleString()), /* @__PURE__ */ React.createElement("div", { className: "text-sm text-gray-500" }, /* @__PURE__ */ React.createElement("div", null, "Extra adult: \u20B9", selectedRoom.pricing?.extraAdultPrice || selectedRoom.extraAdultPrice || 0, " / night \u2022"), /* @__PURE__ */ React.createElement("div", null, "Extra child: \u20B9", selectedRoom.pricing?.extraChildPrice || selectedRoom.extraChildPrice || 0, " / night")))), pTemplate === "resort" && config && /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-4 mb-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-teal-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-teal-900 mb-2" }, "Resort Highlights"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-teal-800 space-y-1" }, /* @__PURE__ */ React.createElement("li", { className: "capitalize" }, "Theme: ", property.resortType || "Not specified"), property.suitability && property.suitability !== "none" && /* @__PURE__ */ React.createElement("li", null, "Suitability: ", property.suitability))), property.mealPlans && property.mealPlans.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-orange-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-orange-900 mb-2" }, "Meal Plans"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, property.mealPlans.map((plan, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full" }, plan.mealType))))), property.activities && property.activities.filter((a) => a && (typeof a === "string" ? a.trim() : a.name)).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-indigo-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-indigo-900 mb-2" }, "Activities"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2" }, property.activities.filter((a) => a && (typeof a === "string" ? a.trim() : a.name)).map((act, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "text-sm text-indigo-800" }, typeof act === "string" ? /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, act) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold" }, act.name), act.type && /* @__PURE__ */ React.createElement("span", { className: "text-xs ml-1 opacity-75" }, "(", act.type, ")"))))))), pTemplate === "homestay" && config && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-amber-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-amber-900 mb-2" }, "Homestay Experience"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-amber-800 space-y-1" }, property.hostName && /* @__PURE__ */ React.createElement("li", null, "Host: ", property.hostName), /* @__PURE__ */ React.createElement("li", null, "Food: ", config.foodType, " (", config.mealsAvailable === "Yes" ? "Available" : "Not Available", ")"), /* @__PURE__ */ React.createElement("li", null, "Shared Areas: ", config.sharedAreas ? "Yes" : "No"), config.idealFor && config.idealFor.length > 0 && /* @__PURE__ */ React.createElement("li", null, "Ideal For: ", Array.isArray(config.idealFor) ? config.idealFor.join(", ") : config.idealFor), config.stayExperience && /* @__PURE__ */ React.createElement("li", null, "Experience: ", config.stayExperience)))), pTemplate === "hostel" && config && /* @__PURE__ */ React.createElement("div", { className: "mb-8 grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-purple-50 rounded-xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-purple-900 mb-2" }, "Hostel Info"), /* @__PURE__ */ React.createElement("ul", { className: "text-sm text-purple-800 space-y-1" }, /* @__PURE__ */ React.createElement("li", null, "Type: ", config.hostelType), /* @__PURE__ */ React.createElement("li", null, "Curfew: ", config.curfewTime || "No Curfew"), /* @__PURE__ */ React.createElement("li", null, "Age Restriction: ", config.ageRestriction ? "Yes" : "No")))), !isWholeUnit && inventory && inventory.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h2", { className: `text-lg font-bold ${errors.room ? "text-red-500" : "text-textDark"} mb-4 flex items-center gap-2` }, isBedBased ? "Choose your Bed/Room" : "Choose your room", errors.room && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-black" }, "Selection Required")), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-4" }, inventory.map((room) => /* @__PURE__ */ React.createElement(
    motion.div,
    {
      key: room._id,
      whileHover: { scale: 1.01, translateY: -2 },
      whileTap: { scale: 0.99 },
      onClick: () => {
        setSelectedRoom(room);
        if (errors.room) setErrors((prev) => ({ ...prev, room: false }));
      },
      className: `
                      border-2 rounded-xl p-5 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between
                      ${selectedRoom?._id === room._id ? "border-surface bg-surface/5 shadow-md shadow-surface/10" : "border-gray-200 hover:border-surface/40 hover:shadow-lg"}
                    `
    },
    selectedRoom?._id === room._id && /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 bg-surface text-white p-1.5 rounded-bl-xl shadow-sm" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 16 })),
    /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start mb-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-lg text-textDark mb-1" }, room.type), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 line-clamp-2" }, room.description || `Comfortable ${room.type}`)), /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("span", { className: "block font-bold text-xl text-surface" }, "\u20B9", getRoomPrice(room) || "N/A"), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-gray-400 font-medium" }, "per night"))), getExtraPricingLabels(room).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "text-[11px] text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg space-y-1" }, getExtraPricingLabels(room).map((label, index) => /* @__PURE__ */ React.createElement("div", { key: index, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-gray-300" }), label))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 flex-wrap mb-4" }, room.amenities?.filter((a) => a && typeof a === "string" && a.trim()).map((am, i) => /* @__PURE__ */ React.createElement("span", { key: i, className: "text-[10px] bg-gray-100 px-2.5 py-1 rounded-full text-gray-600 font-medium" }, am)))),
    /* @__PURE__ */ React.createElement("div", { className: `
                      w-full py-2.5 rounded-lg text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
                      ${selectedRoom?._id === room._id ? "bg-surface text-white border-surface" : "bg-white text-surface border-surface/20 group-hover:border-surface"}
                    ` }, selectedRoom?._id === room._id ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(CheckCircle, { size: 16 }), "Selected") : "Select Room")
  )))), /* @__PURE__ */ React.createElement("div", { className: `mb-8 p-4 rounded-xl border-2 transition-all ${errors.dates ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-3" }, /* @__PURE__ */ React.createElement("h3", { className: `font-bold ${errors.dates ? "text-red-600" : "text-textDark"}` }, "Trip Details"), errors.dates && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-red-500 font-black uppercase tracking-widest" }, "Select Dates")), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "col-span-1" }, /* @__PURE__ */ React.createElement(
    ModernDatePicker,
    {
      label: "Check-in",
      date: dates.checkIn,
      onChange: (newDate) => {
        setDates({ ...dates, checkIn: newDate });
        if (errors.dates) setErrors((prev) => ({ ...prev, dates: false }));
      },
      minDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      placeholder: "Select Check-in"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "col-span-1" }, /* @__PURE__ */ React.createElement(
    ModernDatePicker,
    {
      label: "Check-out",
      date: dates.checkOut,
      onChange: (newDate) => {
        setDates({ ...dates, checkOut: newDate });
        if (errors.dates) setErrors((prev) => ({ ...prev, dates: false }));
      },
      minDate: dates.checkIn ? new Date(new Date(dates.checkIn).getTime() + 864e5).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      placeholder: "Select Check-out",
      align: "right"
    }
  )), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 md:col-span-2 space-y-4" }, !isWholeUnit && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-xl" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-bold text-gray-800 block" }, getUnitLabel()), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Based on availability")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, rooms: Math.max(1, prev.rooms - 1) })),
      className: "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-600 active:scale-90 transition-transform"
    },
    "-"
  ), /* @__PURE__ */ React.createElement("span", { className: "w-4 text-center font-bold" }, guests.rooms), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, rooms: Math.min((selectedRoom?.inventoryType === "bed" ? selectedRoom?.totalInventory * (selectedRoom?.bedsPerRoom || 1) : selectedRoom?.totalInventory) || 10, prev.rooms + 1) })),
      className: "w-8 h-8 rounded-full border border-surface flex items-center justify-center bg-white text-surface active:scale-90 transition-transform"
    },
    "+"
  ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-xl" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-bold text-gray-800 block" }, "Adults"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Ages 12+"), guests.adults > baseAdultsPerUnit * guests.rooms && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-orange-100 animate-pulse" }, "\u20B9", selectedRoom?.pricing?.extraAdultPrice || 0, " Extra charge")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, adults: Math.max(1, prev.adults - 1) })),
      disabled: isBedBased,
      className: "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-600 active:scale-90 transition-transform disabled:opacity-50"
    },
    "-"
  ), /* @__PURE__ */ React.createElement("span", { className: "w-4 text-center font-bold" }, guests.adults), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, adults: Math.min((selectedRoom?.maxAdults || 10) * guests.rooms, prev.adults + 1) })),
      disabled: isBedBased,
      className: "w-8 h-8 rounded-full border border-surface flex items-center justify-center bg-white text-surface active:scale-90 transition-transform disabled:opacity-50"
    },
    "+"
  ))), !isBedBased && /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-xl" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { className: "text-sm font-bold text-gray-800 block" }, "Children"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500" }, "Ages 0-11"), guests.children > baseChildrenPerUnit * guests.rooms && /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mt-1 inline-block border border-orange-100 animate-pulse" }, "\u20B9", selectedRoom?.pricing?.extraChildPrice || 0, " Extra charge")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, children: Math.max(0, prev.children - 1) })),
      className: "w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white text-gray-600 active:scale-90 transition-transform"
    },
    "-"
  ), /* @__PURE__ */ React.createElement("span", { className: "w-4 text-center font-bold" }, guests.children), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setGuests((prev) => ({ ...prev, children: Math.min((selectedRoom?.maxChildren || 10) * guests.rooms, prev.children + 1) })),
      className: "w-8 h-8 rounded-full border border-surface flex items-center justify-center bg-white text-surface active:scale-90 transition-transform"
    },
    "+"
  ))))), (offers.length > 0 || appliedOffer) && /* @__PURE__ */ React.createElement("div", { className: "mt-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-800 text-sm flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Gift, { size: 16, className: "text-surface" }), "Offers & Coupons"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowOffersModal(true),
      className: "text-xs font-bold text-surface hover:underline"
    },
    "View All"
  )), appliedOffer ? /* @__PURE__ */ React.createElement("div", { className: "bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "p-1.5 bg-green-100 rounded-lg text-green-700" }, /* @__PURE__ */ React.createElement(Tag, { size: 16 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-green-800 text-sm" }, appliedOffer.code), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-green-600" }, appliedOffer.discountType === "percentage" ? `${appliedOffer.discountValue}% Off applied` : `\u20B9${appliedOffer.discountValue} Off applied`))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleRemoveOffer,
      className: "p-1.5 hover:bg-white/50 rounded-full text-green-700 transition-colors z-10"
    },
    /* @__PURE__ */ React.createElement(X, { size: 16 })
  ), /* @__PURE__ */ React.createElement("div", { className: "absolute -right-4 -bottom-4 w-16 h-16 bg-green-100 rounded-full opacity-50" })) : (
    /* Carousel of Top 3 Offers */
    /* @__PURE__ */ React.createElement("div", { className: "flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x" }, offers.slice(0, 3).map((offer) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: offer._id,
        onClick: () => handleApplyOffer(offer),
        className: "min-w-[200px] bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-surface transition-all snap-center relative overflow-hidden group"
      },
      /* @__PURE__ */ React.createElement("div", { className: `absolute top-0 right-0 px-2 py-0.5 text-[9px] font-bold text-white rounded-bl-lg ${offer.bg || "bg-black"}` }, offer.code),
      /* @__PURE__ */ React.createElement("p", { className: "font-bold text-xs text-gray-800 mt-2" }, offer.title),
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-500 line-clamp-1" }, offer.subtitle)
    )))
  )), priceBreakdown && /* @__PURE__ */ React.createElement("div", { className: "mt-4 p-4 bg-white rounded-lg border border-dashed border-gray-300" }, /* @__PURE__ */ React.createElement("h4", { className: "font-bold text-gray-800 text-sm mb-3" }, "Price Breakdown"), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-600" }, "Base Price (", priceBreakdown.nights, " nights x ", priceBreakdown.units, " units)"), /* @__PURE__ */ React.createElement("span", { className: "font-medium" }, "\u20B9", priceBreakdown.totalBasePrice.toLocaleString())), priceBreakdown.discountAmount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-green-600 font-medium" }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Tag, { size: 12 }), " Coupon Discount (", appliedOffer?.code, ")"), /* @__PURE__ */ React.createElement("span", null, "- \u20B9", priceBreakdown.discountAmount.toLocaleString())), priceBreakdown.totalExtraAdultCharge > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-orange-700" }, /* @__PURE__ */ React.createElement("span", null, "Extra Adults (", priceBreakdown.extraAdultsCount, " x \u20B9", priceBreakdown.extraAdultPrice, "/night)"), /* @__PURE__ */ React.createElement("span", null, "+ \u20B9", priceBreakdown.totalExtraAdultCharge.toLocaleString())), priceBreakdown.totalExtraChildCharge > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-orange-700" }, /* @__PURE__ */ React.createElement("span", null, "Extra Children (", priceBreakdown.extraChildrenCount, " x \u20B9", priceBreakdown.extraChildPrice, "/night)"), /* @__PURE__ */ React.createElement("span", null, "+ \u20B9", priceBreakdown.totalExtraChildCharge.toLocaleString())), priceBreakdown.taxAmount > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-gray-600" }, /* @__PURE__ */ React.createElement("span", null, "Taxes & Fees (", taxRate, "%)"), /* @__PURE__ */ React.createElement("span", null, "+ \u20B9", priceBreakdown.taxAmount.toLocaleString())), /* @__PURE__ */ React.createElement("div", { className: "border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-base text-surface" }, /* @__PURE__ */ React.createElement("span", null, "Total Amount"), /* @__PURE__ */ React.createElement("span", null, "\u20B9", priceBreakdown.grandTotal.toLocaleString())))), /* @__PURE__ */ React.createElement("div", { className: "mt-3 bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2" }, /* @__PURE__ */ React.createElement(Info, { size: 14, className: "mt-0.5 shrink-0" }), /* @__PURE__ */ React.createElement("p", null, "Max allowed: ", /* @__PURE__ */ React.createElement("strong", null, getMaxAdults(), " Adults"), " and ", /* @__PURE__ */ React.createElement("strong", null, getMaxChildren(), " Children"), " for current selection."))), policies && /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark mb-4" }, "House Rules & Policies"), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-600" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Clock, { size: 18, className: "text-surface" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold block text-textDark" }, "Check-in"), /* @__PURE__ */ React.createElement("span", null, policies.checkInTime || "12:00 PM"))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(Clock, { size: 18, className: "text-surface" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold block text-textDark" }, "Check-out"), /* @__PURE__ */ React.createElement("span", null, policies.checkOutTime || "11:00 AM"))), policies.cancellationPolicy && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 col-span-2 md:col-span-1" }, /* @__PURE__ */ React.createElement(Info, { size: 18, className: "text-surface" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "font-semibold block text-textDark" }, "Cancellation Policy"), /* @__PURE__ */ React.createElement("span", null, policies.cancellationPolicy))), /* @__PURE__ */ React.createElement("div", { className: "col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2 mt-2" }, [
    { label: "Pets Allowed", value: policies.petsAllowed || policies.petFriendly, type: "bool" },
    { label: "Smoking Allowed", value: policies.smokingAllowed || policies.smokingAlcohol, type: "bool" },
    { label: "Alcohol Allowed", value: policies.alcoholAllowed, type: "bool" },
    { label: "Suitability", value: policies.suitability, type: "mixed" },
    { label: "ID Required", value: policies.idProofMandatory || policies.idProofRequired || policies.idRequirement, type: "mixed" }
  ].map((rule, idx) => {
    if (rule.value === void 0 || rule.value === null) return null;
    let displayValue = "";
    if (rule.type === "bool") {
      if (rule.value === true || rule.value === "Yes" || rule.value === "Allowed") displayValue = "Yes";
      else if (rule.value === false || rule.value === "No" || rule.value === "Not Allowed") displayValue = "No";
      else displayValue = rule.value;
    } else {
      if (rule.label === "Suitability" && rule.value === "Both") {
        displayValue = "Family Friendly, Couple Friendly";
      } else {
        displayValue = typeof rule.value === "boolean" ? rule.value ? "Yes" : "No" : rule.value;
      }
    }
    if (!displayValue) return null;
    /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border border-gray-100" }, /* @__PURE__ */ React.createElement(Shield, { size: 16, className: "text-surface/50" }), /* @__PURE__ */ React.createElement("span", { className: "text-gray-600 font-medium" }, rule.label, ": ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-textDark ml-1" }, displayValue)));
  })), policies.houseRules && Array.isArray(policies.houseRules) && policies.houseRules.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "col-span-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold block text-textDark mb-2" }, "Additional Rules"), /* @__PURE__ */ React.createElement("ul", { className: "list-disc list-inside space-y-1" }, policies.houseRules.map((rule, i) => /* @__PURE__ */ React.createElement("li", { key: i }, rule)))), policies.houseRules && !Array.isArray(policies.houseRules) && typeof policies.houseRules === "object" && /* @__PURE__ */ React.createElement("div", { className: "col-span-2 mt-2" }, /* @__PURE__ */ React.createElement("span", { className: "font-semibold block text-textDark mb-2" }, "House Rules"), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, Object.entries(policies.houseRules).map(([key, val], i) => /* @__PURE__ */ React.createElement("span", { key: i, className: `text-xs px-2 py-1 rounded border ${val ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}` }, key.replace(/([A-Z])/g, " $1").trim(), ": ", val ? "Yes" : "No")))))), property.nearbyPlaces && property.nearbyPlaces.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-8" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark mb-4" }, "Nearby Places"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3" }, property.nearbyPlaces.map((place, idx) => /* @__PURE__ */ React.createElement("div", { key: idx, className: "flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "p-2.5 bg-white rounded-xl shadow-sm text-surface" }, /* @__PURE__ */ React.createElement(MapPin, { size: 18 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-black text-sm text-textDark" }, place.name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-0.5" }, place.type))), /* @__PURE__ */ React.createElement("span", { className: "text-xs font-black text-surface bg-white px-3 py-1.5 rounded-lg border border-surface/10 shadow-sm" }, place.distanceKm, " km"))))), /* @__PURE__ */ React.createElement("div", { className: "mb-12" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-4 mb-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("h2", { className: "text-lg font-bold text-textDark" }, "Guest Reviews"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center text-sm text-gray-500 pt-1" }, /* @__PURE__ */ React.createElement("span", null, reviews.length > 0 ? `(${reviews.length})` : ""), /* @__PURE__ */ React.createElement("span", { className: "mx-1" }, "\u2022"), /* @__PURE__ */ React.createElement("span", { className: "font-bold text-black mr-1" }, rating > 0 ? Number(rating).toFixed(1) : "New"), rating > 0 && /* @__PURE__ */ React.createElement(Star, { size: 14, className: "fill-honey text-honey" }))), canReview && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowReviewForm(!showReviewForm),
      className: "text-xs font-black text-surface border border-surface/20 px-4 py-2 rounded-xl bg-white shadow-sm hover:bg-surface hover:text-white transition-all flex items-center gap-2 active:scale-95"
    },
    /* @__PURE__ */ React.createElement("div", { className: "p-1 bg-surface/10 rounded-lg group-hover:bg-white/20" }, /* @__PURE__ */ React.createElement(MessageSquare, { size: 14 })),
    /* @__PURE__ */ React.createElement("span", null, "Write a Review")
  )), showReviewForm && /* @__PURE__ */ React.createElement("div", { className: "bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 animate-fadeIn" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-gray-800 mb-3" }, "Rate your experience"), /* @__PURE__ */ React.createElement("form", { onSubmit: handleReviewSubmit }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: star,
      type: "button",
      onClick: () => setReviewData({ ...reviewData, rating: star }),
      className: "focus:outline-none"
    },
    /* @__PURE__ */ React.createElement(
      Star,
      {
        size: 24,
        className: `${reviewData.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`
      }
    )
  ))), /* @__PURE__ */ React.createElement(
    "textarea",
    {
      value: reviewData.comment,
      onChange: (e) => setReviewData({ ...reviewData, comment: e.target.value }),
      placeholder: "Share your experience...",
      rows: 3,
      className: "w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-surface outline-none mb-3",
      required: true
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "flex justify-end gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "button",
      onClick: () => setShowReviewForm(false),
      className: "px-4 py-2 text-gray-500 font-medium hover:text-gray-700"
    },
    "Cancel"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: submitReviewLoading,
      className: "px-6 py-2 bg-black text-white rounded-lg font-bold disabled:opacity-50"
    },
    submitReviewLoading ? "Submitting..." : "Submit Review"
  )))), reviews.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center p-12 bg-gray-50 rounded-2xl border border-dotted border-gray-300" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-500 font-medium" }, "No reviews yet. Be the first to share your experience!")) : (
    // Simple Scrollable Row for simplicity and UX
    /* @__PURE__ */ React.createElement("div", { className: "flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar" }, reviews.slice(0, 3).map((review) => /* @__PURE__ */ React.createElement("div", { key: review._id, className: "min-w-[280px] md:min-w-[320px] max-w-[320px] bg-white p-4 rounded-xl border border-gray-100 shadow-sm snap-center flex-shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center text-surface font-bold text-lg" }, review.userId?.name?.charAt(0) || "U"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-gray-800 text-sm line-clamp-1" }, review.userId?.name || "User"), /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-400" }, new Date(review.createdAt).toLocaleDateString())), /* @__PURE__ */ React.createElement("div", { className: "ml-auto flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs font-bold" }, review.rating, " ", /* @__PURE__ */ React.createElement(Star, { size: 10, className: "fill-yellow-500 text-yellow-500" }))), /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 text-sm leading-relaxed line-clamp-4" }, '"', review.comment, '"'))))
  )))), /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 shadow-lg z-50" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-5xl mx-auto flex items-center justify-between gap-4" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-wider" }, priceBreakdown ? "Total Amount" : "Per Night"), /* @__PURE__ */ React.createElement("p", { className: "font-bold text-xl text-surface leading-tight" }, "\u20B9", priceBreakdown?.grandTotal?.toLocaleString() || bookingBarPrice?.toLocaleString() || "N/A"), dates.checkIn && dates.checkOut && /* @__PURE__ */ React.createElement("div", { className: "mt-0.5" }, checkingAvailability ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-blue-500 flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Loader2, { size: 10, className: "animate-spin" }), " Checking...") : availability?.available === false ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-red-500 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(Info, { size: 10 }), " ", availability.message || "Not Available") : availability?.available === true ? /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-green-600 font-bold flex items-center gap-1" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 10 }), " ", availability.unitsLeft !== void 0 ? `${availability.unitsLeft} Left!` : "Available") : null), extraPricingLabels.length > 0 && /* @__PURE__ */ React.createElement("p", { className: "text-[9px] text-gray-400 font-medium leading-tight" }, extraPricingLabels.join(" \u2022 "))), /* @__PURE__ */ React.createElement("div", { className: "flex flex-1 md:flex-none gap-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBook,
      disabled: bookingLoading || checkingAvailability,
      className: "bg-surface text-white px-6 py-1.5 rounded-lg font-black text-sm flex-1 md:w-44 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-surface-dark shadow-md shadow-surface/20 transition-all active:scale-[0.96] flex flex-col items-center justify-center leading-none min-h-[44px]"
    },
    bookingLoading || checkingAvailability ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { size: 16, className: "animate-spin" }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px]" }, checkingAvailability ? "Checking..." : "Wait...")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "block" }, "Book"), /* @__PURE__ */ React.createElement("span", { className: "block mt-0.5" }, "Now"))
  )))), showOffersModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slideUp" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 rounded-t-2xl" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-lg text-gray-900" }, "Available Offers"), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowOffersModal(false),
      className: "p-2 bg-gray-100 rounded-full hover:bg-gray-200"
    },
    /* @__PURE__ */ React.createElement(X, { size: 20, className: "text-gray-600" })
  )), /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "p-4 overflow-y-auto overflow-x-hidden space-y-4 bg-gray-50 flex-1 overscroll-y-contain",
      "data-lenis-prevent": true
    },
    offers.map((offer) => /* @__PURE__ */ React.createElement(
      "div",
      {
        key: offer._id,
        className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative flex flex-col"
      },
      /* @__PURE__ */ React.createElement("div", { className: `h-24 ${offer.bg || "bg-gray-800"} relative p-4 flex flex-col justify-center text-white` }, offer.image && /* @__PURE__ */ React.createElement("img", { src: offer.image, alt: "offer", className: "absolute inset-0 w-full h-full object-cover opacity-30" }), /* @__PURE__ */ React.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ React.createElement("h4", { className: "font-black text-xl" }, offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `\u20B9${offer.discountValue} OFF`), /* @__PURE__ */ React.createElement("p", { className: "text-xs opacity-90 font-medium" }, offer.title)), /* @__PURE__ */ React.createElement("div", { className: "absolute top-3 right-3 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow-sm z-10" }, offer.code)),
      /* @__PURE__ */ React.createElement("div", { className: "p-4" }, /* @__PURE__ */ React.createElement("p", { className: "text-gray-600 text-sm mb-3" }, offer.description || offer.subtitle), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mt-auto" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] text-gray-400 font-medium" }, offer.minBookingAmount > 0 ? `Min. Spend: \u20B9${offer.minBookingAmount}` : "No Min Spend"), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => handleApplyOffer(offer),
          className: "bg-surface text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-surface/20 active:scale-95 transition-all"
        },
        "Apply"
      )))
    ))
  ))), showImageModal && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[100] flex flex-col bg-black/95 animate-fadeIn" }, /* @__PURE__ */ React.createElement("div", { className: "p-4 flex items-center justify-between text-white z-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col" }, /* @__PURE__ */ React.createElement("h3", { className: "font-bold text-sm md:text-base line-clamp-1" }, name), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] md:text-xs opacity-70" }, "Image ", currentImageIndex + 1, " of ", galleryImages.length)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowImageModal(false),
      className: "p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
    },
    /* @__PURE__ */ React.createElement(X, { size: 24 })
  )), /* @__PURE__ */ React.createElement("div", { className: "flex-1 relative flex items-center justify-center p-4 overflow-hidden" }, /* @__PURE__ */ React.createElement(
    motion.div,
    {
      className: "w-full h-full flex items-center justify-center",
      drag: "x",
      dragConstraints: { left: 0, right: 0 },
      dragElastic: 0.7,
      animate: { x: 0 },
      transition: { type: "spring", stiffness: 300, damping: 30 },
      onDragEnd: (e, info) => {
        const swipeThreshold = 50;
        if (info.offset.x < -swipeThreshold) {
          handleNextImage();
        } else if (info.offset.x > swipeThreshold) {
          handlePrevImage();
        }
      }
    },
    /* @__PURE__ */ React.createElement(
      motion.img,
      {
        key: currentImageIndex,
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.2 },
        src: galleryImages[currentImageIndex],
        alt: `Gallery ${currentImageIndex}`,
        className: "max-w-full max-h-full object-contain shadow-2xl pointer-events-none"
      }
    )
  ), galleryImages.length > 1 && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        handlePrevImage();
      },
      className: "absolute left-2 md:left-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 md:p-4 rounded-full backdrop-blur-md transition-all active:scale-95"
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { size: 24 })
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: (e) => {
        e.stopPropagation();
        handleNextImage();
      },
      className: "absolute right-2 md:right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 md:p-4 rounded-full backdrop-blur-md transition-all active:scale-95"
    },
    /* @__PURE__ */ React.createElement(ChevronRight, { size: 24 })
  ))), /* @__PURE__ */ React.createElement("div", { className: "p-4 flex justify-center gap-1.5 overflow-x-auto hide-scrollbar" }, galleryImages.map((img, idx) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: idx,
      onClick: () => setCurrentImageIndex(idx),
      className: `
                  w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all
                  ${idx === currentImageIndex ? "border-surface scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"}
                `
    },
    /* @__PURE__ */ React.createElement("img", { src: img, className: "w-full h-full object-cover" })
  )))));
};
export default PropertyDetailsPage;
