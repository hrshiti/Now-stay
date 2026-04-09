import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  Palmtree,
  Hotel,
  Building,
  BedDouble,
  LayoutGrid,
  Tent,
  Plus, Search, Edit2, Trash2, Check, X, Loader2, 
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin, 
  Globe, Zap, Shield, Heart, Star, Camera, Compass
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';

const STATIC_TYPES = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Hotel', label: 'Hotel', icon: Building2 },
  { id: 'Villa', label: 'Villa', icon: Home },
  { id: 'Resort', label: 'Resort', icon: Palmtree },
  { id: 'Homestay', label: 'Homestay', icon: Hotel },
  { id: 'Hostel', label: 'Hostel', icon: Building },
  { id: 'PG', label: 'PG', icon: BedDouble },
  { id: 'Tent', label: 'Tent', icon: Tent },
];

const LUCIDE_ICONS = {
  Building2, Home, Palmtree, Hotel, Building, BedDouble, Tent, 
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin, 
  Globe, Zap, Shield, Heart, Star, Camera, Compass
};

const PropertyTypeFilter = ({ selectedType, onSelectType }) => {
  const [types, setTypes] = useState(STATIC_TYPES);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const res = await propertyService.getCategories();
        if (res.success && res.categories) {
          // Merge static with dynamic, avoiding duplicates if any
          const dynamicTypes = res.categories.map(cat => ({
            id: cat.slug, // Using slug as ID to match propertyType in DB (which stores the slug)
            label: cat.name,
            icon: LUCIDE_ICONS[cat.icon] || Building2
          }));
          
          // Filter out dynamics that are already in static (by label/id)
          const filteredDynamic = dynamicTypes.filter(d => 
            !STATIC_TYPES.some(s => s.id.toLowerCase() === d.id.toLowerCase() || s.id.toLowerCase() === d.label.toLowerCase())
          );

          setTypes([...STATIC_TYPES, ...filteredDynamic]);
        }
      } catch (error) {
        console.warn("Failed to fetch dynamic categories:", error);
      }
    };
    fetchDynamicCategories();
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto px-5 py-4 no-scrollbar scroll-smooth">
      {types.map((type) => {
        const Icon = type.icon || Building2;
        const isSelected = selectedType === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className="flex flex-col items-center gap-1.5 min-w-[56px] group outline-none transition-all duration-300"
          >
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
              transition-all duration-300 transform active:scale-95
              ${isSelected
                ? 'bg-surface text-white scale-105 shadow-md'
                : 'bg-white text-surface/60 hover:bg-gray-50'
              }
            `}>
              <Icon size={20} strokeWidth={isSelected ? 2 : 1.5} />
            </div>

            <span className={`
              text-[10px] font-medium transition-colors leading-tight truncate max-w-[64px]
              ${isSelected ? 'text-surface font-bold' : 'text-surface/60'}
            `}>
              {type.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PropertyTypeFilter;
