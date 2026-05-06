import React from 'react';
import usePartnerStore from '../store/partnerStore';
import { Link } from 'react-router-dom';

const StepUserRegistration = () => {
  const { formData, updateFormData } = usePartnerStore();

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
        <input
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F172A]"
          placeholder="Enter your full name"
          value={formData.full_name}
          onChange={e => handleChange('full_name', e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
        <input
          type="email"
          className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-all ${
            formData.email 
              ? /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)
                ? 'border-green-500 ring-1 ring-green-500/20'
                : 'border-red-500 ring-1 ring-red-500/20'
              : 'border-gray-200 focus:ring-2 focus:ring-[#0F172A]'
          }`}
          placeholder="name@example.com"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value.toLowerCase().trim())}
        />
        {formData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email) && (
          <p className="text-[10px] text-red-500 mt-1 font-medium italic">Please enter a valid email address (e.g., name@example.com)</p>
        )}
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#0F172A] transition-all">
          <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-500">
            +91
          </div>
          <input
            type="tel"
            className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-300"
            placeholder="10-digit mobile number"
            value={formData.phone}
            onChange={e => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </div>
        <p className="text-[10px] text-teal-600 font-bold mt-1.5 ml-1 flex items-center gap-1">
          <span>•</span> Please enter the phone number linked to your WhatsApp.
        </p>
      </div>

      <div className="flex items-start gap-2 mt-2">
        <input
          id="terms"
          type="checkbox"
          className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0F172A] focus:ring-[#0F172A]"
          checked={formData.termsAccepted}
          onChange={e => handleChange('termsAccepted', e.target.checked)}
        />
        <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
          I agree to the <Link to="/terms?audience=partner" className="text-[#0F172A] font-bold hover:underline">Terms & Conditions</Link> and <Link to="/privacy?audience=partner" className="text-[#0F172A] font-bold hover:underline">Privacy Policy</Link> of NowStay Partner.
        </label>
      </div>
    </div>
  );
};

export default StepUserRegistration;
