import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Phone, Mail, ChevronRight, CircleHelp, Loader2 } from 'lucide-react';
import { faqService, legalService } from '../../services/apiService';

const SupportPage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contactInfo, setContactInfo] = useState({
        email: 'support@nowstay.in',
        phone: '9970907005'
    });

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const data = await faqService.getFaqs('user');
                setFaqs(data);
            } catch (error) {
                console.error('Failed to fetch FAQs');
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    useEffect(() => {
        const fetchContactInfo = async () => {
            try {
                const res = await legalService.getPage('user', 'contact');
                const content = res?.page?.content || '';
                const paragraphs = typeof content === 'string' 
                    ? content.split('\n').map(p => p.trim()).filter(Boolean) 
                    : [];
                
                let foundEmail = '';
                let foundPhone = '';
                
                paragraphs.forEach(p => {
                    if (p.includes('@') && !p.includes(' ')) {
                        foundEmail = p;
                    } else if (/^\+?[0-9\s-]{10,}$/.test(p)) {
                        foundPhone = p;
                    }
                });
                
                setContactInfo({
                    email: foundEmail || 'support@nowstay.in',
                    phone: foundPhone || '9970907005'
                });
            } catch (error) {
                console.error('Failed to fetch contact details from admin:', error);
            }
        };
        fetchContactInfo();
    }, []);

    const cleanPhoneForWa = contactInfo.phone.replace(/\D/g, '');
    const cleanPhoneForTel = contactInfo.phone.replace(/[\s-]/g, '');

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-surface text-white p-6 pb-12 rounded-b-[30px] shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold">Help & Support</h1>
                </div>
                <h2 className="text-2xl font-black">How can we help you?</h2>
                <p className="text-sm text-white/70">Find answers or contact our support team.</p>
            </div>

            <div className="px-5 -mt-8 relative z-10 space-y-6 pb-20">

                {/* Contact Options */}
                <div className="bg-white rounded-2xl p-5 shadow-lg shadow-gray-200/50 border border-white">
                    <h3 className="font-bold text-surface text-sm mb-4">Contact Us</h3>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                         <a
                            href={cleanPhoneForWa ? `https://wa.me/91${cleanPhoneForWa}` : `https://wa.me/919970907005`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 border border-blue-100 group active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105">
                                <MessageSquare size={20} />
                            </div>
                            <span className="text-xs font-bold text-blue-700">Chat with Us</span>
                        </a>
                        <a
                            href={`tel:${cleanPhoneForTel}`}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-green-50 border border-green-100 group active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm transition-transform group-hover:scale-105">
                                <Phone size={20} />
                            </div>
                            <span className="text-xs font-bold text-green-700">Call Support</span>
                        </a>
                    </div>

                    {/* Direct Contact Details for iOS App Store submission compatibility */}
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Direct Support Info</p>
                        
                        <a 
                            href={`tel:${cleanPhoneForTel}`}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                        >
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                                <Phone size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone Number</span>
                                <span className="text-xs font-bold text-gray-800">{contactInfo.phone.startsWith('+91') || contactInfo.phone.length < 10 ? contactInfo.phone : `+91 ${contactInfo.phone}`}</span>
                            </div>
                        </a>

                        <a 
                            href={`mailto:${contactInfo.email}`}
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 active:scale-98 transition-all"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <Mail size={16} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Email Address</span>
                                <span className="text-xs font-bold text-gray-800 break-all">{contactInfo.email}</span>
                            </div>
                        </a>
                    </div>
                </div>

                {/* FAQs */}
                <div>
                    <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider mb-3 ml-1">Frequently Asked Questions</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="animate-spin text-gray-400" />
                            </div>
                        ) : faqs.length === 0 ? (
                            <div className="p-10 text-center space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">No FAQs found yet</p>
                                <p className="text-[10px] text-gray-300">We are currently updating our help section. Feel free to contact us directly!</p>
                            </div>
                        ) : (
                            faqs.map((faq, i) => (
                                <div key={faq._id || i} className="group">
                                    <button
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                        className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="text-sm font-bold text-surface pr-4">{faq.question}</span>
                                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-300 ${openFaq === i ? 'rotate-90' : ''}`} />
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <p className="text-xs text-gray-500 p-4 pt-0 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>



            </div>
        </div>
    );
};

export default SupportPage;
