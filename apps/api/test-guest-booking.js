/**
 * Test script for guest booking functionality
 * Run this to verify the guest booking system works
 *
 * Usage: node apps/api/test-guest-booking.js
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

async function testGuestBookingTable() {
  console.log('🧪 Testing Guest Booking System...\n');

  // Test 1: Check if table exists
  console.log('1️⃣  Checking if guest_bookings table exists...');
  try {
    const { error } = await supabase
      .from('guest_bookings')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Table does not exist or cannot be accessed');
      console.error('   Error:', error.message);
      console.log('\n📋 Run the migration:');
      console.log('   apps/api/database/migrations/003_create_guest_bookings_table.sql');
      return false;
    }
    console.log('✅ guest_bookings table exists and is accessible\n');
  } catch (err) {
    console.error('❌ Error checking table:', err.message);
    return false;
  }

  // Test 2: Check if services table has data
  console.log('2️⃣  Checking for available services...');
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, base_price')
      .eq('is_active', true)
      .limit(5);

    if (error) {
      console.error('❌ Cannot fetch services');
      console.error('   Error:', error.message);
      return false;
    }

    if (!services || services.length === 0) {
      console.log('⚠️  No active services found');
      console.log('   You need to add services before testing guest bookings\n');
      return false;
    }

    console.log(`✅ Found ${services.length} active service(s):`);
    services.forEach(service => {
      console.log(`   - ${service.name}: AED ${service.base_price}`);
    });
    console.log('');
  } catch (err) {
    console.error('❌ Error checking services:', err.message);
    return false;
  }

  // Test 3: Create a test guest booking
  console.log('3️⃣  Creating test guest booking...');
  try {
    const { data: services } = await supabase
      .from('services')
      .select('id, name, base_price')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!services) {
      console.log('⚠️  Need at least one service to test');
      return false;
    }

    const testCode = `TEST${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const testBooking = {
      booking_number: `TEST${Date.now()}`,
      confirmation_code: testCode,
      guest_name: 'Test User',
      guest_phone: '+971501234567',
      guest_email: 'test@example.com',
      service_id: services.id,
      vehicle_info: 'Toyota Camry',
      scheduled_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      location_type: 'at_location',
      total_price: services.base_price,
      status: 'pending',
      payment_status: 'pending'
    };

    const { data, error } = await supabase
      .from('guest_bookings')
      .insert([testBooking])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create test booking');
      console.error('   Error:', error.message);
      return false;
    }

    console.log('✅ Test booking created successfully!');
    console.log(`   Booking Number: ${data.booking_number}`);
    console.log(`   Confirmation Code: ${data.confirmation_code}`);
    console.log(`   Guest: ${data.guest_name}`);
    console.log(`   Service ID: ${data.service_id}`);
    console.log('');

    // Test 4: Retrieve by confirmation code
    console.log('4️⃣  Testing retrieval by confirmation code...');
    const { data: retrieved, error: retrieveError } = await supabase
      .from('guest_bookings')
      .select('*')
      .eq('confirmation_code', testCode)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve booking');
      console.error('   Error:', retrieveError.message);
      return false;
    }

    console.log('✅ Successfully retrieved booking by confirmation code');
    console.log(`   Retrieved: ${retrieved.guest_name} - ${retrieved.guest_email}\n`);

    // Test 5: Update booking status
    console.log('5️⃣  Testing booking status update...');
    const { data: updated, error: updateError } = await supabase
      .from('guest_bookings')
      .update({ status: 'confirmed' })
      .eq('id', data.id)
      .select();

    if (updateError) {
      console.error('❌ Failed to update booking');
      console.error('   Error:', updateError.message);
      return false;
    }

    console.log('✅ Successfully updated booking status');
    console.log(`   New status: ${updated[0]?.status || 'confirmed'}\n`);

    // Test 6: Cancel booking
    console.log('6️⃣  Testing booking cancellation...');
    const { data: cancelled, error: cancelError } = await supabase
      .from('guest_bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'Test cancellation'
      })
      .eq('id', data.id)
      .select();

    if (cancelError) {
      console.error('❌ Failed to cancel booking');
      console.error('   Error:', cancelError.message);
      return false;
    }

    console.log('✅ Successfully cancelled booking');
    console.log(`   Status: ${cancelled[0]?.status || 'cancelled'}\n`);

    // Cleanup: Delete test booking
    console.log('7️⃣  Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('guest_bookings')
      .delete()
      .eq('id', data.id);

    if (deleteError) {
      console.log('⚠️  Warning: Could not delete test booking');
      console.log('   You may want to manually delete booking TEST1234');
    } else {
      console.log('✅ Test booking cleaned up successfully\n');
    }

    return true;

  } catch (err) {
    console.error('❌ Error during test:', err.message);
    return false;
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Guest Booking System Test Suite      ║');
  console.log('╚════════════════════════════════════════╝\n');

  const success = await testGuestBookingTable();

  console.log('═══════════════════════════════════════');
  if (success) {
    console.log('✨ All tests passed! Guest booking system is ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the API server: npm start');
    console.log('   2. Start the web app: cd apps/web && npm run dev');
    console.log('   3. Visit http://localhost:5173');
    console.log('   4. Click "Book as Guest" to test the full flow');
  } else {
    console.log('❌ Tests failed. Please fix the issues above.');
    console.log('\n📋 Troubleshooting:');
    console.log('   1. Check SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    console.log('   2. Run the migration SQL in Supabase dashboard');
    console.log('   3. Ensure you have at least one active service');
  }
  console.log('═══════════════════════════════════════\n');

  process.exit(success ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
