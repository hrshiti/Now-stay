import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#0f1422] text-white pt-10 md:pt-12 pb-20 md:pb-8 px-8 md:px-16 lg:px-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                
                {/* Brand & Intro */}
                <div className="space-y-4 lg:pr-8">
                    <div>
                        <span className="text-[22px] md:text-[24px] font-black tracking-tight leading-none text-white block">
                            NOW<span className="text-[#00d2ad]">STAY</span>
                        </span>
                        <div className="w-8 h-[3px] bg-[#00d2ad] mt-1.5 mb-3" />
                    </div>
                    
                    <p className="text-[#94a3b8] text-[12px] md:text-[13px] leading-relaxed font-medium pr-4">
                        Discover and book the best stays. From cozy homestays to luxury villas, we have it all.
                    </p>
                </div>

                {/* Company Links */}
                <div className="space-y-4 lg:space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#f8fafc]">Company</h3>
                    <ul className="flex flex-col gap-3 text-[13px] font-medium text-[#cbd5e1]">
                        <li><Link to="/about" className="hover:text-[#00d2ad] transition-colors">About Us</Link></li>
                        <li><Link to="/search" className="hover:text-[#00d2ad] transition-colors">Browse Stays</Link></li>
                        <li><a href="https://play.google.com/store/apps/details?id=com.nowstay.partnerapp" className="hover:text-[#00d2ad] transition-colors">Become a Partner</a></li>
                        <li><Link to="/contact" className="hover:text-[#00d2ad] transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Legal Links */}
                <div className="space-y-4 lg:space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#f8fafc]">Legal</h3>
                    <ul className="flex flex-col gap-3 text-[13px] font-medium text-[#cbd5e1]">
                        <li><Link to="/terms" className="hover:text-[#00d2ad] transition-colors">Terms & Conditions</Link></li>
                        <li><Link to="/privacy" className="hover:text-[#00d2ad] transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/cancellation" className="hover:text-[#00d2ad] transition-colors">Cancellation & Refund</Link></li>
                    </ul>
                </div>

                {/* Get In Touch */}
                <div className="space-y-4 lg:space-y-5">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-[#f8fafc]">Get In Touch</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                            <span className="text-[#00d2ad] font-bold text-[13px]">Email:</span>
                            <a href="mailto:Nowstayindia@gmail.com" className="text-[13px] font-medium text-[#cbd5e1] hover:text-[#00d2ad] transition-colors break-all whitespace-nowrap">
                                Nowstayindia@gmail.com
                            </a>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-[#00d2ad] font-bold text-[13px]">Phone:</span>
                            <a href="tel:9970907005" className="text-[13px] font-medium text-[#cbd5e1] hover:text-[#00d2ad] transition-colors">
                                9970907005
                            </a>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto mt-10 md:mt-16 pt-5 border-t border-[#1e293b] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                <p className="text-[11px] md:text-[12px] text-[#64748b] font-medium">
                    &copy; {new Date().getFullYear()} NowStay. All rights reserved.
                </p>
                <p className="text-[11px] md:text-[12px] text-[#64748b] font-medium tracking-wide">
                    Powered by <span className="text-[#e2e8f0] font-semibold">Vrushahi Holiday Inn</span>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
