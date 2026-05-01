import React, { useRef, useState, useEffect } from 'react';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { legalService } from '../../../services/apiService';

const PartnerContact = () => {
  const contentRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(
      contentRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Branded Header */}
      <div className="bg-surface text-white p-6 pb-14 rounded-b-[30px] shadow-lg relative z-20">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Contact Us</h1>
        </div>
        <div className="space-y-1">
            <h2 className="text-2xl font-black leading-tight">We're here to help you.</h2>
            <p className="text-sm text-white/70 font-medium">Reach out to us for any queries or support.</p>
        </div>
      </div>

      <main ref={contentRef} className="px-5 -mt-8 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white min-h-[300px]">
          
          {/* Section Title */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center text-surface">
              <Phone size={24} />
            </div>
            <h3 className="text-xl font-black text-surface tracking-tight">Get in touch with us</h3>
          </div>

          <div className="h-px bg-gray-100 w-full mb-8" />

          {/* Contact Methods */}
          <div className="space-y-4">
            {/* Email Box */}
            <div className="bg-gray-50/80 border border-gray-100 p-5 rounded-2xl flex items-center gap-4 group hover:bg-gray-100 transition-colors">
              <div className="text-surface">
                <Mail size={20} />
              </div>
              <a href="mailto:nowstayindia@gmail.com" className="text-sm font-bold text-surface hover:underline decoration-2 underline-offset-4">
                nowstayindia@gmail.com
              </a>
            </div>

            {/* Phone Box */}
            <div className="bg-gray-50/80 border border-gray-100 p-5 rounded-2xl flex items-center gap-4 group hover:bg-gray-100 transition-colors">
              <div className="text-surface">
                <Phone size={20} />
              </div>
              <a href="tel:9970907005" className="text-sm font-bold text-surface hover:underline decoration-2 underline-offset-4">
                +91 9970907005
              </a>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Support Available 24/7</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PartnerContact;

