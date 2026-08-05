import React, { useState, useEffect } from 'react';
import {
  Building2, Home, Users, BedDouble, Tent, Palmtree, Hotel,
  Building, Trees, Mountain, Waves, Umbrella, Coffee, Snowflake,
  MapPin, Globe, Zap, Shield, Heart, Star, Camera, Compass, CheckCircle2, Loader2
} from 'lucide-react';
import { api } from '../../../services/apiService';

// Lucide icon name to component mapping
const STATIC_ICONS = {
  Building2, Home, Palmtree, Hotel, Building, BedDouble, Tent,
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin,
  Globe, Zap, Shield, Heart, Star, Camera, Compass, Users
};

// Color palette for dynamic categories
const DYNAMIC_COLORS = [
  'bg-indigo-50 text-indigo-600',
  'bg-violet-50 text-violet-600',
  'bg-cyan-50 text-cyan-600',
  'bg-fuchsia-50 text-fuchsia-600',
];

// Static default property types
export const STATIC_TYPES = [
  { key: 'hotel',    label: 'Hotel',         badge: 'Business & Leisure', icon: Building2, color: 'bg-blue-50 text-blue-600' },
  { key: 'resort',   label: 'Resort',         badge: 'Vacation',           icon: Palmtree,  color: 'bg-orange-50 text-orange-600' },
  { key: 'villa',    label: 'Villa',           badge: 'Family & Groups',    icon: Home,      color: 'bg-emerald-50 text-emerald-600' },
  { key: 'hostel',   label: 'Hostel',          badge: 'Budget',             icon: Users,     color: 'bg-yellow-50 text-yellow-600' },
  { key: 'pg',       label: 'PG / Co-living',  badge: 'Long Term',          icon: BedDouble, color: 'bg-purple-50 text-purple-600' },
  { key: 'homestay', label: 'Homestay',        badge: 'Experience',         icon: Hotel,     color: 'bg-rose-50 text-rose-600' },
  { key: 'tent',     label: 'Tent / Campsite', badge: 'Adventure',          icon: Tent,      color: 'bg-green-50 text-green-600' },
];

/**
 * PropertyTypeSelector — Multi-select property type picker (icon + name only, no images)
 * Props:
 *   selectedTypes : string[]        - currently selected keys
 *   onChange      : (types) => void - called on toggle
 *   maxSelect     : number          - max selections allowed (default: Infinity)
 */
const PropertyTypeSelector = ({ selectedTypes = [], onChange, maxSelect = Infinity }) => {
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) setDynamicCategories(res.data.categories);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const allTypes = [
    ...STATIC_TYPES,
    ...dynamicCategories.map((cat, idx) => ({
      key: cat.slug,
      label: cat.name,
      badge: cat.name,
      icon: STATIC_ICONS[cat.icon] || Building2,
      color: DYNAMIC_COLORS[idx % DYNAMIC_COLORS.length],
      isDynamic: true,
    })),
  ];

  const toggle = (key) => {
    const selected = selectedTypes.includes(key);
    if (selected) {
      onChange(selectedTypes.filter(t => t !== key));
    } else if (maxSelect === 1) {
      onChange([key]);
    } else if (selectedTypes.length < maxSelect) {
      onChange([...selectedTypes, key]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {allTypes.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedTypes.includes(item.key);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => toggle(item.key)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left active:scale-[0.97] ${
              isSelected
                ? 'border-[#0F172A] bg-gray-50 shadow-md ring-2 ring-[#0F172A]/10'
                : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            {/* Icon box */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              isSelected ? 'bg-[#0F172A] text-white' : item.color
            }`}>
              <Icon size={22} />
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={`font-black text-sm uppercase tracking-tight leading-tight ${isSelected ? 'text-[#0F172A]' : 'text-gray-800'}`}>
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{item.badge}</p>
            </div>

            {/* Selected indicator */}
            {isSelected
              ? <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              : item.isDynamic && <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-black uppercase bg-indigo-100 text-indigo-600 rounded-md">New</span>
            }
          </button>
        );
      })}
    </div>
  );
};

export default PropertyTypeSelector;
