import React, { useState, useEffect } from 'react';
import { MapPin, Star, IndianRupee, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/apiService';
import toast from 'react-hot-toast';

const PropertyCard = ({ property, data, className = "", isSaved: initialIsSaved }) => {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(initialIsSaved || false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Sync with initialIsSaved if it changes
  useEffect(() => {
    if (initialIsSaved !== undefined) {
      setIsSaved(initialIsSaved);
    }
  }, [initialIsSaved]);

  const item = property || data;

  if (!item) return null;

  const {
    _id,
    name,
    address,
    images,
    propertyType,
    rating,
    startingPrice,
    details
  } = item;

  const handleToggleSave = async (e) => {
    e.stopPropagation(); // Don't navigate to details
    if (!localStorage.getItem('token')) {
      toast.error("Please login to save properties");
      return;
    }

    if (saveLoading) return;

    setSaveLoading(true);
    const newState = !isSaved;
    setIsSaved(newState); // Optimistic update

    try {
      await userService.toggleSavedHotel(_id || item.id);
      toast.success(newState ? "Added to wishlist" : "Removed from wishlist");
    } catch (error) {
      setIsSaved(!newState); // Revert
      toast.error("Failed to update wishlist");
    } finally {
      setSaveLoading(false);
    }
  };

  // Function to clean dirty URLs (handles backticks, spaces, quotes)
  const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    // Remove backticks, single quotes, double quotes, and surrounding whitespace
    return url.replace(/[`'"]/g, '').trim();
  };

  const displayName = name || item.propertyName || 'Untitled';

  const typeRaw = (propertyType || item.propertyType || '').toString();
  const normalizedType = typeRaw
    ? typeRaw.toLowerCase() === 'pg'
      ? 'PG'
      : typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase()
    : '';
  const typeForBadge = normalizedType || typeRaw;
  const typeLabel = typeForBadge ? typeForBadge.toString().toUpperCase() : '';

  // Improved Rating Logic
  const rawRating =
    item.avgRating !== undefined ? item.avgRating :
      item.rating !== undefined ? item.rating :
        rating;

  const reviewCount = item.totalReviews || item.reviews || 0;

  // Show rating if it exists and is > 0, otherwise show 'New'
  // Or if user specifically wants to see 0.0, we can adjust. 
  // Standard is: if no reviews, show New.
  const displayRating = (Number(rawRating) > 0) ? Number(rawRating).toFixed(1) : 'New';

  // Improved Price Logic - Check more fields
  const rawPrice =
    startingPrice ??
    item.startingPrice ??
    item.minPrice ??
    item.min_price ??
    item.price ??
    item.costPerNight ??
    item.amount ??
    null;

  const displayPrice =
    typeof rawPrice === 'number' && rawPrice > 0 ? rawPrice : null;

  const imageSrc =
    images?.cover ||
    cleanImageUrl(item.coverImage) ||
    cleanImageUrl(
      Array.isArray(item.propertyImages) ? item.propertyImages[0] : ''
    ) ||
    'https://via.placeholder.com/400x300?text=No+Image';

  const badgeTypeKey = normalizedType || typeRaw;

  const getTypeColor = (type) => {
    switch (type) {
      case 'Hotel': return 'bg-blue-100 text-blue-700';
      case 'Villa': return 'bg-purple-100 text-purple-700';
      case 'Resort': return 'bg-orange-100 text-orange-700';
      case 'Homestay': return 'bg-green-100 text-green-700';
      case 'Hostel': return 'bg-pink-100 text-pink-700';
      case 'PG': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div
      onClick={() => navigate(`/hotel/${_id}`)}
      className={`group relative bg-white/70 backdrop-blur-xl rounded-[1.5rem] border border-white/50 shadow-sm overflow-hidden cursor-pointer active:scale-[0.98] hover:scale-[1.02] transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Image Container - Reduced margin for compactness */}
      <div className="relative m-1.5 rounded-[1.2rem] overflow-hidden aspect-[16/10] bg-gray-50 flex items-center justify-center">
        <img
          src={imageSrc}
          alt={displayName}
          className="w-full h-full object-cover transition-transform duration-700"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />

        {/* Wishlist Button - Standardized */}
        <button
          onClick={handleToggleSave}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-white/40 backdrop-blur-md border border-white/30 rounded-full shadow-sm z-20 hover:bg-white active:scale-90 transition-all duration-300"
        >
          <Heart
            size={13}
            className={`${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </button>

        {/* Property Type Badge - Standardized */}
        {typeLabel && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/20 backdrop-blur-md border border-white/20 rounded-full text-[9px] uppercase tracking-wider font-bold text-white z-10">
            {typeLabel}
          </div>
        )}

        {/* Rating Overlay - Minimalist */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-bold text-surface shadow-sm z-10">
          <Star size={10} className="fill-honey text-honey" />
          {displayRating}
        </div>

        {/* Suitability Label */}
        {item.suitability && item.suitability !== 'none' && (
          <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold z-10">
            {item.suitability === 'Both' ? 'FRIENDLY' : item.suitability.toUpperCase()}
          </div>
        )}
      </div>

      {/* Content Area - Compressed padding */}
      <div className="px-3 pb-3 pt-0.5">
        <h3 className="font-bold text-xs text-gray-800 line-clamp-1 mb-1">
          {displayName}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 mb-2">
          <MapPin size={10} className="shrink-0" />
          <span className="text-[10px] font-medium leading-tight truncate">
            {(() => {
              const area = address?.area || item.area;
              const city = address?.city || item.city;
              return area && area.trim() ? `${area}, ${city}` : (city || 'Nearby');
            })()}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <div className="flex flex-col leading-tight">
            <span className="text-[9px] font-medium text-gray-400 capitalize">Starts from</span>
            <div className="flex items-center gap-0.5 text-surface font-bold text-xs">
              <IndianRupee size={10} />
              {displayPrice ? displayPrice.toLocaleString() : 'Check'}
              <span className="text-[9px] text-gray-400 font-normal ml-0.5">/ night</span>
            </div>
          </div>

          <button className="bg-surface text-white px-3 py-1.5 rounded-xl text-[10px] font-bold hover:bg-surface/90 transition-all active:scale-95 shadow-sm">
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
