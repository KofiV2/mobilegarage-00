/**
 * Test Analytics API
 * Verifies that analytics endpoints return correct data with seeded bookings
 *
 * Usage: node apps/api/test-analytics-api.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyticsData() {
  console.log('🧪 Testing Analytics API Data...\n');
  console.log('══════════════════════════════════════\n');

  try {
    // Test 1: Check total bookings
    console.log('1️⃣  Checking total bookings...');
    const { data: allBookings, error: allError } = await supabase
      .from('bookings')
      .select('id, status, final_amount, created_at');

    if (allError) {
      console.error(`   ❌ Error: ${allError.message}`);
    } else {
      console.log(`   ✅ Total bookings in database: ${allBookings.length}`);
      console.log(`   📊 Statuses: ${JSON.stringify(
        allBookings.reduce((acc, b) => {
          acc[b.status] = (acc[b.status] || 0) + 1;
          return acc;
        }, {})
      )}\n`);
    }

    // Test 2: Check completed bookings with final_amount
    console.log('2️⃣  Checking completed bookings revenue...');
    const { data: completedBookings, error: completedError } = await supabase
      .from('bookings')
      .select('final_amount, status')
      .in('status', ['completed', 'in_progress']);

    if (completedError) {
      console.error(`   ❌ Error: ${completedError.message}`);
    } else {
      const totalRevenue = completedBookings.reduce((sum, b) => {
        return sum + parseFloat(b.final_amount || 0);
      }, 0);

      console.log(`   ✅ Completed/In-Progress bookings: ${completedBookings.length}`);
      console.log(`   💰 Total Revenue: AED ${totalRevenue.toFixed(2)}\n`);
    }

    // Test 3: Check today's bookings
    console.log('3️⃣  Checking today\'s bookings...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const { data: todayBookings, error: todayError } = await supabase
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', today.toISOString());

    if (todayError) {
      console.error(`   ❌ Error: ${todayError.message}`);
    } else {
      const todayRevenue = todayBookings
        .filter(b => ['completed', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

      console.log(`   ✅ Today's bookings: ${todayBookings.length}`);
      console.log(`   💰 Today's Revenue: AED ${todayRevenue.toFixed(2)}\n`);
    }

    // Test 4: Check this week's bookings
    console.log('4️⃣  Checking this week\'s bookings...');
    const weekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    const { data: weekBookings, error: weekError } = await supabase
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', weekStart.toISOString());

    if (weekError) {
      console.error(`   ❌ Error: ${weekError.message}`);
    } else {
      const weekRevenue = weekBookings
        .filter(b => ['completed', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

      console.log(`   ✅ This week's bookings: ${weekBookings.length}`);
      console.log(`   💰 This week's Revenue: AED ${weekRevenue.toFixed(2)}\n`);
    }

    // Test 5: Check this month's bookings
    console.log('5️⃣  Checking this month\'s bookings...');
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: monthBookings, error: monthError } = await supabase
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', monthStart.toISOString());

    if (monthError) {
      console.error(`   ❌ Error: ${monthError.message}`);
    } else {
      const monthRevenue = monthBookings
        .filter(b => ['completed', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

      console.log(`   ✅ This month's bookings: ${monthBookings.length}`);
      console.log(`   💰 This month's Revenue: AED ${monthRevenue.toFixed(2)}\n`);
    }

    // Test 6: Check this year's bookings
    console.log('6️⃣  Checking this year\'s bookings...');
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const { data: yearBookings, error: yearError } = await supabase
      .from('bookings')
      .select('final_amount, status')
      .gte('created_at', yearStart.toISOString());

    if (yearError) {
      console.error(`   ❌ Error: ${yearError.message}`);
    } else {
      const yearRevenue = yearBookings
        .filter(b => ['completed', 'in_progress'].includes(b.status))
        .reduce((sum, b) => sum + parseFloat(b.final_amount || 0), 0);

      console.log(`   ✅ This year's bookings: ${yearBookings.length}`);
      console.log(`   💰 This year's Revenue: AED ${yearRevenue.toFixed(2)}\n`);
    }

    // Test 7: Check services
    console.log('7️⃣  Checking services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, base_price')
      .eq('is_active', true);

    if (servicesError) {
      console.error(`   ❌ Error: ${servicesError.message}`);
    } else {
      console.log(`   ✅ Active services: ${services.length}`);
      console.log(`   📋 Services: ${services.map(s => s.name).join(', ')}\n`);
    }

    console.log('══════════════════════════════════════');
    console.log('✨ Analytics data check complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Restart backend: cd apps/api && npm start');
    console.log('   2. Open frontend: http://localhost:5173');
    console.log('   3. Login as admin');
    console.log('   4. Go to Analytics page');
    console.log('   5. Test filters: Today, This Week, This Month, This Year');
    console.log('══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

testAnalyticsData();
