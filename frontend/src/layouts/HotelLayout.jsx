import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLenis } from '../app/shared/hooks/useLenis';

const HotelLayout = () => {
    const location = useLocation();
    const isWizard = location.pathname.includes('/hotel/join');
    // Initialize global smooth scrolling, disable on wizard pages
    useLenis(isWizard);

    return (
        <div id="hotel-root" className="min-h-screen w-full bg-partner-bg text-partner-text-primary font-sans antialiased selection:bg-partner-btn selection:text-white">
            <main className="w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default HotelLayout;
