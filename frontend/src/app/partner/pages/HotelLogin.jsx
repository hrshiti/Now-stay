import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2, Shield, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService, hotelService } from '../../../services/apiService';
import NowStayLogo from '../../../components/ui/NowStayLogo';
import { clearPropertyDrafts } from '../../../utils/localStorageUtils';
import toast from 'react-hot-toast';
import PropertyTypeSelector from '../components/PropertyTypeSelector';

const HotelLogin = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [method, setMethod] = useState('phone');
    const [contact, setContact] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 3: property type selection state
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [savingTypes, setSavingTypes] = useState(false);

    React.useEffect(() => {
        const handleFocusIn = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(() => { e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
            }
        };
        window.addEventListener('focusin', handleFocusIn);
        return () => window.removeEventListener('focusin', handleFocusIn);
    }, []);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (method === 'phone' && contact.length !== 10) { setError('Please enter a valid 10-digit phone number'); return; }
        if (method === 'email' && !contact.includes('@')) { setError('Please enter a valid email address'); return; }
        setLoading(true);
        try {
            await authService.sendOtp(contact, 'login', 'partner');
            toast.success('OTP sent successfully');
            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 3) { document.getElementById(`otp-${index + 1}`)?.focus(); }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 4) { setError('Please enter complete OTP'); return; }
        setLoading(true);
        try {
            const result = await authService.verifyOtp({
                phone: method === 'phone' ? contact : undefined,
                email: method === 'email' ? contact : undefined,
                otp: otpString,
                role: 'partner'
            });
            const user = result?.user;
            const isNew = user && (!user.preferredPropertyTypes || user.preferredPropertyTypes.length === 0);
            if (isNew) {
                setStep(3);
            } else {
                navigate('/hotel/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePropertyTypes = async () => {
        setSavingTypes(true);
        try {
            if (selectedTypes.length > 0) {
                await hotelService.updatePropertyTypes(selectedTypes);
                toast.success('Property types saved!');
            }
            navigate('/hotel/dashboard');
        } catch (err) {
            console.error('Failed to save property types:', err);
            navigate('/hotel/dashboard');
        } finally {
            setSavingTypes(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#003836] via-[#0F172A] to-[#006663] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="inline-block mb-4">
                        <NowStayLogo size="lg" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white">Partner Login</h1>
                    <p className="text-teal-100 mt-2">Access your hotel dashboard</p>
                </div>

                <motion.div layout className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Login with OTP</h2>
                                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => setMethod('phone')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${method === 'phone' ? 'bg-[#0F172A] text-white shadow-md' : 'text-gray-500'}`}>
                                        <Phone size={16} className="inline mr-2" />Phone
                                    </button>
                                    <button type="button" onClick={() => setMethod('email')} className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${method === 'email' ? 'bg-[#0F172A] text-white shadow-md' : 'text-gray-500'}`}>
                                        <Mail size={16} className="inline mr-2" />Email
                                    </button>
                                </div>
                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{method === 'phone' ? 'Phone Number' : 'Email Address'}</label>
                                        <div className="relative">
                                            {method === 'phone' ? <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /> : <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />}
                                            <input type={method === 'phone' ? 'tel' : 'email'} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={method === 'phone' ? '9876543210' : 'partner@hotel.com'} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F172A] focus:border-transparent outline-none transition-all" required />
                                        </div>
                                    </div>
                                    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm">{error}</motion.p>}
                                    <button type="submit" disabled={loading} className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#003836] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : <><span>Send OTP</span><ArrowRight size={20} /></>}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4"><Shield size={32} className="text-[#0F172A]" /></div>
                                    <h2 className="text-xl font-bold text-gray-900">Enter OTP</h2>
                                    <p className="text-sm text-gray-500 mt-2">Code sent to {method === 'phone' ? `+91 ${contact}` : contact}</p>
                                </div>
                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((digit, index) => (
                                            <input key={index} id={`otp-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleOTPChange(index, e.target.value)} className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-400 rounded-xl focus:border-[#0F172A] focus:ring-2 focus:ring-teal-200 outline-none transition-all" />
                                        ))}
                                    </div>
                                    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">{error}</motion.p>}
                                    <button type="submit" disabled={loading} className="w-full bg-[#0F172A] text-white py-3 rounded-xl font-bold shadow-lg hover:bg-[#003836] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : 'Verify & Login'}
                                    </button>
                                    <button type="button" onClick={() => setStep(1)} className="w-full text-gray-500 text-sm hover:text-gray-700">Change {method === 'phone' ? 'number' : 'email'}</button>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="bg-gradient-to-r from-[#0F172A] to-[#003836] px-8 pt-8 pb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Building2 size={20} className="text-white" /></div>
                                        <div>
                                            <p className="text-teal-200 text-[10px] font-black uppercase tracking-widest">One Last Step</p>
                                            <h2 className="text-white text-lg font-black">Your Property Types</h2>
                                        </div>
                                    </div>
                                    <p className="text-teal-100 text-xs font-medium leading-relaxed">Select the types of properties you manage. This helps us show you the right subscription plans.</p>
                                </div>
                                <div className="px-6 py-5 max-h-[52vh] overflow-y-auto">
                                    <PropertyTypeSelector selectedTypes={selectedTypes} onChange={setSelectedTypes} />
                                </div>
                                <div className="px-8 pb-8 pt-4 border-t border-gray-100 space-y-3">
                                    <button type="button" onClick={handleSavePropertyTypes} disabled={savingTypes} className="w-full bg-[#0F172A] text-white py-3.5 rounded-2xl font-black text-sm shadow-lg hover:bg-[#003836] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                        {savingTypes ? <Loader2 size={18} className="animate-spin" /> : <><span>{selectedTypes.length > 0 ? `Save & Continue (${selectedTypes.length} selected)` : 'Save & Go to Dashboard'}</span><ChevronRight size={18} /></>}
                                    </button>
                                    <button type="button" onClick={() => navigate('/hotel/dashboard')} className="w-full text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors py-1">Skip for now</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {step !== 3 && (
                    <p className="text-center text-teal-100 text-sm mt-6">
                        New partner?{' '}
                        <button onClick={() => { clearPropertyDrafts(); navigate('/hotel/join'); }} className="text-white font-bold hover:underline">Register Your Property</button>
                    </p>
                )}
            </motion.div>
        </div>
    );
};

export default HotelLogin;

