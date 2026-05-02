import React, { useRef, useState, useEffect } from 'react';
import { CircleHelp, ChevronDown, Mail, Phone, MessageSquare, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { faqService } from '../../../services/apiService';

const FaqItem = ({ question, answer }) => {
    /* ... existing FaqItem code ... */
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef(null);

    const toggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            gsap.to(contentRef.current, { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' });
        } else {
            gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
        }
    };

    return (
        <div className="border border-gray-200 rounded-2xl mb-3 bg-white overflow-hidden transition-all hover:border-gray-300">
            <button
                onClick={toggle}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <span className="font-bold text-sm text-[#003836]">{question}</span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div ref={contentRef} className="h-0 opacity-0 overflow-hidden px-4">
                <p className="text-xs text-gray-500 leading-relaxed pb-4 pt-0">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const PartnerSupport = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const data = await faqService.getFaqs('partner');
                setFaqs(data);
            } catch (error) {
                console.error('Failed to fetch FAQs');
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="Support Center" subtitle="We are here to help" />

            <div className="max-w-3xl mx-auto px-4 pt-6">

                {/* Contact Options */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <button
                        onClick={() => window.open('https://wa.me/919970907005', '_blank')}
                        className="bg-[#0F172A] text-white p-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#25D366">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-sm font-bold">WhatsApp Chat</span>
                    </button>
                    <a
                        href="tel:9970907005"
                        className="bg-white border border-gray-200 text-[#003836] p-5 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" fill="#2563EB">
                            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                        </svg>
                        <span className="text-sm font-bold">Call Support</span>
                    </a>
                </div>

                <div className="flex items-center gap-2 mb-4">
                    <CircleHelp size={18} className="text-gray-400" />
                    <h3 className="font-black text-[#003836]">Frequently Asked Questions</h3>
                </div>

                <div>
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <Loader2 className="animate-spin text-[#0F172A]" />
                        </div>
                    ) : faqs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No FAQs available.</div>
                    ) : (
                        faqs.map((faq, i) => (
                            <FaqItem key={faq._id || i} question={faq.question} answer={faq.answer} />
                        ))
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 mb-2">Still have questions?</p>
                    <a href="mailto:partners@nowstay.in" className="inline-flex items-center gap-2 text-sm font-bold text-[#0F172A] border-b border-[#0F172A]/20 pb-0.5 hover:border-[#0F172A] transition-colors">
                        <Mail size={14} /> Email us at partners@nowstay.in
                    </a>
                </div>
            </div>
        </div>
    );
};

export default PartnerSupport;
