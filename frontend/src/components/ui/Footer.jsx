import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();

    // Check if we are on a partner/hotel route
    const isPartnerRoute = location.pathname.startsWith('/hotel');

    return (
        <footer className="w-full bg-slate-900 border-t border-gray-800 text-slate-300 pt-6 md:pt-12 pb-24 md:pb-8 mt-auto">
            <div className="container mx-auto px-6">
                <div className="hidden md:grid md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex flex-col items-start leading-tight group">
                            <span className="text-2xl font-black tracking-tighter text-white">
                                NOW<span className="text-teal-400">STAY</span>
                            </span>
                            <div className="h-1 w-8 bg-teal-400 rounded-full"></div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Discover and book the best stays. From cozy homestays to luxury villas, we have it all.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Company</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/about" className="hover:text-teal-400 transition-colors">About Us</a></li>
                            <li><a href="/listings" className="hover:text-teal-400 transition-colors">Browse Stays</a></li>
                            <li><a href="/partner-landing" className="hover:text-teal-400 transition-colors">Become a Partner</a></li>
                            <li><a href="/contact" className="hover:text-teal-400 transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/terms" className="hover:text-teal-400 transition-colors">Terms & Conditions</a></li>
                            <li><a href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="/legal?tab=cancellation" className="hover:text-teal-400 transition-colors">Cancellation & Refund</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-wider">Get in Touch</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold">Email:</span>
                                <a href="mailto:Nowstayindia@gmail.com" className="hover:text-white transition-colors">Nowstayindia@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-teal-400 font-bold">Phone:</span>
                                <a href="tel:9970907005" className="hover:text-white transition-colors">9970907005</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
                    <p>&copy; {new Date().getFullYear()} NowStay. All rights reserved.</p>
                    <p className="mt-2 md:mt-0">
                        Powered by <span className="text-slate-400 font-semibold">Vrushahi Holiday Inn</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
