import Notification from '../models/Notification.js';
import Partner from '../models/Partner.js';
import Property from '../models/Property.js';
import AvailabilityLedger from '../models/AvailabilityLedger.js';
import Booking from '../models/Booking.js';
import RoomType from '../models/RoomType.js';

/**
 * @desc    Update FCM Token for Partner
 * @route   PUT /api/partners/fcm-token
 * @access  Private (Partners only — this endpoint is ONLY for the Partner model)
 *
 * The partner Flutter app wraps the partner web URL and sends the FCM token here.
 * We ONLY touch the Partner model. Users and Admins have their own separate endpoints
 * and their own models. Cross-model deduplication is incorrect because tokens are
 * generated per-app (user app vs partner app) and will never conflict.
 */
export const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: 'Please provide FCM token' });
    }

    const targetPlatform = platform === 'app' ? 'app' : 'web';
    const tokenField = `fcmTokens.${targetPlatform}`;

    // 1. DEDUPLICATION: Clear this token from any OTHER Partner document only.
    // We exclude the current partner's ID so we don't accidentally wipe the same doc we're about to write.
    await Partner.updateMany(
      { [tokenField]: fcmToken, _id: { $ne: req.user._id } },
      { $set: { [tokenField]: null } }
    );

    // 2. Update the token for the current partner
    const partner = await Partner.findById(req.user._id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    if (!partner.fcmTokens) partner.fcmTokens = { app: null, web: null };
    partner.fcmTokens[targetPlatform] = fcmToken;
    await partner.save();

    console.log(`[FCM] Partner ${partner._id} ${targetPlatform} token updated.`);

    res.json({
      success: true,
      message: `Partner FCM token updated successfully for ${targetPlatform} platform`,
      data: { platform: targetPlatform, tokenUpdated: true }
    });

  } catch (error) {
    console.error('Update Partner FCM Token Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get partner notifications
 * @route   GET /api/partners/notifications
 * @access  Private (Partner)
 */
export const getPartnerNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
      userType: 'partner'
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    res.status(200).json({
      success: true,
      notifications,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        unreadCount
      }
    });
  } catch (error) {
    console.error('Get Partner Notifications Error:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

/**
 * @desc    Mark partner notification as read
 * @route   PUT /api/partners/notifications/:id/read
 * @access  Private (Partner)
 */
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user._id, userType: 'partner' },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Mark all partner notifications as read
 * @route   PUT /api/partners/notifications/read-all
 * @access  Private (Partner)
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, userType: 'partner', isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All Notifications Read Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete partner notifications
 * @route   DELETE /api/partners/notifications
 * @access  Private (Partner)
 */
export const deleteNotifications = async (req, res) => {
  try {
    const { ids } = req.body;

    if (ids && Array.isArray(ids)) {
      await Notification.deleteMany({
        _id: { $in: ids },
        userId: req.user._id,
        userType: 'partner'
      });
    } else if (req.query.id) {
      await Notification.deleteOne({
        _id: req.query.id,
        userId: req.user._id,
        userType: 'partner'
      });
    } else {
      return res.status(400).json({ message: 'Notification ID(s) required' });
    }

    res.json({ success: true, message: 'Notifications deleted' });
  } catch (error) {
    console.error('Delete Notifications Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
/**
 * @desc    Delete partner account (Soft Delete)
 * @route   DELETE /api/partners/profile
 * @access  Private
 */
export const deletePartnerAccount = async (req, res) => {
  try {
    const partner = await Partner.findById(req.user._id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    partner.isDeleted = true;
    partner.fcmTokens = { app: null, web: null };
    await partner.save();

    // Deactivate all properties linked to this partner
    await Property.updateMany(
      { partnerId: req.user._id },
      { $set: { status: 'cancelled', isLive: false } }
    );

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete Partner Account Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update Notification Preference
 * @route   PUT /api/partners/notification-preference
 * @access  Private
 */
export const updateNotificationPreference = async (req, res) => {
  try {
    const { enabled } = req.body;
    const partner = await Partner.findById(req.user._id);
    if (!partner) return res.status(404).json({ message: 'Partner not found' });

    partner.pushNotificationsEnabled = enabled;
    await partner.save();

    res.json({ success: true, enabled: partner.pushNotificationsEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get Partner Reports & Analytics
 * @route   GET /api/partners/reports
 * @access  Private (Partner / Admin)
 */
export const getPartnerReports = async (req, res) => {
  try {
    const { propertyId, startDate, endDate } = req.query;

    // Parse Date Range (defaults to current month)
    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      start.setDate(1); // First day of current month
    }
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    if (!endDate) {
      // Last day of current month
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    }
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    // 1. Get properties
    let propertyQuery = { partnerId: req.user._id };
    if (propertyId) {
      propertyQuery._id = propertyId;
    }
    const properties = await Property.find(propertyQuery);
    if (!properties || properties.length === 0) {
      return res.json({
        success: true,
        stats: {
          platformNights: 0,
          walkInNights: 0,
          externalNights: 0,
          blockedNights: 0,
          vacantNights: 0,
          totalCapacity: 0,
          blankDays: 0,
          occupiedDays: 0,
          consecutiveStreak: 0,
          earnings: 0,
          revenueBreakdown: { gross: 0, payout: 0, commission: 0, tax: 0, platformFee: 0 }
        },
        dailyReport: []
      });
    }

    const propertyIds = properties.map(p => p._id);

    // 2. Fetch RoomTypes to compute total inventory per day
    const roomTypes = await RoomType.find({ propertyId: { $in: propertyIds }, isActive: true });

    // Calculate total inventory capacity per property
    const propertyInventoryMap = {};
    properties.forEach(p => {
      let totalInv = 0;
      roomTypes.forEach(rt => {
        if (String(rt.propertyId) === String(p._id)) {
          let count = Number(rt.totalInventory || 0);
          if (rt.inventoryType === 'bed') {
            count = count * Number(rt.bedsPerRoom || 1);
          }
          totalInv += count;
        }
      });
      propertyInventoryMap[String(p._id)] = totalInv;
    });

    const totalPartnerCapacityPerDay = Object.values(propertyInventoryMap).reduce((sum, cap) => sum + cap, 0);

    // 3. Fetch Ledger entries in the range
    const ledgerEntries = await AvailabilityLedger.find({
      propertyId: { $in: propertyIds },
      startDate: { $lt: end },
      endDate: { $gt: start }
    });

    // 4. Generate daily calendar and stats
    const dailyReport = [];
    const daysCount = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

    let totalPlatformNights = 0;
    let totalWalkInNights = 0;
    let totalExternalNights = 0;
    let totalBlockedNights = 0;
    let totalVacantNights = 0;
    let uniqueBlankDays = 0;
    let uniqueOccupiedDays = 0;

    // Day-by-day loop
    const occupancyStreakList = []; // Boolean array of whether a day was occupied

    for (let i = 0; i < daysCount; i++) {
      const currentDayStart = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      currentDayStart.setHours(0, 0, 0, 0);
      const currentDayEnd = new Date(currentDayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayStr = currentDayStart.toISOString().split('T')[0];

      let dayPlatformUnits = 0;
      let dayWalkInUnits = 0;
      let dayExternalUnits = 0;
      let dayManualBlockUnits = 0;

      // Find matching ledger entries for this day
      ledgerEntries.forEach(entry => {
        const entryStart = new Date(entry.startDate);
        const entryEnd = new Date(entry.endDate);

        if (entryStart < currentDayEnd && entryEnd > currentDayStart) {
          const units = entry.units || 0;
          if (entry.source === 'platform') {
            dayPlatformUnits += units;
          } else if (entry.source === 'walk_in') {
            dayWalkInUnits += units;
          } else if (entry.source === 'external') {
            dayExternalUnits += units;
          } else if (entry.source === 'manual_block') {
            dayManualBlockUnits += units;
          }
        }
      });

      const totalBlockedOnDay = dayPlatformUnits + dayWalkInUnits + dayExternalUnits + dayManualBlockUnits;
      const totalCapacityOnDay = totalPartnerCapacityPerDay;
      const vacantUnitsOnDay = Math.max(0, totalCapacityOnDay - totalBlockedOnDay);

      const isBlank = totalBlockedOnDay === 0;
      const isOccupied = totalBlockedOnDay > 0;

      if (isBlank) uniqueBlankDays++;
      if (isOccupied) uniqueOccupiedDays++;
      occupancyStreakList.push(isOccupied);

      totalPlatformNights += dayPlatformUnits;
      totalWalkInNights += dayWalkInUnits;
      totalExternalNights += dayExternalUnits;
      totalBlockedNights += dayManualBlockUnits;
      totalVacantNights += vacantUnitsOnDay;

      dailyReport.push({
        date: dayStr,
        platformUnits: dayPlatformUnits,
        walkInUnits: dayWalkInUnits,
        externalUnits: dayExternalUnits,
        manualBlockUnits: dayManualBlockUnits,
        vacantUnits: vacantUnitsOnDay,
        totalCapacity: totalCapacityOnDay,
        isBlank,
        isOccupied
      });
    }

    // Calculate maximum consecutive streak
    let maxStreak = 0;
    let currentStreak = 0;
    occupancyStreakList.forEach(occupied => {
      if (occupied) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    });

    // 5. Fetch Bookings and calculate earnings
    const bookings = await Booking.find({
      propertyId: { $in: propertyIds },
      bookingStatus: { $in: ['confirmed', 'checked_in', 'checked_out', 'completed'] },
      checkInDate: { $lt: end },
      checkOutDate: { $gt: start }
    });

    let totalRevenue = 0;
    let totalPayout = 0;
    let totalCommission = 0;
    let totalTax = 0;
    let totalPlatformFee = 0;

    bookings.forEach(b => {
      totalRevenue += b.totalAmount || 0;
      totalPayout += b.partnerPayout || 0;
      totalCommission += b.adminCommission || 0;
      totalTax += b.taxes || 0;
      totalPlatformFee += b.platformFee || 0;
    });

    res.json({
      success: true,
      stats: {
        platformNights: totalPlatformNights,
        walkInNights: totalWalkInNights,
        externalNights: totalExternalNights,
        blockedNights: totalBlockedNights,
        vacantNights: totalVacantNights,
        totalCapacity: totalPartnerCapacityPerDay * daysCount,
        blankDays: uniqueBlankDays,
        occupiedDays: uniqueOccupiedDays,
        consecutiveStreak: maxStreak,
        earnings: totalPayout,
        revenueBreakdown: {
          gross: totalRevenue,
          payout: totalPayout,
          commission: totalCommission,
          tax: totalTax,
          platformFee: totalPlatformFee
        }
      },
      dailyReport
    });

  } catch (error) {
    console.error('Get Partner Reports Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating reports' });
  }
};
