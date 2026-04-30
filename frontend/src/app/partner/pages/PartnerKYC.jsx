import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, Clock, XCircle, ChevronRight, FileText, Camera } from 'lucide-react';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import usePartnerStore from '../store/partnerStore';
import { authService } from '../../../services/apiService';
import walletService from '../../../services/walletService';

const DocStatus = ({ status }) => {
    switch (status) {
        case 'verified':
            return <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle size={10} /> Verified</span>;
        case 'pending':
            return <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10} /> Reviewing</span>;
        case 'rejected':
            return <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1"><XCircle size={10} /> Action Needed</span>;
        default:
            return <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Not Uploaded</span>;
    }
};

const PartnerKYC = () => {
    const listRef = useRef(null);
    const navigate = useNavigate();
    const [user, setUser] = React.useState(null);
    const [wallet, setWallet] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Get user from localStorage first for quick load
                const localUser = JSON.parse(localStorage.getItem('user'));
                setUser(localUser);

                // Fetch fresh data
                const [meRes, walletRes] = await Promise.all([
                    authService.getMe().catch(() => null),
                    walletService.getWallet({ viewAs: 'partner' }).catch(() => null)
                ]);

                if (meRes?.user) {
                    setUser(meRes.user);
                    localStorage.setItem('user', JSON.stringify(meRes.user));
                }
                if (walletRes?.wallet) {
                    setWallet(walletRes.wallet);
                }
            } catch (error) {
                console.error("KYC Data Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Map backend status to UI status
    const getStatus = (backendStatus) => {
        if (backendStatus === 'approved') return 'verified';
        if (backendStatus === 'pending') return 'pending';
        if (backendStatus === 'rejected') return 'rejected';
        return 'none';
    };

    // Helper for formatting date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const hasBankDetails = wallet?.bankDetails?.accountNumber;

    const kycSteps = [
        { 
            id: 1, 
            label: "Aadhaar Card Details", 
            status: getStatus(user?.partnerApprovalStatus), 
            desc: user?.partnerApprovalStatus === 'approved' 
                ? `Verified on ${formatDate(user?.updatedAt || user?.createdAt)}` 
                : `Submitted on ${formatDate(user?.createdAt)}${user?.aadhaar_number ? `: •••• ${user.aadhaar_number.slice(-4)}` : ': Details Reviewing'}` 
        },
        { 
            id: 2, 
            label: "Aadhaar Front & Back Images", 
            status: getStatus(user?.partnerApprovalStatus), 
            desc: user?.partnerApprovalStatus === 'approved' 
                ? `Verified on ${formatDate(user?.updatedAt || user?.createdAt)}` 
                : `Submitted on ${formatDate(user?.createdAt)}. Under review.` 
        },
        { 
            id: 3, 
            label: "PAN Card Verification", 
            status: getStatus(user?.partnerApprovalStatus), 
            desc: user?.partnerApprovalStatus === 'approved' 
                ? `Verified on ${formatDate(user?.updatedAt || user?.createdAt)}` 
                : `Submitted on ${formatDate(user?.createdAt)}${user?.pan_number ? `: ${user.pan_number.slice(0, 5)}••••${user.pan_number.slice(-1)}` : ': Details Reviewing'}` 
        },
    ];

    useEffect(() => {
        if (!loading && listRef.current) {
            gsap.fromTo(listRef.current.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
            );
        }
    }, [loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="KYC Verification" subtitle="Complete your profile" />

            <div className="bg-[#0F172A] text-white p-6 pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Verification Status</h2>
                            <p className="text-sm text-white/60">Complete all steps to start receiving payouts.</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 -mt-8">
                <div ref={listRef} className="bg-white rounded-[2rem] p-2 shadow-xl shadow-gray-200/50 border border-gray-100">
                    {kycSteps.map((step, idx) => (
                        <div key={idx} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer border-b border-gray-50 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#0F172A] group-hover:text-white transition-colors">
                                        <FileText size={16} />
                                    </div>
                                    <h4 className="font-bold text-[#003836] text-sm">{step.label}</h4>
                                </div>
                                <DocStatus status={step.status} />
                            </div>
                            <p className="text-xs text-gray-400 pl-11 pr-4 leading-relaxed">
                                {step.desc}
                            </p>
                            {step.status === 'rejected' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (step.id === 2) navigate('/hotel/bank-details');
                                    }}
                                    className="ml-11 mt-3 text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    <Camera size={14} /> Re-upload Document
                                </button>
                            )}
                            {step.status === 'none' && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (step.id === 2) navigate('/hotel/bank-details');
                                        if (step.id === 3) navigate('/hotel/join');
                                    }}
                                    className="ml-11 mt-3 text-xs font-bold bg-[#0F172A] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                                >
                                    Upload Now <ChevronRight size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default PartnerKYC;
