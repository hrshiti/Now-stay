import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, CheckCircle2, Crown, Zap, Star, Building2, Filter, ChevronDown } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import paymentService from '../../../services/paymentService';
import { hotelService } from '../../../services/apiService';
import { STATIC_TYPES } from '../components/PropertyTypeSelector';

const PartnerSubscriptions = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [mySubs, setMySubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingSub, setCancellingSub] = useState(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);
  const [preferredTypes, setPreferredTypes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | specific type key

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (cancellingSub) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [cancellingSub]);

  const fetchData = async () => {
    try {
      const [plansData, subData, typesData] = await Promise.all([
        subscriptionService.getPartnerPlans(),
        subscriptionService.getMySubscription(),
        hotelService.getPropertyTypes().catch(() => ({ propertyTypes: [] }))
      ]);

      const fetchedTypes = typesData.propertyTypes || [];
      setPreferredTypes(fetchedTypes);
      setAllPlans(plansData.plans);
      setMySubs(subData.subscriptions || []);

      // Default to showing 'all' of the user's preferred types
      setActiveFilter('all');
      setPlans(filterPlansByType(plansData.plans, 'all', fetchedTypes));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlansByType = (plansList, typeKey, userTypes = preferredTypes) => {
    const urlTemplate = searchParams.get('template');
    const urlCategory = searchParams.get('category');
    const urlStars = searchParams.get('stars');
    const urlResortType = searchParams.get('resortType');

    // If user has no preferred types, we could either show nothing or show all. We'll show all.
    const effectiveTypes = userTypes.length > 0 ? userTypes : [];

    return plansList.filter(plan => {
      // 1. Strict Filter based on URL parameters (from Property Form onboarding)
      if (urlTemplate && plan.propertyTemplate !== 'all' && plan.propertyTemplate !== urlTemplate) {
        return false;
      }
      if (urlCategory && plan.hotelCategories && plan.hotelCategories.length > 0) {
        if (!plan.hotelCategories.some(c => c.toLowerCase() === urlCategory.toLowerCase())) return false;
      }
      if (urlStars && plan.starRatings && plan.starRatings.length > 0) {
        if (!plan.starRatings.includes(Number(urlStars))) return false;
      }
      if (urlResortType && plan.resortTypes && plan.resortTypes.length > 0) {
        if (!plan.resortTypes.some(r => r.toLowerCase() === urlResortType.toLowerCase())) return false;
      }

      // 2. Normal Tab / Preferred Type Filter
      // Always show general plans
      if (!plan.propertyTemplate || plan.propertyTemplate === 'all') return true;

      const planType = plan.propertyTemplate.toLowerCase();

      if (typeKey === 'all') {
        // Show plans matching ANY of the user's preferred types
        return effectiveTypes.length === 0 || effectiveTypes.some(t => t.toLowerCase() === planType);
      }

      // Show plans matching the specific tab
      return planType === typeKey.toLowerCase();
    });
  };

  const handleFilterChange = (typeKey) => {
    setActiveFilter(typeKey);
    setPlans(filterPlansByType(allPlans, typeKey));
  };

  const handleBuyPlan = async (planId, price) => {
    try {
      // 1. Create Order
      const { order } = await subscriptionService.createSubscriptionOrder(planId);

      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // 2. Open Checkout using centralized utility
      try {
        const response = await paymentService.openCheckout({
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "NowStay Partner",
          description: `Subscription: ${allPlans.find(p => p._id === planId)?.name || 'Plan'}`,
          order_id: order.id,
          prefill: {
            name: user.name || '',
            email: user.email || '',
            contact: user.phone || ''
          }
        });

        // 3. Verify and Finalize
        await subscriptionService.buySubscription({
          planId,
          paymentMethod: 'razorpay',
          ...response
        });
        toast.success('Successfully subscribed! Your commission rates are updated.');
        const redirectBack = searchParams.get('redirectBack');
        if (redirectBack) {
          navigate(redirectBack);
        } else {
          fetchData();
        }
      } catch (err) {
        if (err.message !== 'Payment cancelled by user') {
          toast.error(err.response?.data?.message || 'Payment failed');
        }
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  const calculateRefund = (sub) => {
    if (!sub) return 0;
    const now = new Date().getTime();
    const start = new Date(sub.startDate).getTime();
    const end = new Date(sub.endDate).getTime();

    const oneDayMs = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end - start) / oneDayMs));
    const remainingDays = Math.max(0, Math.ceil((end - now) / oneDayMs));

    if (remainingDays <= 0) return 0;
    const paid = sub.amountPaid || sub.planId?.price || 0;
    if (remainingDays >= totalDays) return paid;

    return Math.max(0, Math.round((remainingDays / totalDays) * paid));
  };

  const handleCancelSubscription = async () => {
    if (!cancellingSub) return;
    setCancellingLoading(true);
    try {
      const res = await subscriptionService.cancelSubscription(cancellingSub._id);
      toast.success(res.message || 'Subscription cancelled successfully!');
      setCancellingSub(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setCancellingLoading(false);
    }
  };

  // Build filter tabs: 'all' + partner's preferred types
  const filterTabs = [
    { key: 'all', label: 'All Plans' },
    ...preferredTypes.map(typeKey => {
      const info = STATIC_TYPES.find(t => t.key === typeKey) || { key: typeKey, label: typeKey };
      return { key: typeKey, label: info.label };
    })
  ];

  if (loading) return <div className="p-8">Loading plans...</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-gray-500">Manage your property-specific subscription plans to increase your earnings.</p>
      </div>

      {mySubs.filter(sub => sub.planId).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {mySubs.filter(sub => sub.planId).map((sub) => (
            <div key={sub._id} className="bg-gradient-to-r from-teal-500 to-emerald-600 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
              <ShieldCheck size={120} className="absolute -right-4 -bottom-4 opacity-10" />
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-lg font-medium opacity-90">Active Plan</h2>
                  <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                    {sub.planId?.propertyTemplate || 'ALL'}
                  </span>
                </div>
                <div className="text-xl font-bold mb-3 leading-snug break-words">{sub.planId?.name || 'Active Subscription'}</div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm">Valid Until: <strong>{new Date(sub.endDate).toLocaleDateString()}</strong></p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center justify-between z-10">
                <span className="text-xs text-white/80 font-medium">Refund to Wallet on Cancel</span>
                <button
                  onClick={() => setCancellingSub(sub)}
                  className="px-3 py-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Cancel Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-6 rounded-2xl mb-10 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">No Active Subscription</h3>
          <p className="text-gray-600">You are currently on the free default plan. Booking commission will be automatically deducted from your wallet for every booking.</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Filter size={16} />
            <span className="text-sm font-bold uppercase tracking-wider">Filter by type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleFilterChange(tab.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                  activeFilter === tab.key
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info banner when filtering by preferred type */}
        {activeFilter !== 'all' && preferredTypes.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3 mb-4">
            <Building2 size={16} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 font-bold">
              Showing plans matching your <span className="uppercase">{activeFilter}</span> property type. 
              <button onClick={() => handleFilterChange('all')} className="underline ml-1">Show all plans</button>
            </p>
          </div>
        )}

        {preferredTypes.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3 mb-4">
            <Building2 size={16} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-bold">
              Set your property types in <button onClick={() => navigate('/hotel/profile')} className="underline">your profile</button> to see relevant plans automatically.
            </p>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-6">Available Plans {plans.length > 0 && <span className="text-base font-normal text-gray-400 ml-2">({plans.length} plans)</span>}</h2>
      
      {plans.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
          <Building2 size={48} className="text-gray-200 mx-auto mb-3" />
          <h3 className="font-bold text-gray-500 mb-1">No plans found for this type</h3>
          <p className="text-sm text-gray-400 mb-4">Try selecting "All Plans" or contact support</p>
          <button onClick={() => handleFilterChange('all')} className="px-6 py-2 bg-[#0F172A] text-white rounded-xl text-sm font-bold hover:bg-[#003836] transition-all">
            Show All Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {plans.map((plan, index) => (
            <div key={plan._id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-3 py-1 absolute top-0 right-0 rounded-bl-xl shadow-sm tracking-wider uppercase">PREMIUM</div>
              <div className="p-6 pb-4 flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${index === 0 ? 'bg-blue-50 text-blue-600' : index === 1 ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                    {index === 0 ? <Zap size={20} /> : index === 1 ? <Star size={20} /> : <Crown size={20} />}
                  </div>
                  <div className="flex flex-wrap gap-1 items-center justify-end">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {plan.propertyTemplate}
                    </span>
                    {Array.isArray(plan.starRatings) && plan.starRatings.length > 0 && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {plan.starRatings.join(', ')} ★
                      </span>
                    )}
                    {Array.isArray(plan.hotelCategories) && plan.hotelCategories.filter(c => c !== 'Low Budget').length > 0 && (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {plan.hotelCategories.filter(c => c !== 'Low Budget').join(', ')}
                      </span>
                    )}
                    {Array.isArray(plan.resortTypes) && plan.resortTypes.filter(rt => !["5 Star Resort", "Luxury"].includes(rt)).length > 0 && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {plan.resortTypes.filter(rt => !["5 Star Resort", "Luxury"].includes(rt)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-base font-black text-gray-900 mb-1 capitalize leading-snug break-words">{plan.name}</h3>
                <p className="text-xs text-gray-400 mb-3 leading-tight break-words">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-400 text-xs font-bold font-mono">/{plan.durationInMonths}MO</span>
                </div>

                <ul className="space-y-2.5 mb-2">
                  <li className="flex items-center gap-2.5 text-xs font-bold text-gray-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Verified Partner Badge</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-xs font-bold text-gray-600">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 pt-0 mt-auto">
                {(() => {
                  const activePlanForTemplate = mySubs.find(s => s.planId && (s.planId.propertyTemplate === plan.propertyTemplate || s.planId.propertyTemplate === 'all'));
                  const isCurrentPlan = activePlanForTemplate?.planId?._id === plan._id;
                  
                  let buttonText = 'Subscribe Now';
                  if (isCurrentPlan) {
                    buttonText = 'Current Plan';
                  } else if (activePlanForTemplate && activePlanForTemplate.planId) {
                    buttonText = plan.price > activePlanForTemplate.planId.price ? 'Upgrade Now' : (plan.price < activePlanForTemplate.planId.price ? 'Downgrade' : 'Renew / Purchase');
                  }

                  return (
                    <button
                      onClick={() => handleBuyPlan(plan._id, plan.price)}
                      disabled={isCurrentPlan}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg ${isCurrentPlan
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                          : 'bg-black text-white hover:bg-gray-900 shadow-black/10 active:scale-95'
                        }`}
                    >
                      {buttonText}
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingSub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 border border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
              <ShieldCheck size={32} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">Cancel Subscription?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to cancel your <strong className="text-gray-800">{cancellingSub.planId?.name}</strong>?
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-1 text-center">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Estimated Refund to Wallet</div>
              <div className="text-3xl font-black text-emerald-600">₹{calculateRefund(cancellingSub)}</div>
              <div className="text-[11px] text-emerald-700/80 font-medium">Calculated prorated based on unused days</div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 text-xs text-gray-500 space-y-1">
              <p>• Your property will revert to default commission model immediately.</p>
              <p>• Refund will be instantly credited to your NowStay Wallet.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCancellingSub(null)}
                disabled={cancellingLoading}
                className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancellingLoading}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {cancellingLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSubscriptions;

