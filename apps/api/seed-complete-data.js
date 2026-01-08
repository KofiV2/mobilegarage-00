/**
 * Complete Data Seeding Script
 * Creates users, vehicles, services, and bookings for testing
 *
 * Usage: node apps/api/seed-complete-data.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateBookingNumber() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BK${timestamp}${random}`;
}

async function seedCompleteData() {
  console.log('🌱 Complete Data Seeding Started...\n');
  console.log('══════════════════════════════════════\n');

  try {
    // Step 1: Create test users
    console.log('1️⃣  Creating test users...');

    const testUsers = [
      { email: 'customer1@test.com', role: 'customer', first_name: 'Ahmed', last_name: 'Hassan' },
      { email: 'customer2@test.com', role: 'customer', first_name: 'Fatima', last_name: 'Ali' },
      { email: 'customer3@test.com', role: 'customer', first_name: 'Mohammed', last_name: 'Salem' },
      { email: 'customer4@test.com', role: 'customer', first_name: 'Sara', last_name: 'Ahmed' },
      { email: 'customer5@test.com', role: 'customer', first_name: 'Omar', last_name: 'Khalid' },
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);
    const usersToCreate = testUsers.map(user => ({
      ...user,
      password_hash: hashedPassword,
      phone: `+971${50000000 + Math.floor(Math.random() * 10000000)}`,
      is_verified: true,
      is_active: true,
      created_at: new Date().toISOString()
    }));

    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .upsert(usersToCreate, { onConflict: 'email' })
      .select();

    if (usersError) {
      console.log(`   ⚠️  Users might already exist: ${usersError.message}`);
      // Try to fetch existing users
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .in('email', testUsers.map(u => u.email));

      if (existingUsers && existingUsers.length > 0) {
        console.log(`   ✅ Using ${existingUsers.length} existing users\n`);
        var users = existingUsers;
      } else {
        console.error('   ❌ Could not create or find users');
        process.exit(1);
      }
    } else {
      console.log(`   ✅ Created ${createdUsers.length} users\n`);
      var users = createdUsers;
    }

    // Step 2: Create vehicles
    console.log('2️⃣  Creating vehicles...');

    const vehicleMakes = ['Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes', 'Lexus', 'Audi'];
    const models = {
      'Toyota': ['Camry', 'Corolla', 'Land Cruiser', 'RAV4'],
      'Honda': ['Civic', 'Accord', 'CR-V'],
      'Nissan': ['Altima', 'Maxima', 'Patrol'],
      'BMW': ['3 Series', '5 Series', 'X5'],
      'Mercedes': ['C-Class', 'E-Class', 'GLC'],
      'Lexus': ['ES', 'RX', 'LX'],
      'Audi': ['A4', 'A6', 'Q7']
    };

    const vehiclesToCreate = [];
    users.forEach(user => {
      // Create 1-2 vehicles per user
      const numVehicles = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numVehicles; i++) {
        const make = randomItem(vehicleMakes);
        const model = randomItem(models[make]);
        vehiclesToCreate.push({
          user_id: user.id,
          make,
          model,
          year: 2018 + Math.floor(Math.random() * 6),
          color: randomItem(['White', 'Black', 'Silver', 'Blue', 'Red']),
          license_plate: `DXB${Math.floor(Math.random() * 90000) + 10000}`,
          vehicle_type: randomItem(['sedan', 'suv', 'truck']),
          is_primary: i === 0,
          created_at: new Date().toISOString()
        });
      }
    });

    const { data: createdVehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .insert(vehiclesToCreate)
      .select();

    if (vehiclesError) {
      console.log(`   ⚠️  Error creating vehicles: ${vehiclesError.message}`);
    } else {
      console.log(`   ✅ Created ${createdVehicles.length} vehicles\n`);
    }

    // Step 3: Get services (should already exist)
    console.log('3️⃣  Fetching services...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, base_price')
      .eq('is_active', true);

    if (servicesError || !services || services.length === 0) {
      console.error('   ❌ No services found. Please create services first.');
      process.exit(1);
    }
    console.log(`   ✅ Found ${services.length} services\n`);

    // Step 4: Create bookings with date distribution
    console.log('4️⃣  Creating bookings across time periods...\n');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const dateRanges = {
      today: { start: today, end: now, count: 8 },
      thisWeek: { start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), end: now, count: 20 },
      thisMonth: { start: new Date(today.getFullYear(), today.getMonth(), 1), end: now, count: 40 },
      lastMonth: {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
        count: 35
      },
      thisYear: { start: new Date(today.getFullYear(), 0, 1), end: now, count: 60 }
    };

    const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const statusWeights = [0.15, 0.25, 0.10, 0.40, 0.10]; // Probabilities
    const paymentStatuses = ['pending', 'paid', 'refunded'];

    let totalCreated = 0;

    for (const [period, config] of Object.entries(dateRanges)) {
      console.log(`   📅 ${period.charAt(0).toUpperCase() + period.slice(1)}: Creating ${config.count} bookings...`);

      const bookingsToCreate = [];

      for (let i = 0; i < config.count; i++) {
        const user = randomItem(users);
        const service = randomItem(services);
        const scheduledDate = randomDate(config.start, config.end);

        // Weighted random status
        const rand = Math.random();
        let cumulativeWeight = 0;
        let status = statuses[0];
        for (let j = 0; j < statuses.length; j++) {
          cumulativeWeight += statusWeights[j];
          if (rand <= cumulativeWeight) {
            status = statuses[j];
            break;
          }
        }

        const paymentStatus = status === 'completed' ? 'paid' : (status === 'cancelled' ? randomItem(['pending', 'refunded']) : 'pending');
        const locationType = randomItem(['at_location', 'mobile']);

        const basePrice = service.base_price;
        const mobileFee = locationType === 'mobile' ? 50 : 0;
        const totalPrice = basePrice + mobileFee;
        const discountAmount = Math.random() > 0.75 ? Math.floor(totalPrice * 0.15) : 0;
        const finalAmount = totalPrice - discountAmount;

        // Find vehicle for this user
        const userVehicle = createdVehicles?.find(v => v.user_id === user.id);

        const booking = {
          user_id: user.id,
          service_id: service.id,
          vehicle_id: userVehicle?.id || null,
          booking_number: generateBookingNumber(),
          scheduled_date: scheduledDate.toISOString(),
          status,
          payment_status: paymentStatus,
          payment_method: paymentStatus === 'paid' ? randomItem(['cash', 'card', 'wallet']) : null,
          location: locationType === 'mobile' ? { type: 'mobile', address: `Building ${Math.floor(Math.random() * 100)}, Dubai` } : { type: 'at_location' },
          total_price: totalPrice,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          notes: Math.random() > 0.7 ? 'Please call before arriving' : null,
          created_at: scheduledDate.toISOString(),
          updated_at: scheduledDate.toISOString()
        };

        if (status === 'completed') {
          booking.completed_at = new Date(scheduledDate.getTime() + 60 * 60 * 1000).toISOString();
        }

        if (status === 'cancelled') {
          booking.cancelled_at = new Date(scheduledDate.getTime() - 12 * 60 * 60 * 1000).toISOString();
          booking.cancellation_reason = randomItem(['Customer cancelled', 'Weather', 'Reschedule requested']);
        }

        bookingsToCreate.push(booking);
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingsToCreate)
        .select('id');

      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created ${data.length} bookings`);
        totalCreated += data.length;
      }
    }

    console.log('\n══════════════════════════════════════');
    console.log(`✨ Successfully seeded ${totalCreated} bookings!`);
    console.log('══════════════════════════════════════\n');

    // Show analytics summary
    console.log('📊 Data Summary:\n');

    const { count: todayCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    const weekStart = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    const { count: weekCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString());

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const { count: monthCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString());

    const yearStart = new Date(today.getFullYear(), 0, 1);
    const { count: yearCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yearStart.toISOString());

    console.log(`   Today: ${todayCount} bookings`);
    console.log(`   This Week: ${weekCount} bookings`);
    console.log(`   This Month: ${monthCount} bookings`);
    console.log(`   This Year: ${yearCount} bookings\n`);

    // Revenue summary
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('final_amount')
      .eq('status', 'completed');

    if (completedBookings) {
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.final_amount || 0), 0);
      console.log(`💰 Total Revenue (Completed): AED ${totalRevenue.toFixed(2)}\n`);
    }

    console.log('══════════════════════════════════════');
    console.log('🎉 Data seeding complete!');
    console.log('\n📋 Test Credentials:');
    console.log('   Email: customer1@test.com');
    console.log('   Password: password123\n');
    console.log('📋 Next steps:');
    console.log('   1. Start backend: cd apps/api && npm start');
    console.log('   2. Start frontend: cd apps/web && npm run dev');
    console.log('   3. Login with credentials above');
    console.log('   4. Go to Admin → Analytics');
    console.log('   5. Test filters: Today, This Week, This Month, This Year');
    console.log('══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

seedCompleteData();
