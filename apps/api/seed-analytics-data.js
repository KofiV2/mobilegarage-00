/**
 * Seed Analytics Data Script
 * Creates bookings across different time periods for testing analytics filters
 *
 * Usage: node apps/api/seed-analytics-data.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate booking number
function generateBookingNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BK${timestamp}${random}`;
}

async function seedAnalyticsData() {
  console.log('🌱 Seeding Analytics Data...\n');

  try {
    // Step 1: Get users
    console.log('1️⃣  Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(10);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found. Please create users first.');
      process.exit(1);
    }
    console.log(`✅ Found ${users.length} users\n`);

    // Step 2: Get services
    console.log('2️⃣  Fetching services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, base_price');

    if (servicesError || !services || services.length === 0) {
      console.error('❌ No services found. Please create services first.');
      process.exit(1);
    }
    console.log(`✅ Found ${services.length} services\n`);

    // Step 3: Get vehicles (or we'll create bookings without vehicles)
    console.log('3️⃣  Fetching vehicles...');
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, user_id')
      .limit(10);

    const vehiclesCount = vehicles ? vehicles.length : 0;
    console.log(`✅ Found ${vehiclesCount} vehicles\n`);

    // Define date ranges for different periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateRanges = {
      today: {
        start: today,
        end: now,
        count: 5,
        label: 'Today'
      },
      thisWeek: {
        start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), // Last 7 days
        end: now,
        count: 15,
        label: 'This Week'
      },
      thisMonth: {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: now,
        count: 30,
        label: 'This Month'
      },
      lastMonth: {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
        count: 25,
        label: 'Last Month'
      },
      thisYear: {
        start: new Date(today.getFullYear(), 0, 1),
        end: now,
        count: 50,
        label: 'This Year'
      }
    };

    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const paymentStatuses = ['pending', 'paid', 'refunded'];
    const locationTypes = ['at_location', 'mobile'];

    let totalCreated = 0;

    // Step 4: Create bookings for each period
    console.log('4️⃣  Creating bookings across different time periods...\n');

    for (const [period, config] of Object.entries(dateRanges)) {
      console.log(`   📅 Creating ${config.count} bookings for ${config.label}...`);

      const bookingsToCreate = [];

      for (let i = 0; i < config.count; i++) {
        const user = randomItem(users);
        const service = randomItem(services);
        const scheduledDate = randomDate(config.start, config.end);
        const status = randomItem(statuses);
        const paymentStatus = randomItem(paymentStatuses);
        const locationType = randomItem(locationTypes);

        // Calculate prices
        const basePrice = service.base_price;
        const mobileFee = locationType === 'mobile' ? 50 : 0;
        const totalPrice = basePrice + mobileFee;
        const discountAmount = Math.random() > 0.7 ? Math.floor(totalPrice * 0.1) : 0; // 30% chance of discount
        const finalAmount = totalPrice - discountAmount;

        // Get vehicle for this user if available
        const userVehicles = vehicles ? vehicles.filter(v => v.user_id === user.id) : [];
        const vehicle = userVehicles.length > 0 ? randomItem(userVehicles) : null;

        const booking = {
          user_id: user.id,
          service_id: service.id,
          vehicle_id: vehicle?.id || null,
          booking_number: generateBookingNumber(),
          scheduled_date: scheduledDate.toISOString(),
          status: status,
          payment_status: paymentStatus,
          payment_method: paymentStatus === 'paid' ? randomItem(['cash', 'card', 'wallet']) : null,
          location: locationType === 'mobile' ? { type: 'mobile', address: '123 Test Street' } : { type: 'at_location' },
          total_price: totalPrice,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          notes: i % 3 === 0 ? 'Customer requested extra attention to interior' : null,
          created_at: scheduledDate.toISOString(),
          updated_at: scheduledDate.toISOString()
        };

        // Add completion timestamp for completed bookings
        if (status === 'completed') {
          const completedDate = new Date(scheduledDate.getTime() + 60 * 60 * 1000); // 1 hour later
          booking.completed_at = completedDate.toISOString();
        }

        // Add cancellation timestamp for cancelled bookings
        if (status === 'cancelled') {
          const cancelledDate = new Date(scheduledDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before
          booking.cancelled_at = cancelledDate.toISOString();
          booking.cancellation_reason = randomItem([
            'Customer requested cancellation',
            'Weather conditions',
            'Schedule conflict',
            'Service not available'
          ]);
        }

        bookingsToCreate.push(booking);
      }

      // Insert bookings in batches
      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingsToCreate)
        .select('id');

      if (error) {
        console.error(`   ❌ Error creating bookings for ${config.label}:`, error.message);
        continue;
      }

      console.log(`   ✅ Created ${data.length} bookings for ${config.label}`);
      totalCreated += data.length;
    }

    console.log('\n══════════════════════════════════════');
    console.log(`✨ Successfully created ${totalCreated} bookings!`);
    console.log('══════════════════════════════════════\n');

    // Step 5: Show summary statistics
    console.log('📊 Analytics Summary:\n');

    // Today
    const { count: todayCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    console.log(`   Today: ${todayCount} bookings`);

    // This Week
    const weekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const { count: weekCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());
    console.log(`   This Week: ${weekCount} bookings`);

    // This Month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: monthCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());
    console.log(`   This Month: ${monthCount} bookings`);

    // This Year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const { count: yearCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yearStart.toISOString());
    console.log(`   This Year: ${yearCount} bookings`);

    // Revenue by status
    console.log('\n💰 Revenue by Status:\n');
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('status, final_amount');

    if (revenueData) {
      const revenueByStatus = revenueData.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + (booking.final_amount || 0);
        return acc;
      }, {});

      Object.entries(revenueByStatus).forEach(([status, amount]) => {
        console.log(`   ${status}: AED ${amount.toFixed(2)}`);
      });
    }

    // Top services
    console.log('\n🏆 Top Services:\n');
    const { data: serviceStats } = await supabase
      .from('bookings')
      .select('service_id, services(name)');

    if (serviceStats) {
      const serviceCounts = serviceStats.reduce((acc, booking) => {
        const serviceName = booking.services?.name || 'Unknown';
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {});

      const sortedServices = Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      sortedServices.forEach(([name, count], index) => {
        console.log(`   ${index + 1}. ${name}: ${count} bookings`);
      });
    }

    console.log('\n══════════════════════════════════════');
    console.log('🎉 Analytics data seeding complete!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the web app: cd apps/web && npm run dev');
    console.log('   2. Login as admin');
    console.log('   3. Go to Analytics page');
    console.log('   4. Test the filters: Today, This Week, This Month, This Year');
    console.log('══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAnalyticsData();
