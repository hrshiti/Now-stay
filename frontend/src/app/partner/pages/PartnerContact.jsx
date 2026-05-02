import React, { useRef, useState, useEffect } from 'react';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { legalService } from '../../../services/apiService';

const PartnerContact = () => {
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await legalService.getPage('partner', 'contact');
        if (!isMounted) return;
        setPage(res.page);
      } catch (e) {
        if (!isMounted) return;
        setError('Contact details are not configured yet.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    gsap.fromTo(
      contentRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const content = page?.content || '';
  const paragraphs = typeof content === 'string' ? content.split('\n').map(p => p.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Branded Header */}
      <div className="bg-surface text-white p-6 pb-14 rounded-b-[30px] shadow-lg relative z-20">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{page?.title || 'Contact Us'}</h1>
        </div>
        <div className="space-y-1">
            <h2 className="text-2xl font-black leading-tight">We're here to help you.</h2>
            <p className="text-sm text-white/70 font-medium">Reach out to us for any queries or support.</p>
        </div>
      </div>

      <main ref={contentRef} className="px-5 -mt-8 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 border border-white min-h-[300px]">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-surface border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-medium">Loading contact details...</p>
            </div>
          ) : (
            <>
              {/* Section Title */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center text-surface">
                  <Phone size={24} />
                </div>
                <h3 className="text-xl font-black text-surface tracking-tight">Get in touch with us</h3>
              </div>

              <div className="h-px bg-gray-100 w-full mb-8" />

              {error ? (
                <div className="text-center py-10">
                    <p className="text-gray-400 text-sm">{error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paragraphs.length > 0 ? paragraphs.map((p, idx) => {
                    const isEmail = p.includes('@') && !p.includes(' ');
                    const isPhone = /^\+?[0-9\s-]{10,}$/.test(p.trim());
                    
                    const Wrapper = (isEmail || isPhone) ? 'a' : 'div';
                    const hrefProps = isEmail ? { href: `mailto:${p.trim()}` } : isPhone ? { href: `tel:${p.replace(/[\s-]/g, '')}` } : {};

                    return (
                      <Wrapper
                        key={idx}
                        {...hrefProps}
                        className={`bg-gray-50/80 border border-gray-100 p-5 rounded-2xl flex items-center gap-4 group transition-colors ${
                          (isEmail || isPhone) ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                      >
                        <div className="text-surface">
                          {isEmail ? <Mail size={20} /> : <Phone size={20} />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-bold text-surface ${(isEmail || isPhone) ? 'group-hover:underline decoration-2 underline-offset-4' : ''} ${isEmail ? 'break-all' : ''}`}>
                            {p.trim()}
                          </span>
                        </div>
                      </Wrapper>
                    );
                  }) : (
                    <p className="text-sm text-gray-600">{content || 'No contact information available at the moment.'}</p>
                  )}
                </div>
              )}

              <div className="mt-12 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em]">Support Available 24/7</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnerContact;

