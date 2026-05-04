import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, CheckCircle2, Crown, Zap, Star } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import paymentService from '../../../services/paymentService';

const PartnerSubscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        subscriptionService.getPartnerPlans(),
        subscriptionService.getMySubscription()
      ]);
      setPlans(plansData.plans);
      setMySub(subData.subscription);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
          description: `Subscription: ${plans.find(p => p._id === planId)?.name || 'Plan'}`,
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
        fetchData();
      } catch (err) {
        if (err.message !== 'Payment cancelled by user') {
          toast.error(err.response?.data?.message || 'Payment failed');
        }
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    }
  };

  if (loading) return <div className="p-8">Loading plans...</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Subscription</h1>
        <p className="text-gray-500">Upgrade your plan to zero-commission and increase your earnings.</p>
      </div>

      {mySub ? (
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-8 rounded-2xl text-white mb-10 shadow-xl relative overflow-hidden">
          <ShieldCheck size={120} className="absolute -right-4 -bottom-4 opacity-10" />
          <h2 className="text-lg font-medium opacity-90 mb-1">Active Plan</h2>
          <div className="text-4xl font-black mb-4">{mySub.planId.name}</div>
          <div className="space-y-2">
            <p>Commission on Bookings: <strong>{mySub.planId.commissionRate}%</strong></p>
            <p>Valid Until: <strong>{new Date(mySub.endDate).toLocaleDateString()}</strong></p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-6 rounded-2xl mb-10 border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">No Active Subscription</h3>
          <p className="text-gray-600">You are currently on the free default plan. Platform commission will be automatically deducted from your wallet for every booking.</p>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div key={plan._id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {plan.commissionRate === 0 && (
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-3 py-1 absolute top-0 right-0 rounded-bl-xl shadow-sm tracking-wider uppercase">PREMIUM</div>
            )}
            <div className="p-6 pb-4 flex-1">
              <div className="mb-4 flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${index === 0 ? 'bg-blue-50 text-blue-600' : index === 1 ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                  {index === 0 ? <Zap size={20} /> : index === 1 ? <Star size={20} /> : <Crown size={20} />}
                </div>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-1 capitalize">{plan.name}</h3>
              <p className="text-xs text-gray-400 mb-4 leading-tight">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-gray-900">₹{plan.price}</span>
                <span className="text-gray-400 text-xs font-bold font-mono">/{plan.durationInMonths}MO</span>
              </div>

              <ul className="space-y-2.5 mb-2">
                <li className="flex items-center gap-2.5 text-xs font-bold text-gray-600">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>{plan.commissionRate}% Commission</span>
                </li>
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
              <button
                onClick={() => handleBuyPlan(plan._id, plan.price)}
                disabled={mySub?.planId?._id === plan._id}
                className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg ${mySub?.planId?._id === plan._id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-black text-white hover:bg-gray-900 shadow-black/10 active:scale-95'
                  }`}
              >
                {mySub?.planId?._id === plan._id
                  ? 'Current Plan'
                  : mySub
                    ? plan.price > mySub.planId.price
                      ? 'Upgrade Now'
                      : plan.price < mySub.planId.price
                        ? 'Downgrade'
                        : 'Renew / Purchase'
                    : 'Subscribe Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartnerSubscriptions;
