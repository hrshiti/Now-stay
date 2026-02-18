import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ShieldCheck, Zap, Package, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import subscriptionService from '../../../services/subscriptionService';

const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const PartnerSubscriptions = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [plans, setPlans] = useState([]);
    const [currentSub, setCurrentSub] = useState(null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansData, subData] = await Promise.all([
                subscriptionService.getActivePlans(),
                subscriptionService.getCurrentSubscription()
            ]);

            if (plansData.success) {
                setPlans(plansData.plans);
            }
            if (subData.success) {
                setCurrentSub(subData.subscription);
            }
        } catch (error) {
            console.error(error);
            // toast.error('Failed to load subscription data');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan) => {
        if (processing) return;
        setProcessing(true);
        const toastId = toast.loading('Initializing payment...');

        try {
            const isLoaded = await loadRazorpay();
            if (!isLoaded) throw new Error("Razorpay SDK failed to load");

            // 1. Create Order
            const { order, key } = await subscriptionService.createSubscriptionOrder(plan._id);

            // 2. Open Razorpay
            const options = {
                key: key,
                amount: order.amount,
                currency: order.currency,
                name: "NowStay Partner",
                description: `Subscription: ${plan.name}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        toast.loading('Verifying payment...', { id: toastId });
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: plan._id
                        };

                        const verifyRes = await subscriptionService.verifySubscription(verifyPayload);
                        if (verifyRes.success) {
                            toast.success("Subscription Activated!", { id: toastId });
                            setCurrentSub(verifyRes.subscription);
                            // Refresh plans/state if necessary
                        } else {
                            toast.error("Verification Failed", { id: toastId });
                        }
                    } catch (err) {
                        console.error("Verification Error:", err);
                        toast.error("Payment verification failed", { id: toastId });
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone
                },
                theme: {
                    color: "#0d9488"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || "Payment Failed", { id: toastId });
            });
            rzp.open();

        } catch (error) {
            console.error("Purchase Error:", error);
            toast.error(error.response?.data?.message || "Failed to initiate purchase", { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Helper to calculate days remaining
    const getDaysRemaining = (expiryDate) => {
        if (!expiryDate) return 0;
        const diff = new Date(expiryDate) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const isExpired = currentSub?.status === 'expired' || (currentSub?.expiryDate && new Date(currentSub.expiryDate) < new Date());
    const isActive = currentSub?.status === 'active' && !isExpired;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Subscription</h1>
                <p className="text-gray-500 mt-1">Manage your plan to add more properties and unlock features.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Current Plan Section */}
                    {currentSub && currentSub.planId && (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldCheck size={120} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                {isActive ? 'Active Plan' : 'Expired'}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-2">
                                            {currentSub.planId.name || 'Unknown Plan'}
                                        </h2>
                                        <p className="text-gray-400 text-sm max-w-xl">
                                            {currentSub.planId.description}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-8 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Properties</p>
                                            <p className="text-xl font-bold">
                                                {currentSub.propertiesAdded} <span className="text-gray-500 text-base">/ {currentSub.planId.maxProperties}</span>
                                            </p>
                                        </div>
                                        <div className="w-px h-10 bg-white/10" />
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">{isActive ? 'Expires On' : 'Expired On'}</p>
                                            <p className={`text-xl font-bold ${getDaysRemaining(currentSub.expiryDate) < 7 && isActive ? 'text-orange-400' : ''}`}>
                                                {formatDate(currentSub.expiryDate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {isActive && (
                                    <div className="mt-8">
                                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((currentSub.propertiesAdded / currentSub.planId.maxProperties) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 text-right">
                                            {currentSub.planId.maxProperties - currentSub.propertiesAdded} slots remaining
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Available Plans */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Package className="text-teal-600" />
                            Available Plans
                        </h3>

                        {plans.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                                <p className="text-gray-500">No subscription plans available at the moment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plans.map((plan) => {
                                    // Highlight if it's the current plan (optional logic)
                                    const isCurrentPlan = currentSub?.planId?._id === plan._id && isActive;

                                    return (
                                        <div key={plan._id} className={`bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col ${isCurrentPlan ? 'border-teal-500 ring-1 ring-teal-500/20' : 'border-gray-200 hover:border-teal-200'}`}>
                                            <div className="p-6 flex-1">
                                                <h4 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                                                <p className="text-gray-500 text-sm mb-6 min-h-[40px]">{plan.description || "Unlock more properties and features."}</p>

                                                <div className="flex items-baseline gap-1 mb-6">
                                                    <span className="text-3xl font-black text-gray-900">{formatCurrency(plan.price)}</span>
                                                    <span className="text-gray-500 text-sm font-medium">/ {plan.durationDays} Days</span>
                                                </div>

                                                <ul className="space-y-3 mb-6">
                                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                                        <CheckCircle size={18} className="text-teal-500 shrink-0" />
                                                        <span>Add up to <strong>{plan.maxProperties} Properties</strong></span>
                                                    </li>
                                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                                        <CheckCircle size={18} className="text-teal-500 shrink-0" />
                                                        <span>Priority Support</span>
                                                    </li>
                                                    <li className="flex items-center gap-3 text-sm text-gray-700">
                                                        <CheckCircle size={18} className="text-teal-500 shrink-0" />
                                                        <span>Advanced Analytics</span>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="p-6 pt-0 mt-auto">
                                                <button
                                                    onClick={() => handlePurchase(plan)}
                                                    disabled={processing}
                                                    className={`w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] ${isCurrentPlan
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200'
                                                        }`}
                                                >
                                                    {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default PartnerSubscriptions;
