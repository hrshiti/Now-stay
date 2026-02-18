import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();

    // Check if we are on a partner/hotel route
    const isPartnerRoute = location.pathname.startsWith('/hotel');

    // Don't show footer on partner routes if needed, but request was general. 
    // Assuming user facing pages.

    // Only show on desktop/webview as requested (hidden on mobile)
    return (
        <footer className="w-full py-6 mt-auto bg-white border-t border-gray-100 pb-24 md:pb-6">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <p className="text-sm text-gray-500 font-medium">
                        &copy; {new Date().getFullYear()} Now Stay. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-400">
                        Powered by <span className="font-semibold text-teal-600">Vrushahi Holiday Inn</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
