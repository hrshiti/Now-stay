import React, { useEffect, useRef, useState } from 'react';
import { Shield, FileText } from 'lucide-react';
import gsap from 'gsap';
import PartnerHeader from '../components/PartnerHeader';
import { legalService } from '../../../services/apiService';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h4 className="font-bold text-[#003836] mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]"></span>
            {title}
        </h4>
        <div className="text-xs text-gray-500 leading-relaxed pl-3.5 border-l border-gray-100">
            {children}
        </div>
    </div>
);

const PartnerTerms = () => {
    const contentRef = useRef(null);
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        gsap.fromTo(contentRef.current,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
        );
    }, []);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                setLoading(true);
                const res = await legalService.getPage('partner', 'terms');
                if (!isMounted) return;
                setPage(res.page);
            } catch (e) {
                if (!isMounted) return;
                setError('Using default partner agreement until admin configures legal copy.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <PartnerHeader title="Terms & Conditions" subtitle="Legal Agreement" />

            <main ref={contentRef} className="max-w-3xl mx-auto px-4 pt-6">

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#003836]">
                                {page?.title || 'Partner Agreement'}
                            </h2>
                            <p className="text-xs text-gray-400">Last updated: August 15, 2024</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-2">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                             <div className="w-10 h-10 border-4 border-surface border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-xs text-gray-400 font-medium">Loading agreement details...</p>
                        </div>
                    ) : page?.content ? (
                        <div className="space-y-6">
                            <Section title="Terms & Conditions">
                                <p className="whitespace-pre-line text-sm text-gray-600 leading-relaxed font-medium">
                                    {page.content}
                                </p>
                            </Section>
                        </div>
                    ) : (
                        <div className="py-20 text-center flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-100 rounded-3xl">
                            <FileText className="w-12 h-12 text-gray-200" />
                            <p className="text-gray-400 text-sm font-medium">Legal agreement content is not available yet.</p>
                        </div>
                    )}

                    </div>

            </main>
        </div>
    );
};

export default PartnerTerms;
