import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Calendar, ChevronLeft, ArrowLeft, BarChart3,
    CheckCircle2, XCircle, AlertCircle, RefreshCw, Landmark,
    Percent, HelpCircle, FileSpreadsheet, Sparkles
} from 'lucide-react';
import { hotelService } from '../../../services/apiService';
import PartnerHeader from '../components/PartnerHeader';
import { toast } from 'react-hot-toast';

const PartnerReports = () => {
    const navigate = useNavigate();

    // Filters State
    const [properties, setProperties] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState('all');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // Start of current month
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        // End of current month
        const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        return endOfMonth.toISOString().split('T')[0];
    });

    // Data State
    const [stats, setStats] = useState(null);
    const [dailyReport, setDailyReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Initial load: Fetch properties
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const res = await hotelService.getMyHotels();
                setProperties(res.properties || []);
            } catch (err) {
                console.error('Failed to load partner properties:', err);
                toast.error('Could not load properties list');
            }
        };
        fetchProperties();
    }, []);

    // Main fetch reports function
    const fetchReports = async (showRefreshToast = false) => {
        if (showRefreshToast) setRefreshing(true);
        else setLoading(true);

        try {
            const params = {
                startDate,
                endDate
            };
            if (selectedProperty !== 'all') {
                params.propertyId = selectedProperty;
            }

            const res = await hotelService.getPartnerReports(params);
            if (res.success) {
                setStats(res.stats);
                setDailyReport(res.dailyReport || []);
                if (showRefreshToast) {
                    toast.success('Report updated successfully!');
                }
            } else {
                toast.error(res.message || 'Failed to fetch report');
            }
        } catch (err) {
            console.error('Error fetching reports:', err);
            toast.error(err.message || 'Server error loading reports');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Trigger fetch on filter changes
    useEffect(() => {
        fetchReports();
    }, [selectedProperty, startDate, endDate]);

    // Presets Handlers
    const applyPreset = (preset) => {
        const today = new Date();
        if (preset === 'this_month') {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        } else if (preset === 'last_month') {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        } else if (preset === 'last_30') {
            const start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    };

    // Currency Formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // CSV Export
    const handleExportCSV = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Date,Platform Nights (Rooms),Walk-in Nights (Rooms),External Nights (Rooms),Blocked Nights,Vacant Nights,Total Capacity,Status\n";

            dailyReport.forEach(day => {
                const status = day.isBlank ? "Blank" : "Occupied";
                csvContent += `${day.date},${day.platformUnits},${day.walkInUnits},${day.externalUnits},${day.manualBlockUnits},${day.vacantUnits},${day.totalCapacity},${status}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `Partner_Report_${startDate}_to_${endDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Report exported as CSV!');
        } catch (error) {
            console.error('CSV Export Error:', error);
            toast.error('Failed to export CSV');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
            <PartnerHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title and Top Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-[#003836] flex items-center gap-2">
                                <BarChart3 className="text-teal-600 animate-pulse" size={24} />
                                Reports & Analytics
                            </h1>
                            <p className="text-gray-500 text-xs font-semibold mt-0.5">
                                Track bookings, empty days, occupancy streak and earnings.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => fetchReports(true)}
                            disabled={refreshing || loading}
                            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-[#003836] hover:border-[#003836] transition-all shadow-sm active:scale-95"
                            title="Refresh Report"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={handleExportCSV}
                            disabled={dailyReport.length === 0}
                            className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#003836] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                        >
                            <FileSpreadsheet size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Filters Board */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Property Selector */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Select Property</label>
                            <select
                                value={selectedProperty}
                                onChange={(e) => setSelectedProperty(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#003836] focus:outline-none focus:border-teal-500"
                            >
                                <option value="all">All Properties ({properties.length})</option>
                                {properties.map(p => (
                                    <option key={p._id} value={p._id}>{p.propertyName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#003836] focus:outline-none focus:border-teal-500"
                            />
                        </div>

                        {/* End Date */}
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#003836] focus:outline-none focus:border-teal-500"
                            />
                        </div>

                        {/* Presets */}
                        <div className="flex flex-col justify-end">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 md:hidden">Presets</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => applyPreset('this_month')}
                                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-[#003836] rounded-xl border border-gray-200/50 transition-colors"
                                >
                                    This Month
                                </button>
                                <button
                                    onClick={() => applyPreset('last_month')}
                                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-[#003836] rounded-xl border border-gray-200/50 transition-colors"
                                >
                                    Last Month
                                </button>
                                <button
                                    onClick={() => applyPreset('last_30')}
                                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-[#003836] rounded-xl border border-gray-200/50 transition-colors"
                                >
                                    30 Days
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-[#0F172A] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* KPI Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            {/* Earning Card */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                                    <Landmark size={20} />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Net Payout</p>
                                <h3 className="text-xl sm:text-2xl font-black text-[#003836] mt-1">
                                    {formatCurrency(stats?.earnings)}
                                </h3>
                                <p className="text-[10px] text-emerald-600 font-bold mt-1">Your net earnings</p>
                            </div>

                            {/* Booked Days Card */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                                    <TrendingUp size={20} />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Platform Nights</p>
                                <h3 className="text-xl sm:text-2xl font-black text-[#003836] mt-1">
                                    {stats?.platformNights || 0} <span className="text-xs font-semibold text-gray-400">Rooms</span>
                                </h3>
                                <p className="text-[10px] text-teal-600 font-bold mt-1">Booked from our side</p>
                            </div>

                            {/* Blank Days Card */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center mb-4">
                                    <CheckCircle2 size={20} />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Blank Days</p>
                                <h3 className="text-xl sm:text-2xl font-black text-[#003836] mt-1">
                                    {stats?.blankDays || 0} <span className="text-xs font-semibold text-gray-400">Days</span>
                                </h3>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">100% vacant days</p>
                            </div>

                            {/* Streak Card */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                                    <Sparkles size={20} />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Continue Booking</p>
                                <h3 className="text-xl sm:text-2xl font-black text-[#003836] mt-1">
                                    {stats?.consecutiveStreak || 0} <span className="text-xs font-semibold text-gray-400">Days</span>
                                </h3>
                                <p className="text-[10px] text-amber-600 font-bold mt-1">Longest consecutive streak</p>
                            </div>
                        </div>

                        {/* Revenue Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <div className="lg:col-span-1 bg-[#0F172A] rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                                
                                <div>
                                    <h3 className="text-lg font-black text-teal-400 flex items-center gap-2 mb-6">
                                        Financial Summary
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                            <span className="text-white/60 font-semibold">Gross Revenue</span>
                                            <span className="font-bold">{formatCurrency(stats?.revenueBreakdown?.gross)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                            <span className="text-white/60 font-semibold">Platform Commission</span>
                                            <span className="font-bold text-red-400">-{formatCurrency(stats?.revenueBreakdown?.commission)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                            <span className="text-white/60 font-semibold">Taxes Collected</span>
                                            <span className="font-bold">-{formatCurrency(stats?.revenueBreakdown?.tax)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b border-white/5 pb-3">
                                            <span className="text-white/60 font-semibold">Platform Fees</span>
                                            <span className="font-bold text-red-400">-{formatCurrency(stats?.revenueBreakdown?.platformFee)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 border-t border-teal-500/20 pt-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-white/55 font-bold uppercase tracking-wider">Net Earnings</p>
                                            <h4 className="text-3xl font-black text-teal-400 mt-1">
                                                {formatCurrency(stats?.earnings)}
                                            </h4>
                                        </div>
                                        <div className="text-[10px] bg-teal-500/15 text-teal-400 font-bold px-3 py-1.5 rounded-full border border-teal-500/10 mb-1">
                                            Payout
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daily Breakdown and Source Occupancy */}
                            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-[#003836] mb-6 pl-1">
                                        Occupancy Breakdown (Room-Nights)
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        {/* Platform */}
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                                <span>Platform Bookings (Our Side)</span>
                                                <span className="text-teal-600">{stats?.platformNights || 0} / {stats?.totalCapacity || 0} ({stats?.totalCapacity ? Math.round((stats.platformNights / stats.totalCapacity) * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-teal-600 rounded-full transition-all duration-500" 
                                                    style={{ width: `${stats?.totalCapacity ? Math.min(100, (stats.platformNights / stats.totalCapacity) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Walk-in */}
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                                <span>Walk-in / Direct Bookings</span>
                                                <span className="text-blue-600">{stats?.walkInNights || 0} / {stats?.totalCapacity || 0} ({stats?.totalCapacity ? Math.round((stats.walkInNights / stats.totalCapacity) * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                                    style={{ width: `${stats?.totalCapacity ? Math.min(100, (stats.walkInNights / stats.totalCapacity) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* External OTAs */}
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                                <span>External Channels (OTAs)</span>
                                                <span className="text-indigo-600">{stats?.externalNights || 0} / {stats?.totalCapacity || 0} ({stats?.totalCapacity ? Math.round((stats.externalNights / stats.totalCapacity) * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                                    style={{ width: `${stats?.totalCapacity ? Math.min(100, (stats.externalNights / stats.totalCapacity) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Vacant Rooms */}
                                        <div>
                                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                                                <span>Unbooked / Vacant Capacity</span>
                                                <span className="text-emerald-500">{stats?.vacantNights || 0} / {stats?.totalCapacity || 0} ({stats?.totalCapacity ? Math.round((stats.vacantNights / stats.totalCapacity) * 100) : 0}%)</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                                                    style={{ width: `${stats?.totalCapacity ? Math.min(100, (stats.vacantNights / stats.totalCapacity) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                    <AlertCircle size={14} className="text-gray-300" />
                                    Total Capacity = (Total Rooms/Beds available on property * Number of days in selected period)
                                </div>
                            </div>
                        </div>

                        {/* Daily Details Table */}
                        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-base font-bold text-[#003836]">Daily Occupancy Calendar</h3>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                            <th className="py-4 px-6">Date</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-center">Platform Rooms</th>
                                            <th className="py-4 px-6 text-center">Walk-in Rooms</th>
                                            <th className="py-4 px-6 text-center">External Rooms</th>
                                            <th className="py-4 px-6 text-center">Blocked Rooms</th>
                                            <th className="py-4 px-6 text-center">Vacant Rooms</th>
                                            <th className="py-4 px-6 text-center">Total Capacity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm font-semibold text-gray-700">
                                        {dailyReport.length > 0 ? (
                                            dailyReport.map((day, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-mono text-xs">{day.date}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                                            day.isBlank 
                                                                ? 'bg-emerald-50 text-emerald-700' 
                                                                : 'bg-teal-50 text-teal-700'
                                                        }`}>
                                                            {day.isBlank ? 'Blank' : 'Occupied'}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">{day.platformUnits}</td>
                                                    <td className="py-4 px-6 text-center">{day.walkInUnits}</td>
                                                    <td className="py-4 px-6 text-center">{day.externalUnits}</td>
                                                    <td className="py-4 px-6 text-center">{day.manualBlockUnits}</td>
                                                    <td className="py-4 px-6 text-center text-emerald-600">{day.vacantUnits}</td>
                                                    <td className="py-4 px-6 text-center text-gray-400">{day.totalCapacity}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="py-12 text-center text-gray-400">
                                                    No details available for selected date range
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default PartnerReports;
