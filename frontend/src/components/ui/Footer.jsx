import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#0f1422] text-white pt-12 pb-24 md:pb-12 px-6 md:px-12 lg:px-20 border-t border-gray-800">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Top Section: 4 Equal Grid Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 items-start">
                    
                    {/* Column 1: Brand Info */}
                    <div className="space-y-3">
                        <div>
                            <span className="text-2xl font-black tracking-tight text-white block">
                                NOW<span className="text-[#00d2ad]">STAY</span>
                            </span>
                            <div className="w-8 h-[3px] bg-[#00d2ad] mt-1.5 mb-3" />
                            <p className="text-[#94a3b8] text-xs md:text-sm leading-relaxed font-medium">
                                Discover and book the best stays. From cozy homestays to luxury villas, we have it all.
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Company */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Company</h3>
                        <ul className="flex flex-col gap-2.5 text-xs md:text-sm font-medium text-[#cbd5e1]">
                            <li><Link to="/about" className="hover:text-[#00d2ad] transition-colors">About Us</Link></li>
                            <li><Link to="/search" className="hover:text-[#00d2ad] transition-colors">Browse Stays</Link></li>
                            <li><Link to="/hotel/register" className="hover:text-[#00d2ad] transition-colors">Become a Partner</Link></li>
                            <li><Link to="/contact" className="hover:text-[#00d2ad] transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Legal */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Legal</h3>
                        <ul className="flex flex-col gap-2.5 text-xs md:text-sm font-medium text-[#cbd5e1]">
                            <li><Link to="/terms" className="hover:text-[#00d2ad] transition-colors">Terms & Conditions</Link></li>
                            <li><Link to="/privacy" className="hover:text-[#00d2ad] transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/cancellation" className="hover:text-[#00d2ad] transition-colors">Cancellation & Refund</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Get In Touch */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Get In Touch</h3>
                        <div className="flex flex-col gap-2.5 text-xs md:text-sm text-[#cbd5e1]">
                            <div className="flex items-center gap-2">
                                <span className="text-[#00d2ad] font-bold">Email:</span>
                                <a href="mailto:Nowstayindia@gmail.com" className="hover:text-[#00d2ad] transition-colors truncate">
                                    Nowstayindia@gmail.com
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[#00d2ad] font-bold">Phone:</span>
                                <a href="tel:9970907005" className="hover:text-[#00d2ad] transition-colors">
                                    9970907005
                                </a>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Middle Section: Download Our Apps Bar */}
                <div className="pt-6 border-t border-[#1e293b] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#00d2ad]">Download Our Apps</h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-8">
                        {/* User App */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] text-[#00d2ad] font-extrabold uppercase tracking-wider">User App</span>
                            <div className="flex items-center gap-2.5">
                                <a href="https://play.google.com/store/apps/details?id=com.nowstay.userapp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b] border border-gray-700/60 hover:border-[#00d2ad] transition-all group">
                                    <img src="/WhatsApp_Image_2026-05-09_at_1.50.21_PM-removebg-preview.png" alt="Google Play" className="w-4 h-4 object-contain transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">Google Play</span>
                                </a>
                                <a href="https://apps.apple.com/in/app/nowstay/id6761835038" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b] border border-gray-700/60 hover:border-[#00d2ad] transition-all group">
                                    <img src="/WhatsApp_Image_2026-05-11_at_12.14.22_PM-removebg-preview.png" alt="App Store" className="w-4 h-4 object-contain transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">App Store</span>
                                </a>
                            </div>
                        </div>

                        {/* Partner App */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] text-[#00d2ad] font-extrabold uppercase tracking-wider">Partner App</span>
                            <div className="flex items-center gap-2.5">
                                <a href="https://play.google.com/store/apps/details?id=com.nowstay.partnerapp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b] border border-gray-700/60 hover:border-[#00d2ad] transition-all group">
                                    <img src="/WhatsApp_Image_2026-05-09_at_1.50.21_PM-removebg-preview.png" alt="Google Play" className="w-4 h-4 object-contain transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">Google Play</span>
                                </a>
                                <a href="https://apps.apple.com/in/app/nowstay-partner/id6761837073" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1e293b] border border-gray-700/60 hover:border-[#00d2ad] transition-all group">
                                    <img src="/WhatsApp_Image_2026-05-11_at_12.14.22_PM-removebg-preview.png" alt="App Store" className="w-4 h-4 object-contain transition-transform group-hover:scale-110" />
                                    <span className="text-xs font-bold text-white group-hover:text-[#00d2ad] whitespace-nowrap">App Store</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-[#1e293b] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                    <p className="text-xs text-[#64748b] font-medium">
                        &copy; {new Date().getFullYear()} NowStay. All rights reserved.
                    </p>
                    <p className="text-xs text-[#64748b] font-medium tracking-wide">
                        Powered by <span className="text-[#e2e8f0] font-semibold">Vrushahi Holiday Inn</span>
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
