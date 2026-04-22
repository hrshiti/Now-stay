import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, PhoneCall } from 'lucide-react';
import { legalService } from '../../services/apiService';

const ContactPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await legalService.getPage('user', 'contact');
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

    return () => {
      isMounted = false;
    };
  }, []);

  const content = page?.content || '';
  const paragraphs = typeof content === 'string' ? content.split('\n').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-surface text-white p-6 pb-12 rounded-b-[30px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">{page?.title || 'Contact Us'}</h1>
        </div>
        <p className="text-sm text-white/80 max-w-xs">
          We're here to help you. Reach out to us for any queries or support.
        </p>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-4 pb-24">
        {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-surface border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-medium">Loading contact details...</p>
            </div>
        ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6 min-h-[200px]">
                <div className="flex items-center gap-3 mb-6 text-surface border-b border-gray-100 pb-3">
                    <div className="w-10 h-10 rounded-full bg-surface/5 flex items-center justify-center text-surface">
                        <PhoneCall size={22} />
                    </div>
                    <h2 className="font-bold text-lg">
                    Get in touch with us
                    </h2>
                </div>

                {error ? (
                    <div className="text-center py-10">
                        <p className="text-gray-400 text-sm">{error}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Please check back later or use the help center.</p>
                    </div>
                ) : (
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        {paragraphs.length > 0
                        ? paragraphs.map((p, idx) => {
                            const isEmail = p.includes('@') && !p.includes(' ');
                            const isPhone = /^\+?[0-9\s-]{10,}$/.test(p.trim());
                            
                            return (
                                <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center justify-between group">
                                    <div className="flex-1">
                                        {isEmail ? (
                                            <a href={`mailto:${p.trim()}`} className="text-surface font-bold hover:underline flex items-center gap-2">
                                                <Mail size={14} />
                                                {p.trim()}
                                            </a>
                                        ) : isPhone ? (
                                            <a href={`tel:${p.replace(/[\s-]/g, '')}`} className="text-surface font-bold hover:underline flex items-center gap-2">
                                                <Phone size={14} />
                                                {p.trim()}
                                            </a>
                                        ) : (
                                            <p className="font-medium">{p}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                        : <p className="bg-gray-50/50 p-3 rounded-xl border border-gray-50">{content || 'No contact information available at the moment.'}</p>}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ContactPage;


