import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { userService } from '../../services/apiService';
import { MapPin, Search, Filter, Star, IndianRupee, Navigation, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PropertyCard from '../../components/user/PropertyCard';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [properties, setProperties] = useState([]);
    const [savedHotelIds, setSavedHotelIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false); // Mobile toggle
    const [dynamicCats, setDynamicCats] = useState([]);

    // Unified lists — matches exactly with partner wizard naming
    const AMENITIES_LIST = ['Wi-Fi', 'AC', 'TV', 'Parking', 'Swimming Pool', 'Gym', 'Spa', 'Restaurant', 'Room Service', 'Lift', 'Bar', 'Geyser', 'Power Backup', 'Kitchen', 'Barbeque', 'First Aid', 'Pet Friendly'];
    const ACTIVITIES_LIST = ['Trekking', 'Bonfire', 'Star Gazing', 'Adventure Sports', 'Fishing', 'Jeep Safari'];
    const SUITABILITY_OPTIONS = ['Couple Friendly', 'Family Friendly', 'Both'];

    // Filters State
    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        type: searchParams.get('type')
            ? (searchParams.get('type') === 'all' ? 'all' : searchParams.get('type').split(','))
            : 'all',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        sort: searchParams.get('sort') || 'newest',
        amenities: searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [],
        activities: searchParams.get('activities') ? searchParams.get('activities').split(',') : [],
        suitability: searchParams.get('suitability') || '',
        radius: 50
    });

    const [location, setLocation] = useState(null); // { lat, lng }

    // Read location from URL params on mount
    useEffect(() => {
        const latParam = searchParams.get('lat');
        const lngParam = searchParams.get('lng');
        const radiusParam = searchParams.get('radius');
        const sortParam = searchParams.get('sort');
        
        if (latParam && lngParam) {
            const urlLocation = {
                lat: parseFloat(latParam),
                lng: parseFloat(lngParam)
            };
            
            if (!location || location.lat !== urlLocation.lat || location.lng !== urlLocation.lng) {
                setLocation(urlLocation);
            }
            
            if (radiusParam) {
                setFilters(prev => ({ ...prev, radius: Number(radiusParam) }));
            }
            
            if (sortParam) {
                setFilters(prev => ({ ...prev, sort: sortParam }));
            }
        }
    }, [searchParams]);

    useEffect(() => {
        fetchProperties();
    }, [searchParams, location]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await propertyService.getCategories();
                if (res.success && res.categories) {
                    setDynamicCats(res.categories);
                }
            } catch (err) {
                console.error("Failed to load dynamic categories:", err);
            }
        };
        loadCategories();
    }, []);

    // Live Search: Debounced update of searchParams when typing
    useEffect(() => {
        if (filters.search === (searchParams.get('search') || '')) return;

        const timer = setTimeout(() => {
            const params = Object.fromEntries([...searchParams]);
            if (filters.search) {
                params.search = filters.search;
            } else {
                delete params.search;
            }
            setSearchParams(params);
        }, 500);

        return () => clearTimeout(timer);
    }, [filters.search]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const params = Object.fromEntries([...searchParams]);

            if (location) {
                params.lat = location.lat;
                params.lng = location.lng;
                params.radius = filters.radius;
            }

            const promises = [propertyService.getPublicProperties(params)];
            if (localStorage.getItem('token')) {
                promises.push(userService.getSavedHotels());
            }

            const [res, savedRes] = await Promise.all(promises);

            if (savedRes) {
                const list = savedRes.savedHotels || [];
                setSavedHotelIds(list.map(h => (typeof h === 'object' ? h._id : h)));
            }

            if (Array.isArray(res)) {
                setProperties(res);
            } else if (res.success && Array.isArray(res.properties)) {
                setProperties(res.properties);
            } else {
                setProperties([]);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load properties');
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        const params = {};
        if (filters.search) params.search = filters.search;
        if (filters.type) {
            if (Array.isArray(filters.type)) {
                if (filters.type.length > 0) params.type = filters.type.map(t => t.toLowerCase()).join(',');
            } else if (filters.type !== 'all' && filters.type !== '') {
                params.type = filters.type.toLowerCase();
            }
        }
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.sort) params.sort = filters.sort;
        if (filters.amenities?.length > 0) params.amenities = filters.amenities.join(',');
        if (filters.activities?.length > 0) params.activities = filters.activities.join(',');
        if (filters.suitability) params.suitability = filters.suitability;

        setSearchParams(params);
        setShowFilters(false);
    };

    const handleNearMe = async () => {
        try {
            toast.loading('Getting location...');
            const loc = await propertyService.getCurrentLocation();
            toast.dismiss();
            toast.success('Location found!');
            setLocation(loc);
            updateFilter('sort', 'distance');
            setSearchParams(prev => {
                const p = Object.fromEntries([...prev]);
                p.sort = 'distance';
                return p;
            });
        } catch (err) {
            toast.dismiss();
            toast.error('Could not get location. Please enable permissions.');
        }
    };

    // Static types: value and label are same (lowercase value used for filtering)
    const staticTypesList = ['Hotel', 'Villa', 'Resort', 'Homestay', 'PG', 'Hostel', 'Tent'].map(t => ({ label: t, value: t.toLowerCase() }));
    // Dynamic types: slug as value (matches propertyType in DB), name as display label
    const dynamicTypesList = dynamicCats.map(c => ({ label: c.name, value: c.slug }));
    const propertyTypes = [{ label: 'All', value: 'all' }, ...staticTypesList, ...dynamicTypesList];
    
    const sortOptions = [
        { label: 'Newest', value: 'newest' },
        { label: 'Price: Low to High', value: 'price_low' },
        { label: 'Price: High to Low', value: 'price_high' },
        { label: 'Top Rated', value: 'rating' },
    ];

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 bg-white border-b border-gray-100 pb-3 pt-3 px-4 shadow-sm">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by city, hotel, or area..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#0F172A] focus:border-[#0F172A] outline-none text-sm font-medium text-gray-700 bg-gray-50/50"
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleNearMe}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all active:scale-95
                        ${location ? 'bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Navigation size={14} className={location ? "fill-[#0F172A]" : ""} />
                        {location ? "Nearby Active" : "Near Me"}
                    </button>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-bold transition-all active:scale-95
                        ${(filters.minPrice || filters.maxPrice || (Array.isArray(filters.type) && filters.type.length > 0 && filters.type !== 'all') || filters.amenities?.length > 0)
                                ? 'bg-[#0F172A]/5 text-[#0F172A] border-[#0F172A]'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Filter size={14} className={(filters.minPrice || filters.maxPrice || (Array.isArray(filters.type) && filters.type.length > 0 && filters.type !== 'all') || filters.amenities?.length > 0) ? "fill-[#0F172A]" : ""} />
                        Filters
                    </button>
                </div>

                {location && (
                    <div className="mt-3 pt-3 border-t border-gray-100 transition-all animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                <MapPin size={12} /> Search Radius
                            </label>
                            <span className="text-xs font-bold text-[#0F172A] bg-[#0F172A]/10 px-2 py-0.5 rounded-full">
                                {filters.radius} km
                            </span>
                        </div>
                        <input
                            type="range" min="1" max="100" step="1"
                            value={filters.radius}
                            onChange={(e) => updateFilter('radius', Number(e.target.value))}
                            onMouseUp={() => fetchProperties()}
                            onTouchEnd={() => fetchProperties()}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-[10px] text-gray-400 font-medium">1 km</span>
                            <span className="text-[10px] text-gray-400 font-medium">100 km</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-800">{properties.length} properties found</h2>
                    <select
                        value={filters.sort}
                        onChange={(e) => {
                            updateFilter('sort', e.target.value);
                            const params = { ...Object.fromEntries([...searchParams]), sort: e.target.value };
                            setSearchParams(params);
                        }}
                        className="text-xs font-bold text-gray-500 bg-transparent outline-none pr-1 cursor-pointer"
                    >
                        {sortOptions.map(opt => (
                            <option key={opt.value} value={opt.value} disabled={opt.value === 'distance' && !location}>
                                Sort by {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white h-64 rounded-2xl animate-pulse border border-gray-100"></div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-6">
                            <Search size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">No properties found</h3>
                        <button
                            onClick={() => {
                                setFilters({ search: '', type: 'all', minPrice: '', maxPrice: '', sort: 'newest', amenities: [], activities: [], suitability: '', radius: 50 });
                                setLocation(null);
                                setSearchParams({});
                            }}
                            className="mt-8 text-sm font-bold text-[#0F172A] hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {properties.map(property => (
                            <PropertyCard key={property._id} property={property} isSaved={savedHotelIds.includes(property._id)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <div className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setShowFilters(false)}>
                <div className={`absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-4 overflow-y-auto transition-transform duration-300 ${showFilters ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-lg font-bold text-gray-800">Filters</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setFilters(prev => ({ ...prev, type: 'all', minPrice: '', maxPrice: '', amenities: [], activities: [], suitability: '' }))} className="text-xs font-bold text-red-500 hover:text-red-600">Clear</button>
                            <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-full hover:bg-gray-100"><X size={18} /></button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Property Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {propertyTypes.map(typeObj => {
                                    const { label, value: typeValue } = typeObj;
                                    const isSelected = typeValue === 'all'
                                        ? filters.type === 'all'
                                        : (Array.isArray(filters.type) && filters.type.includes(typeValue));

                                    return (
                                        <button
                                            key={typeValue}
                                            onClick={() => {
                                                if (typeValue === 'all') {
                                                    updateFilter('type', 'all');
                                                } else {
                                                    let currentTypes = Array.isArray(filters.type) ? [...filters.type] : [];
                                                    if (filters.type === 'all') currentTypes = [];
                                                    if (currentTypes.includes(typeValue)) {
                                                        currentTypes = currentTypes.filter(t => t !== typeValue);
                                                        if (currentTypes.length === 0) currentTypes = 'all';
                                                    } else {
                                                        currentTypes.push(typeValue);
                                                    }
                                                    updateFilter('type', currentTypes);
                                                }
                                            }}
                                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all truncate ${isSelected ? 'bg-[#0F172A] text-white border-[#0F172A]' : 'bg-white text-gray-500 border-gray-100'}`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price Range</label>
                            <div className="flex items-center gap-2">
                                <input type="number" placeholder="Min" className="w-full pl-3 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-[#0F172A] bg-gray-50" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} />
                                <span className="text-gray-300 font-bold text-xs">-</span>
                                <input type="number" placeholder="Max" className="w-full pl-3 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:border-[#0F172A] bg-gray-50" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} />
                            </div>
                        </div>

                        {/* Suitability */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Suitable For</label>
                            <div className="flex flex-wrap gap-1.5">
                                {SUITABILITY_OPTIONS.map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => updateFilter('suitability', filters.suitability === opt ? '' : opt)}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${filters.suitability === opt ? 'bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]' : 'bg-white text-gray-500 border-gray-200'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amenities</label>
                            <div className="flex flex-wrap gap-1.5">
                                {AMENITIES_LIST.map((amenity) => (
                                    <button
                                        key={amenity}
                                        onClick={() => {
                                            const currentAmen = filters.amenities || [];
                                            const newAmenities = currentAmen.includes(amenity)
                                                ? currentAmen.filter(a => a !== amenity)
                                                : [...currentAmen, amenity];
                                            updateFilter('amenities', newAmenities);
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${(filters.amenities || []).includes(amenity) ? 'bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]' : 'bg-white text-gray-500 border-gray-200'}`}
                                    >
                                        {amenity}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Activities */}
                        {(() => {
                            const selectedTypes = Array.isArray(filters.type) ? filters.type : (filters.type === 'all' ? [] : [filters.type]);
                            const isTentOrResortSelected = selectedTypes.some(t => {
                                const lowerT = t.toLowerCase();
                                if (['tent', 'resort'].includes(lowerT)) return true;
                                // Check by slug for dynamic categories
                                const dynCat = dynamicCats.find(c => c.slug === lowerT || c.name.toLowerCase() === lowerT);
                                return dynCat && ['tent', 'resort'].includes(dynCat.templateType);
                            });

                            if (!isTentOrResortSelected) return null;

                            return (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Activities (for Tents/Resorts)</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ACTIVITIES_LIST.map((activity) => (
                                            <button
                                                key={activity}
                                                onClick={() => {
                                                    const currentAct = filters.activities || [];
                                                    const newActivities = currentAct.includes(activity)
                                                        ? currentAct.filter(a => a !== activity)
                                                        : [...currentAct, activity];
                                                    updateFilter('activities', newActivities);
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${(filters.activities || []).includes(activity) ? 'bg-[#0F172A]/10 text-[#0F172A] border-[#0F172A]' : 'bg-white text-gray-500 border-gray-200'}`}
                                            >
                                                {activity}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="pt-2 pb-6">
                            <button onClick={applyFilters} className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#0F172A]/20 active:scale-95 transition-transform">Apply Filters</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
