import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, MapPin, PhoneCall,
  Send, CheckCircle2, ChevronDown, User, MessageSquare,
  AlertCircle, Loader2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { legalService } from '../../services/apiService';

// ─── Query categories dropdown options ───────────────────────────────────────
const QUERY_TYPES = [
  { value: '', label: 'Select Query Type' },
  { value: 'Booking Issue', label: '🏨 Booking Issue' },
  { value: 'Refund Request', label: '💰 Refund Request' },
  { value: 'Payment Problem', label: '💳 Payment Problem' },
  { value: 'Property Complaint', label: '🏠 Property Complaint' },
  { value: 'Check-in / Check-out', label: '🔑 Check-in / Check-out' },
  { value: 'Account Issue', label: '👤 Account Issue' },
  { value: 'Cancellation Request', label: '❌ Cancellation Request' },
  { value: 'General Inquiry', label: '💬 General Inquiry' },
  { value: 'Other', label: '📋 Other' },
];

// ─── Get pre-filled user data from localStorage ──────────────────────────────
const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Component ───────────────────────────────────────────────────────────────
const ContactPage = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();

  // Contact info from CMS
  const [page, setPage] = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: storedUser?.name || '',
    email: storedUser?.email || '',
    phone: storedUser?.phone || '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Custom dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch CMS contact page info ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await legalService.getPage('user', 'contact');
        if (isMounted) setPage(res.page);
      } catch {
        if (isMounted) setPageError('Contact details are not configured yet.');
      } finally {
        if (isMounted) setLoadingPage(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const content = page?.content || '';
  const paragraphs =
    typeof content === 'string'
      ? content.split('\n').map((p) => p.trim()).filter(Boolean)
      : [];

  // ── Form handlers ────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (submitError) setSubmitError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.subject) newErrors.subject = 'Please select a query type';
    if (!form.message.trim()) newErrors.message = 'Message is required';
    if (form.message.trim().length < 10)
      newErrors.message = 'Message must be at least 10 characters';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
      newErrors.email = 'Enter a valid email address';
    if (form.phone && !/^\+?[0-9\s-]{10,}$/.test(form.phone.trim()))
      newErrors.phone = 'Enter a valid phone number';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await legalService.submitContact('user', {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        subject: form.subject,
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err?.message || 'Failed to send your message. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      name: storedUser?.name || '',
      email: storedUser?.email || '',
      phone: storedUser?.phone || '',
      subject: '',
      message: '',
    });
    setErrors({});
    setSubmitError('');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-surface text-white p-6 pb-14 rounded-b-[30px] shadow-lg relative z-20">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{page?.title || 'Contact Us'}</h1>
        </div>
        <p className="text-sm text-white/80 max-w-xs">
          We're here to help. Fill the form below and our team will get back to you.
        </p>
      </div>

      <div className="px-5 -mt-4 relative z-10 space-y-5 pb-36">

        {/* ── CMS Contact Info Card ── */}
        {loadingPage ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-3">
            <Loader2 size={18} className="animate-spin text-surface" />
            <p className="text-xs text-gray-400">Loading contact details...</p>
          </div>
        ) : !pageError && paragraphs.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4 text-surface border-b border-gray-100 pb-3">
              <div className="w-9 h-9 rounded-full bg-surface/10 flex items-center justify-center">
                <PhoneCall size={18} />
              </div>
              <h2 className="font-bold text-base">Get in touch with us</h2>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              {paragraphs.map((p, idx) => {
                const isEmail = p.includes('@') && !p.includes(' ');
                const isPhone = /^\+?[0-9\s-]{10,}$/.test(p.trim());
                const Wrapper = isEmail || isPhone ? 'a' : 'div';
                const hrefProps = isEmail
                  ? { href: `mailto:${p.trim()}` }
                  : isPhone
                  ? { href: `tel:${p.replace(/[\s-]/g, '')}` }
                  : {};
                return (
                  <Wrapper
                    key={idx}
                    {...hrefProps}
                    className={`bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center gap-3 ${
                      isEmail || isPhone ? 'cursor-pointer hover:bg-surface/5 transition' : ''
                    }`}
                  >
                    {isEmail && <Mail size={15} className="text-surface shrink-0" />}
                    {isPhone && <Phone size={15} className="text-surface shrink-0" />}
                    {!isEmail && !isPhone && <MapPin size={15} className="text-gray-400 shrink-0" />}
                    <span className={`text-sm ${isEmail || isPhone ? 'font-semibold text-surface' : 'text-gray-600'}`}>
                      {p.trim()}
                    </span>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* ── Success State ── */}
        {submitted ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">Message Sent!</h3>
              <p className="text-sm text-gray-500 mt-1">
                Thank you, <span className="font-semibold text-surface">{form.name}</span>!
                Our team will respond to your{' '}
                <span className="font-semibold">"{form.subject}"</span> query soon.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="mt-2 px-6 py-2.5 bg-surface text-white rounded-xl text-sm font-semibold hover:bg-surface/90 transition active:scale-95"
            >
              Send Another Message
            </button>
          </div>
        ) : (

          /* ── Contact Form Card ── */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            noValidate
          >
            {/* Card Header */}
            <div className="bg-gradient-to-r from-surface to-surface/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base">Send Us a Message</h2>
                  <p className="text-white/70 text-xs">We'll reply within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">

              {/* ── Name ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      errors.name
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-surface/20 focus:border-surface'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.name}
                  </p>
                )}
              </div>

              {/* ── Email ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      errors.email
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-surface/20 focus:border-surface'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.email}
                  </p>
                )}
              </div>

              {/* ── Phone ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXXXXXXX"
                    className={`w-full pl-9 pr-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      errors.phone
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-200 focus:ring-surface/20 focus:border-surface'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.phone}
                  </p>
                )}
              </div>

              {/* ── Query Type Dropdown ── */}
              <div ref={dropdownRef}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Query Type <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`w-full flex items-center justify-between pl-4 pr-4 py-3 rounded-xl border text-sm bg-gray-50 hover:bg-white focus:bg-white focus:outline-none transition cursor-pointer select-none ${
                      errors.subject
                        ? 'border-red-300 focus:ring-red-200 text-gray-800'
                        : 'border-gray-200 focus:ring-surface/20 focus:border-surface'
                    } ${!form.subject ? 'text-gray-400' : 'text-gray-800'}`}
                  >
                    <span>
                      {form.subject
                        ? QUERY_TYPES.find(q => q.value === form.subject)?.label
                        : 'Select Query Type'}
                    </span>
                    <motion.div
                      animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} className="text-gray-400 pointer-events-none" />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                      >
                        <div className="max-h-60 overflow-y-auto py-2 custom-scrollbar">
                          {QUERY_TYPES.filter(opt => opt.value !== '').map((opt) => (
                            <div
                              key={opt.value}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, subject: opt.value }));
                                if (errors.subject) setErrors((prev) => ({ ...prev, subject: '' }));
                                setIsDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition hover:bg-gray-50 ${
                                form.subject === opt.value ? 'bg-surface/5 text-surface font-semibold' : 'text-gray-700'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {form.subject === opt.value && <Check size={16} className="text-surface" />}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {errors.subject && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={11} /> {errors.subject}
                  </p>
                )}
              </div>

              {/* ── Message ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your query in detail..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition resize-none ${
                    errors.message
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-surface/20 focus:border-surface'
                  }`}
                />
                <div className="flex items-center justify-between mt-1">
                  {errors.message ? (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs ml-auto ${form.message.length > 500 ? 'text-red-400' : 'text-gray-400'}`}>
                    {form.message.length}/500
                  </span>
                </div>
              </div>

              {/* ── API Submit Error ── */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-600">{submitError}</p>
                </div>
              )}

              {/* ── Submit Button ── */}
              <button
                id="contact-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-surface text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface/90 transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Send Message
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-gray-400">
                By submitting, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy')}
                  className="underline text-surface"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ContactPage;
