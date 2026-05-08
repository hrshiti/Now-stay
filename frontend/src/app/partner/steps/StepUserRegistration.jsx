import React from 'react';
import usePartnerStore from '../store/partnerStore';
import { Link } from 'react-router-dom';
import { X, FileText, CheckCircle } from 'lucide-react';
import { legalService } from '../../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';

const StepUserRegistration = () => {
  const { formData, updateFormData } = usePartnerStore();

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  // Legal Modal State
  const [legalModal, setLegalModal] = React.useState(null); // 'terms' | 'privacy' | null
  const [legalContent, setLegalContent] = React.useState(null);
  const [legalLoading, setLegalLoading] = React.useState(false);

  // Simple Markdown to HTML converter
  const parseMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-black text-gray-800 mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-black text-gray-900 mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-black text-gray-900 mt-5 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-black text-gray-800">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^\* (.+)$/gm, '<li class="ml-4 list-disc text-gray-600">$1</li>')
      .replace(/(<li.*<\/li>)/gs, '<ul class="space-y-1 my-2">$1</ul>')
      .replace(/\n\n/g, '</p><p class="text-gray-600 my-2">')
      .replace(/\n/g, '<br />')
      .replace(/^(?!<)(.+)$/gm, '<p class="text-gray-600 my-1">$1</p>');
  };

  const openLegalModal = async (type) => {
    setLegalModal(type);
    setLegalContent(null);
    setLegalLoading(true);
    try {
      const res = await legalService.getPage('partner', type);
      setLegalContent(res?.page || null);
    } catch (e) {
      setLegalContent(null);
    } finally {
      setLegalLoading(false);
    }
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
          I agree to the <button type="button" onClick={() => openLegalModal('terms')} className="text-[#0F172A] font-bold hover:underline">Terms & Conditions</button> and <button type="button" onClick={() => openLegalModal('privacy')} className="text-[#0F172A] font-bold hover:underline">Privacy Policy</button> of NowStay Partner.
        </label>
      </div>

      {/* Legal Content Bottom Sheet Modal */}
      <AnimatePresence>
        {legalModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col justify-end"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setLegalModal(null)}
            />
            {/* Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-[2.5rem] max-h-[85vh] flex flex-col shadow-2xl border-t border-white/50"
            >
              {/* Drag Indicator */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between px-8 py-4 border-b border-gray-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0F172A] flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <h2 className="font-black text-gray-900 text-lg tracking-tight">
                    {legalModal === 'terms' ? 'Partner Terms' : 'Partner Privacy'}
                  </h2>
                </div>
                <button
                  onClick={() => setLegalModal(null)}
                  className="p-2.5 rounded-full hover:bg-gray-100 transition-colors active:scale-90"
                >
                  <X size={22} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 px-8 py-6 text-sm text-gray-600 leading-relaxed custom-scrollbar">
                {legalLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-3 border-[#0F172A] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Loading Content...</p>
                  </div>
                ) : legalContent ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(legalContent.content || legalContent.body || String(legalContent)) }}
                  />
                ) : (
                  <div className="text-center py-20">
                    <p className="text-gray-400 font-bold">Content not available.</p>
                    <button onClick={() => setLegalModal(null)} className="mt-4 text-[#0F172A] font-black underline">Close</button>
                  </div>
                )}
              </div>

              {/* Bottom Action */}
              <div className="px-8 py-6 border-t border-gray-50 shrink-0">
                <button
                  onClick={() => { handleChange('termsAccepted', true); setLegalModal(null); }}
                  className="w-full bg-[#0F172A] text-white font-black py-4.5 rounded-[1.5rem] shadow-xl shadow-[#0F172A]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wide"
                >
                  <CheckCircle size={20} />
                  I Agree & Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepUserRegistration;
