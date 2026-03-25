import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Home, Users, BedDouble, ArrowLeft, ChevronRight, X, Tent, 
  Palmtree, Hotel, Building, Trees, Mountain, Waves, Umbrella, 
  Coffee, Snowflake, MapPin, Globe, Zap, Shield, Heart, Star, Camera, Compass, Loader2
} from 'lucide-react';
import { api } from '../../../services/apiService';

const STATIC_ICONS = {
  Building2, Home, Palmtree, Hotel, Building, BedDouble, Tent, 
  Trees, Mountain, Waves, Umbrella, Coffee, Snowflake, MapPin, 
  Globe, Zap, Shield, Heart, Star, Camera, Compass, Users
};

const PartnerJoinPropertyType = () => {
  const navigate = useNavigate();
  const [dynamicCategories, setDynamicCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setDynamicCategories(res.data.categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const staticTypes = [
    {
      key: 'hotel',
      label: 'Hotel',
      description: 'Multiple rooms, daily stays, front desk operations',
      badge: 'Business & Leisure',
      icon: Building2,
      route: '/hotel/join-hotel',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      key: 'resort',
      label: 'Resort',
      description: 'Destination stays with activities and experiences',
      badge: 'Vacation',
      icon: Palmtree,
      route: '/hotel/join-resort',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      key: 'villa',
      label: 'Villa',
      description: 'Entire villa or premium holiday home',
      badge: 'Family & Groups',
      icon: Home,
      route: '/hotel/join-villa',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      key: 'hostel',
      label: 'Hostel',
      description: 'Beds or dorms for backpackers and students',
      badge: 'Budget',
      icon: Users,
      route: '/hotel/join-hostel',
      color: 'bg-yellow-50 text-yellow-600',
    },
    {
      key: 'pg',
      label: 'PG / Co-living',
      description: 'Long-stay beds or rooms with shared facilities',
      badge: 'Long Term',
      icon: BedDouble,
      route: '/hotel/join-pg',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      key: 'homestay',
      label: 'Homestay',
      description: 'Live-with-host or family-run stays',
      badge: 'Experience',
      icon: Hotel,
      route: '/hotel/join-homestay',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      key: 'tent',
      label: 'Tent / Campsite',
      description: 'Glamping, safari or basic campsites',
      badge: 'Adventure',
      icon: Tent,
      route: '/hotel/join-tent',
      color: 'bg-green-50 text-green-600',
    },
  ];

  const combinedTypes = [
    ...staticTypes,
    ...dynamicCategories.map(cat => ({
      key: cat.slug,
      label: cat.name,
      description: cat.description || `List your ${cat.name} and reach more guests.`,
      badge: 'New Category',
      icon: STATIC_ICONS[cat.icon] || Building2,
      route: `/hotel/join-${cat.templateType}?type=${cat.slug}`,
      color: 'bg-indigo-50 text-indigo-600',
      isDynamic: true
    }))
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="font-bold text-lg text-gray-800 uppercase tracking-tight">Select Property Type</div>
          <button onClick={() => navigate('/hotel/dashboard')} className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-6 pb-20">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-black text-gray-900 uppercase">What keeps you busy?</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Select the type of property you want to list on nowstay.in.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scanning available categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {combinedTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.route)}
                  className="group relative flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-black/5 hover:border-black transition-all duration-300 text-left active:scale-[0.98]"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${item.color} group-hover:bg-black group-hover:text-white group-hover:rotate-6 shadow-sm`}>
                    <Icon size={28} />
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 group-hover:text-black transition-colors uppercase text-sm">
                        {item.label}
                      </h3>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-bold uppercase line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-3">
                      <span className="inline-block px-2 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 rounded-lg group-hover:bg-black/5 group-hover:text-black transition-all">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-200 group-hover:text-black transition-all group-hover:translate-x-1">
                    <ChevronRight size={20} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PartnerJoinPropertyType;
