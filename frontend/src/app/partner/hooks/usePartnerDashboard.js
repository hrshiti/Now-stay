
import { useState, useEffect } from 'react';
import { hotelService, bookingService, reviewService } from '../../../services/apiService';
import walletService from '../../../services/walletService';
import toast from 'react-hot-toast';

const usePartnerDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    walletBalance: 0,
    activeProperties: 0,
    pendingReviews: 0,
    bookingsThisWeek: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      // Get User Info
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);

      // Fetch Data in Parallel
      const [propertiesData, bookingsData, walletData, reviewStats] = await Promise.all([
        hotelService.getMyHotels(),
        bookingService.getPartnerBookings(),
        walletService.getWallet(),
        reviewService.getPartnerStats().catch(() => ({ pendingReviews: 0 })) // Handle error gracefully
      ]);

      // 1. Process Properties
      const properties = propertiesData.properties || [];
      // Fix: Backend uses 'status': 'approved' and 'isLive': true
      const activeProperties = properties.filter(p => p.status === 'approved' && p.isLive).length;

      // 2. Process Bookings
      // API returns an array directly for bookings
      const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData.bookings || []);

      // Calculate bookings this week
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const bookingsThisWeek = bookings.filter(b => new Date(b.createdAt) > oneWeekAgo).length;

      // 3. Process Wallet
      // API returns nested wallet object: { wallet: { balance: ... } }
      const walletBalance = walletData.wallet?.balance || 0;

      // 4. Action Items logic
      const actions = [];

      // Check for (Today) - using checkInDate or checkIn
      const today = new Date().toISOString().split('T')[0];
      const pendingCheckIns = bookings.filter(b => {
        const checkIn = b.checkInDate || b.checkIn;
        return checkIn &&
          new Date(checkIn).toISOString().split('T')[0] === today &&
          b.bookingStatus === 'confirmed';
      });

      if (pendingCheckIns.length > 0) {
        actions.push({
          type: 'check-in',
          title: 'Pending Check-ins',
          count: pendingCheckIns.length,
          description: `${pendingCheckIns.length} guests arriving today.`,
          link: '/hotel/bookings'
        });
      }

      if (userData?.partnerApprovalStatus === 'rejected') {
        actions.push({
          type: 'alert',
          title: 'Document Rejected',
          description: 'Your KYC documents were rejected. Please support.',
          link: '/hotel/kyc',
          urgent: true
        });
      }

      setStats({
        totalBookings: bookings.length,
        walletBalance,
        activeProperties,
        pendingReviews: reviewStats?.pendingReviews || 0,
        bookingsThisWeek
      });

      // Slice latest 5 bookings
      setRecentBookings(bookings.slice(0, 5));
      setActionItems(actions);
      setError(null);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message || 'Failed to load dashboard data');
      if (isManualRefresh) {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-polling: Refetch every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Manual refresh function
  const refresh = async () => {
    await fetchDashboardData(true);
  };

  return { stats, recentBookings, actionItems, loading, error, user, isRefreshing, refresh };
};

export default usePartnerDashboard;
