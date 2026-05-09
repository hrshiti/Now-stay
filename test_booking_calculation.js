/**
 * Booking Calculation Test Script
 * This script verifies the 4-part distribution logic:
 * 1. Admin Commission
 * 2. Platform Fee
 * 3. GST (goes to partner)
 * 4. Property Base Price (goes to partner)
 */

function testBookingCalculation(baseAmount, gstRate, commissionRate, platformFeeRate) {
  console.log('==============================================');
  console.log(`TEST BOOKING CALCULATION (Base: ₹${baseAmount})`);
  console.log('==============================================');

  // --- Step 1: Calculate Components ---
  const discountAmount = 0;
  const taxableAmount = baseAmount - discountAmount; // The amount on which commission/tax is applied
  const taxes = Math.round((baseAmount * gstRate) / 100);
  const platformFee = platformFeeRate;

  // --- Step 2: User Total ---
  const totalAmount = taxableAmount + taxes + platformFee;
  
  // --- Step 3: Admin Cut ---
  const adminCommission = Math.round((taxableAmount * commissionRate) / 100);
  const totalAdminReceives = adminCommission + platformFee;

  // --- Step 4: Partner Cut ---
  // Partner Payout = Taxable Amount + GST - Admin Commission
  const partnerPayout = Math.floor(taxableAmount + taxes - adminCommission);

  // --- OUTPUT ---
  console.log('\n👤 1. WHAT THE USER PAYS (Checkout)');
  console.log(`- Base Price (Taxable): ₹${taxableAmount}`);
  console.log(`- Platform Fee:         ₹${platformFee}`);
  console.log(`- GST (${gstRate}%):           ₹${taxes}`);
  console.log(`-----------------------------------`);
  console.log(`  TOTAL PAID BY USER:   ₹${totalAmount}`);

  console.log('\n💼 2. ADMIN WALLET (Platform Cut)');
  console.log(`- Commission (${commissionRate}%):     ₹${adminCommission}`);
  console.log(`- Platform Fee:         ₹${platformFee}`);
  console.log(`-----------------------------------`);
  console.log(`  TOTAL TO ADMIN:       ₹${totalAdminReceives}`);

  console.log('\n🏨 3. PARTNER WALLET (Hotel Cut)');
  console.log(`- Base Price Earned:    ₹${taxableAmount - adminCommission} (₹${taxableAmount} - ₹${adminCommission} Commission)`);
  console.log(`- GST Collected:        ₹${taxes}`);
  console.log(`-----------------------------------`);
  console.log(`  TOTAL TO PARTNER:     ₹${partnerPayout}`);

  console.log('\n⚖️ 4. VERIFICATION CHECK');
  const distributedTotal = totalAdminReceives + partnerPayout;
  console.log(`- Total Distributed:    ₹${distributedTotal} (Admin ₹${totalAdminReceives} + Partner ₹${partnerPayout})`);
  console.log(`- Total Collected:      ₹${totalAmount}`);
  
  if (distributedTotal === totalAmount) {
    console.log(`  STATUS:               ✅ PASSED (Match is perfect)`);
  } else {
    console.log(`  STATUS:               ❌ FAILED (Mismatch of ₹${Math.abs(distributedTotal - totalAmount)})`);
  }
  console.log('==============================================\n');
}

// Run Tests
testBookingCalculation(1000, 18, 10, 50); // ₹1000 Base, 18% GST, 10% Comm, ₹50 Fee
testBookingCalculation(2500, 12, 15, 100); // ₹2500 Base, 12% GST, 15% Comm, ₹100 Fee
testBookingCalculation(500, 0, 5, 20); // ₹500 Base, 0% GST, 5% Comm, ₹20 Fee
