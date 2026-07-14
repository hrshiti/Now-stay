import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Percent, Sparkles, Crown, ArrowRight, X } from 'lucide-react';

const SubscriptionOnboardingModal = ({ isOpen, onClose, onProceedWithCommission, redirectUrl }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('subscription');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (window.lenis) window.lenis.stop();
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (window.lenis) window.lenis.start();
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      if (window.lenis) window.lenis.start();
    };
  }, [isOpen]);

  const handleSubscribeClick = () => {
    onClose();
    const encodedRedirect = encodeURIComponent(redirectUrl || window.location.pathname);
    navigate(`/hotel/subscriptions?redirectBack=${encodedRedirect}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#001413]/70 backdrop-blur-md z-[9998]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,56,54,0.3)] pointer-events-auto border border-gray-100/80 flex flex-col max-h-[90vh] md:max-h-none"
            >
              {/* Header */}
              <div className="relative px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-b from-gray-50 to-white">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="text-amber-500 fill-amber-100 animate-pulse" size={20} />
                    Choose Your Partner Plan
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Select the business model that fits your goals before submitting.</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Mobile View Layout (md:hidden) */}
              <div className="p-5 flex flex-col md:hidden overflow-y-auto">
                <div className="space-y-3 mb-4">
                  {/* Subscription Option Card */}
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan('subscription')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between relative overflow-hidden ${
                      selectedPlan === 'subscription' 
                        ? 'border-amber-400 bg-amber-50/15 shadow-[0_8px_20px_-6px_rgba(245,158,11,0.15)]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[7px] font-black px-2.5 py-0.5 rounded-bl-lg tracking-wider uppercase shadow-sm">
                      RECOMMENDED
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        selectedPlan === 'subscription'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25'
                          : 'bg-amber-50 text-amber-500 border border-amber-100'
                      }`}>
                        <Crown size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 mb-0.5">Zero-Commission Pro</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Keep 100% of your booking revenues</p>
                      </div>
                    </div>
                    <div className="flex items-center pr-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        selectedPlan === 'subscription'
                          ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedPlan === 'subscription' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </motion.div>

                  {/* Commission Option Card */}
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPlan('commission')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
                      selectedPlan === 'commission' 
                        ? 'border-[#003836] bg-[#003836]/5 shadow-[0_8px_20px_-6px_rgba(0,56,54,0.1)]' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        selectedPlan === 'commission'
                          ? 'bg-[#003836] text-white shadow-md shadow-[#003836]/20'
                          : 'bg-teal-50 text-teal-600 border border-teal-100'
                      }`}>
                        <Percent size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 mb-0.5">Commission-Based</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Pay only when you get guest bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center pr-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        selectedPlan === 'commission'
                          ? 'border-[#003836] bg-[#003836] text-white shadow-sm'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {selectedPlan === 'commission' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Mobile Features Area */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100 flex-1 min-h-[110px]">
                  <p className="text-[9px] uppercase font-black text-gray-400 tracking-wider mb-2.5">Plan Benefits</p>
                  <AnimatePresence mode="wait">
                    {selectedPlan === 'subscription' ? (
                      <motion.ul
                        key="sub-features-mob"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-2.5"
                      >
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                          <span><strong className="text-gray-900">0% Commission</strong> on all bookings</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                          <span><strong className="text-gray-900">Verified Badge</strong> on your listing</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                          <span>Priority support & instant listing boost</span>
                        </li>
                      </motion.ul>
                    ) : (
                      <motion.ul
                        key="comm-features-mob"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-2.5"
                      >
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                          <span>Standard booking commission per booking</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                          <span>No fixed monthly or annual payments</span>
                        </li>
                        <li className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                          <span>Standard listing visibility</span>
                        </li>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Unified CTA Button */}
                <div className="space-y-2.5">
                  {selectedPlan === 'subscription' ? (
                    <button
                      onClick={handleSubscribeClick}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs tracking-wider uppercase shadow-md shadow-amber-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                    >
                      Subscribe & Save
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onProceedWithCommission();
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#003836] hover:bg-[#002523] text-white font-black text-xs tracking-wider uppercase shadow-md shadow-teal-900/10 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                    >
                      Select Commission
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2.5 text-center text-xs font-bold text-gray-400 hover:text-gray-600 transition"
                  >
                    Select Later
                  </button>
                </div>
              </div>

              {/* Desktop View Layout (md:grid) */}
              <div className="hidden md:grid grid-cols-2 gap-6 p-6">
                {/* Desktop Plan A: Commission */}
                <div className="border border-gray-200 rounded-[1.5rem] p-6 flex flex-col justify-between hover:border-teal-600/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 bg-white">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-5 border border-teal-100">
                      <Percent size={22} />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1">Commission-Based</h4>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mb-5">
                      Pay only when you get guest bookings. Best for starting out with zero upfront risk.
                    </p>
                    
                    <ul className="space-y-3.5 mb-8">
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-600 leading-tight">
                        <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                        <span>Standard booking commission per booking</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-600 leading-tight">
                        <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                        <span>No fixed monthly or annual payments</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-600 leading-tight">
                        <span className="text-teal-600 font-bold shrink-0 text-sm">✓</span>
                        <span>Standard listing visibility</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onProceedWithCommission();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl border-2 border-gray-200 hover:border-[#003836] text-[#003836] font-black text-xs tracking-wider uppercase hover:bg-gray-50 active:scale-95 transition-all mt-auto flex items-center justify-center"
                  >
                    Select Commission
                  </button>
                </div>

                {/* Desktop Plan B: Subscription */}
                <div className="border-2 border-amber-400 rounded-[1.5rem] p-6 flex flex-col justify-between hover:shadow-[0_12px_40px_rgba(245,158,11,0.12)] transition-all duration-300 bg-gradient-to-b from-amber-50/20 to-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-black px-3.5 py-1.5 rounded-bl-xl shadow-sm tracking-wider uppercase">
                    RECOMMENDED
                  </div>

                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center text-white mb-5 border border-amber-400 shadow-md shadow-amber-500/25">
                      <Crown size={22} />
                    </div>
                    <h4 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-1.5">
                      Zero-Commission Pro
                    </h4>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mb-5">
                      Pay a small flat subscription and keep 100% of your guest booking revenues.
                    </p>
                    
                    <ul className="space-y-3.5 mb-8">
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-700 leading-tight">
                        <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                        <span><strong className="text-gray-900">0% Commission</strong> on all bookings</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-700 leading-tight">
                        <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                        <span><strong className="text-gray-900">Verified Badge</strong> on your listing</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-xs font-semibold text-gray-700 leading-tight">
                        <span className="text-amber-500 font-bold shrink-0 text-sm">✓</span>
                        <span>Priority support & instant listing boost</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={handleSubscribeClick}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs tracking-wider uppercase shadow-md shadow-amber-500/25 active:scale-95 transition-all mt-auto flex items-center justify-center gap-1.5"
                  >
                    Subscribe & Save
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionOnboardingModal;
