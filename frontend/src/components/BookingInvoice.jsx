import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { legalService } from '../services/apiService';

const BookingInvoice = ({ booking, property, room, user, taxRate: taxRateProp }) => {
    const [companyState, setCompanyState] = useState('maharashtra');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await legalService.getFinancialSettings();
                if (settings.companyState) {
                    setCompanyState(settings.companyState.toLowerCase().trim());
                }
            } catch (error) {
                console.error("Failed to fetch financial settings for invoice", error);
            }
        };
        fetchSettings();
    }, []);

    if (!booking || !property) return null;

    const invoiceDate = new Date().toLocaleDateString('en-US', { 
        day: 'numeric', month: 'long', year: 'numeric' 
    });
    
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('en-US', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });
    
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('en-US', { 
        day: 'numeric', month: 'short', year: 'numeric' 
    });

    // Dynamically compute tax rate from booking data
    // Priority: explicitly passed taxRateProp > derived from booking taxes/baseAmount > 0
    const computedTaxRate = (() => {
        if (taxRateProp !== undefined && taxRateProp !== null) return Number(taxRateProp);
        const taxes = booking.taxes || 0;
        const base = (booking.baseAmount || 0) + (booking.extraCharges || 0);
        if (taxes > 0 && base > 0) return parseFloat(((taxes / base) * 100).toFixed(3));
        return 0;
    })();

    // GST Bifurcation Logic (CGST/SGST vs IGST)
    // Assuming platform base state is fetched dynamically as per requirement. 
    // This aligns with backend PDF logic.
    const propState = (property.address?.state || '').toLowerCase().trim();
    const isInterState = propState && propState !== companyState;
    const halfTax = booking.taxes ? booking.taxes / 2 : 0;
    const halfRate = computedTaxRate > 0 ? (computedTaxRate / 2).toFixed(1) : 0;

    // Resolve signature URL - handles relative paths from local uploads and full CDN URLs
    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
    const signatureUrl = property.ownerSignature
        ? (property.ownerSignature.startsWith('http') 
            ? property.ownerSignature 
            : `${API_BASE}${property.ownerSignature}`)
        : null;


    return (
        <div
            className="bg-white p-4 sm:p-8 max-w-4xl mx-auto border shadow-lg print:shadow-none print:border-none font-sans text-gray-800"
            id="professional-invoice"
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', colorAdjust: 'exact' }}
        >
            {/* Force background colors in print */}
            <style>{`
                @media print {
                    #professional-invoice * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    .inv-header-bg {
                        background-color: #1e3a8a !important;
                        color: #ffffff !important;
                    }
                }
            `}</style>
            {/* Header / Letterhead */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-6 sm:gap-0">
                <div className="w-full sm:w-auto">
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-2">
                        {property.propertyName || property.name}
                    </h1>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                        <p>{property.address?.fullAddress || property.address}</p>
                        <p>Phone: {property.contactNumber || property.partnerId?.phone}</p>
                        <p>Email: {property.propertyEmail || property.partnerId?.email}</p>
                        {property.gstNumber && (
                            <p className="font-bold text-gray-900">GSTIN: {property.gstNumber}</p>
                        )}
                    </div>
                </div>
                <div className="w-full sm:text-right">

                    <table className="ml-auto border-collapse text-[10px] sm:text-xs">
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 px-3 py-1 bg-gray-100 font-bold text-left">DATE</td>
                                <td className="border border-gray-300 px-3 py-1 text-right">{invoiceDate}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-3 py-1 bg-gray-100 font-bold text-left">INVOICE #</td>
                                <td className="border border-gray-300 px-3 py-1 text-right">{booking.bookingId || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 px-3 py-1 bg-gray-100 font-bold text-left">STATUS</td>
                                <td className="border border-gray-300 px-3 py-1 text-right font-bold text-green-600 uppercase">{booking.paymentStatus}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer & Stay Details Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 mb-8 border border-blue-900">
                <div className="border-r border-blue-900">
                    <h3
                        className="inv-header-bg px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                    >CUSTOMER</h3>
                    <div className="p-3 space-y-1 text-xs min-h-[60px]">
                        <p className="font-bold text-gray-900 uppercase">
                            {user?.name || booking?.userId?.name || booking?.guestDetails?.name || 'Valued Guest'}
                        </p>
                        <p className="text-gray-500">
                            {user?.email || booking?.userId?.email || booking?.guestDetails?.email || 'N/A'}
                        </p>
                        <p className="text-gray-500">
                            +91 {user?.phone || user?.mobile || user?.phoneNumber || booking?.userId?.phone || booking?.userId?.mobile || booking?.guestDetails?.phone || 'N/A'}
                        </p>
                    </div>
                </div>
                <div>
                    <h3
                        className="inv-header-bg px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                    >STAY DETAILS</h3>
                    <div className="p-3 space-y-1 text-xs min-h-[60px]">
                        <p><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 tracking-tighter">Check-In:</span> {checkInDate}</p>
                        <p><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 tracking-tighter">Check-Out:</span> {checkOutDate}</p>
                        <p><span className="font-bold uppercase text-[9px] text-gray-400 mr-2 tracking-tighter">Duration:</span> {booking.totalNights} Night(s)</p>
                    </div>
                </div>
            </div>

            {/* Main Grid Table */}
            <div className="overflow-x-auto mb-0">
                <table className="w-full border-collapse border border-blue-900">
                    <thead>
                        <tr
                            className="inv-header-bg uppercase text-[9px] sm:text-[10px] tracking-widest"
                            style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                        >
                            <th className="border border-blue-900 px-4 py-2 text-left w-2/5">DESCRIPTION</th>
                            <th className="border border-blue-900 px-4 py-2 text-center">QTY</th>
                            <th className="border border-blue-900 px-4 py-2 text-right">UNIT PRICE</th>
                            <th className="border border-blue-900 px-4 py-2 text-right">TAX</th>
                            <th className="border border-blue-900 px-4 py-2 text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm">
                        <tr className="h-24 align-top">
                            <td className="border border-gray-300 px-4 py-3">
                                <p className="font-bold text-gray-900 uppercase">{room.name || 'Accommodation'}</p>
                                <p className="text-[10px] text-gray-400 mt-1">RESERVATION AT {property.propertyName?.toUpperCase()}</p>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center font-bold">{booking.totalNights}</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">₹{booking.baseAmount?.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">₹{booking.taxes?.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-black text-blue-900">₹{booking.totalAmount?.toLocaleString()}</td>
                        </tr>
                        {/* Fill empty rows to mimic Excel template */}
                        {[1, 2, 3].map((i) => (
                            <tr key={i} className="h-8">
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                                <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="text-[11px]">
                        <tr>
                            <td colSpan="3" rowSpan="5" className="border p-4 align-top" style={{ borderColor: '#1e3a8a' }}>
                                <h4
                                    className="px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest mb-3 inline-block"
                                    style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}
                                >TERMS & CONDITIONS</h4>
                                <p className="text-[10px] text-gray-500 italic whitespace-pre-wrap leading-relaxed">
                                    {property.invoiceTerms || "1. Present valid ID proof at check-in.\n2. Standard check-in/out times must be followed.\n3. Cancellation subject to property policy."}
                                </p>
                            </td>
                            <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>Subtotal</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-bold">₹{(booking.baseAmount + (booking.extraCharges || 0)).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>Discount</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-bold text-green-600">₹{booking.discount?.toLocaleString() || 0}</td>
                        </tr>
                        {isInterState ? (
                            <>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>Tax Rate (IGST)</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right">{computedTaxRate > 0 ? `${parseFloat(computedTaxRate.toFixed(3))}%` : '0%'}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>Tax Amount (IGST)</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">₹{booking.taxes?.toLocaleString()}</td>
                                </tr>
                            </>
                        ) : (
                            <>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>CGST ({halfRate}%)</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">₹{halfTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-bold uppercase text-[10px] text-gray-400" style={{ backgroundColor: '#f9fafb' }}>SGST ({halfRate}%)</td>
                                    <td className="border border-gray-300 px-4 py-2 text-right font-bold">₹{halfTax.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </>
                        )}
                        <tr style={{ backgroundColor: '#eff6ff' }}>
                            <td className="border px-4 py-3 font-black uppercase" style={{ borderColor: '#1e3a8a', color: '#1e3a8a' }}>TOTAL PAID</td>
                            <td className="border px-4 py-3 text-right font-black text-lg sm:text-xl font-mono tracking-tighter" style={{ borderColor: '#1e3a8a', color: '#1e3a8a' }}>₹{booking.totalAmount?.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Signature Section */}
            <div className="mt-8 flex justify-end">
                <div className="text-center w-56">
                    <div className="h-16 flex items-center justify-center mb-2">
                        {signatureUrl ? (
                            <img 
                                src={signatureUrl} 
                                alt="Authorized Signature" 
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => { e.target.style.display='none'; }}
                            />
                        ) : (
                            <div className="w-full border-b border-gray-400 self-end mb-4"></div>
                        )}
                    </div>
                    <p className="text-[10px] font-black text-gray-900 uppercase border-t border-gray-100 pt-1">Authorized Signatory</p>
                    <p className="text-[9px] text-gray-400 uppercase tracking-tighter">{property.propertyName}</p>
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="mt-6 text-center">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.4em]">THANK YOU FOR BOOKING VIA NOWSTAY.IN</p>
            </div>
        </div>
    );
};

export default BookingInvoice;
