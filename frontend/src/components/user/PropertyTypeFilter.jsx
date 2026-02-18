import React, { useState, useEffect } from 'react';
import {
  Building2,
  Home,
  Palmtree,
  Hotel,
  Building,
  BedDouble,
  LayoutGrid,
  Tent
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { categoryService } from '../../services/categoryService';

const PropertyTypeFilter = ({ selectedType, onSelectType }) => {
  const STATIC_TYPES = [
    { id: 'All', label: 'All', icon: LayoutGrid },
    { id: 'Hotel', label: 'Hotel', icon: Building2 },
    { id: 'Villa', label: 'Villa', icon: Home },
    { id: 'Resort', label: 'Resort', icon: Palmtree },
    { id: 'Homestay', label: 'Homestay', icon: Hotel },
    { id: 'Hostel', label: 'Hostel', icon: Building },
    { id: 'PG', label: 'PG', icon: BedDouble },
    { id: 'tent', label: 'Tent', icon: Tent },
  ];

  const [allTypes, setAllTypes] = useState(STATIC_TYPES);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const categories = await categoryService.getActiveCategories();

        const dynamicTypes = categories
          .filter(cat => cat.displayName.toLowerCase() !== 'tent' && cat.name.toLowerCase() !== 'tent')
          .map(cat => ({
            id: cat._id,
            label: cat.displayName,
            icon: LucideIcons[cat.icon] || LucideIcons.HelpCircle,
            isDynamic: true
          }));

        setAllTypes([...STATIC_TYPES, ...dynamicTypes]);
      } catch (error) {
        console.error("Error loading categories:", error);
        // Fallback to static types
        setAllTypes(STATIC_TYPES);
      }
    };

    fetchDynamicCategories();
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto px-5 py-4 no-scrollbar">
      {allTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selectedType === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`
              flex flex-col items-center gap-1.5 min-w-[56px] group outline-none transition-all duration-300
            `}
          >
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
              transition-all duration-300
              ${isSelected
                ? 'bg-surface text-white scale-105 shadow-md'
                : 'bg-white text-surface/60 hover:bg-gray-50'
              }
            `}>
              <Icon size={20} strokeWidth={isSelected ? 2 : 1.5} />
            </div>

            <span className={`
              text-[10px] font-medium transition-colors leading-tight
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
