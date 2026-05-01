import React, { useEffect, useRef } from 'react';
import { Shield, CheckCircle, Clock, XCircle, ChevronRight, FileText, Camera } from 'lucide-react';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import usePartnerStore from '../store/partnerStore';

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
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;

    // Map real data from user profile
    const kycSteps = [
        { 
            id: 1, 
            label: "Identity Proof (Aadhaar Card)", 
            status: user?.aadhaarFront && user?.aadhaarBack ? (user?.partnerApprovalStatus === 'approved' ? "verified" : "pending") : "none", 
            desc: user?.aadhaarFront ? "Aadhaar documents submitted." : "Aadhaar documents missing." 
        },
        { 
            id: 2, 
            label: "PAN Card Verification", 
            status: user?.panCardImage ? (user?.partnerApprovalStatus === 'approved' ? "verified" : "pending") : "none", 
            desc: user?.panCardImage ? "PAN card image submitted." : "PAN card image missing." 
        },
        { 
            id: 3, 
            label: "Partner Approval Status", 
            status: user?.partnerApprovalStatus || "pending", 
            desc: user?.partnerApprovalStatus === 'approved' 
                ? "Your partner account is fully approved." 
                : user?.partnerApprovalStatus === 'rejected' 
                    ? "Approval rejected. Please contact support." 
                    : "Your documents are currently under review by admin." 
        },
    ];

    useEffect(() => {
        if (listRef.current) {
            gsap.fromTo(listRef.current.children,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power2.out' }
            );
        }
    }, []);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-8 text-center">
                <p className="text-sm font-bold text-gray-400">Please login to view your KYC status.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="KYC Verification" subtitle="Real-time document status" />

            <div className="bg-[#0F172A] text-white p-6 pb-12">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Verification Status</h2>
                            <p className="text-sm text-white/60">
                                {user.partnerApprovalStatus === 'approved' 
                                    ? "Your account is verified and active." 
                                    : "Documents submitted. Pending admin review."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 -mt-8">
                <div ref={listRef} className="bg-white rounded-[2rem] p-2 shadow-xl shadow-gray-200/50 border border-gray-100">
                    {kycSteps.map((step, idx) => (
                        <div key={idx} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
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
                                <button className="ml-11 mt-3 text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors">
                                    <Camera size={14} /> Re-submit Documents
                                </button>
                            )}
                            {step.status === 'none' && (
                                <button className="ml-11 mt-3 text-xs font-bold bg-[#0F172A] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
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
