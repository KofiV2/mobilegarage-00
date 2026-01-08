require('dotenv').config({ path: __dirname + '/.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to generate UUID
const generateUUID = () => {
  return crypto.randomUUID();
};

// Helper function to generate booking number
const generateBookingNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CW-${timestamp}-${random}`;
};

// Helper to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to add days to date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
};

async function seedDatabase() {
  try {
    console.log('🚀 Starting database seeding with Supabase...\n');

    // ==================== CLEAR EXISTING DATA ====================
    console.log('🗑️  Clearing existing data...');

    // Delete in reverse order of dependencies
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('financial_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicle_care_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('loyalty_punch_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('loyalty_programs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('enhanced_wallets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('wallets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('gamification').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customer_retention').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('environmental_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ai_assistants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('payroll').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('staff_work_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('vehicles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('automated_rewards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ Cleared existing data\n');

    // ==================== USERS ====================
    console.log('👥 Creating users...');
    const userIds = [];
    const users = [
      // Admin
      {
        email: 'admin@carwash.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+966501234567',
        date_of_birth: '1985-05-15',
        is_verified: true,
        is_active: true,
        preferences: { notifications: true, language: 'en', theme: 'light' }
      },
      // Staff Members
      {
        email: 'staff@carwash.com',
        password_hash: await bcrypt.hash('staff123', 10),
        role: 'staff',
        first_name: 'Ahmed',
        last_name: 'Al-Rashid',
        phone: '+966502345678',
        date_of_birth: '1992-08-22',
        is_verified: true,
        is_active: true
      },
      {
        email: 'mohammed.ali@carwash.com',
        password_hash: await bcrypt.hash('staff123', 10),
        role: 'staff',
        first_name: 'Mohammed',
        last_name: 'Ali',
        phone: '+966503456789',
        date_of_birth: '1990-03-10',
        is_verified: true,
        is_active: true
      },
      {
        email: 'khalid.omar@carwash.com',
        password_hash: await bcrypt.hash('staff123', 10),
        role: 'staff',
        first_name: 'Khalid',
        last_name: 'Omar',
        phone: '+966504567890',
        date_of_birth: '1994-11-05',
        is_verified: true,
        is_active: true
      },
      // Customers
      {
        email: 'customer@test.com',
        password_hash: await bcrypt.hash('customer123', 10),
        role: 'customer',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+966505678901',
        date_of_birth: '1988-07-20',
        is_verified: true,
        is_active: true
      },
      {
        email: 'sarah.ahmad@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Sarah',
        last_name: 'Ahmad',
        phone: '+966506789012',
        date_of_birth: '1995-02-14',
        is_verified: true,
        is_active: true,
        address: {
          street: 'King Fahd Road',
          city: 'Riyadh',
          district: 'Al Olaya',
          postal_code: '12211',
          country: 'Saudi Arabia'
        }
      },
      {
        email: 'faisal.hassan@outlook.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Faisal',
        last_name: 'Hassan',
        phone: '+966507890123',
        date_of_birth: '1987-09-30',
        is_verified: true,
        is_active: true,
        address: {
          street: 'Tahlia Street',
          city: 'Riyadh',
          district: 'Al Malqa',
          postal_code: '12851',
          country: 'Saudi Arabia'
        }
      },
      {
        email: 'layla.ibrahim@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Layla',
        last_name: 'Ibrahim',
        phone: '+966508901234',
        date_of_birth: '1992-12-08',
        is_verified: true,
        is_active: true
      },
      {
        email: 'omar.saeed@yahoo.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Omar',
        last_name: 'Saeed',
        phone: '+966509012345',
        date_of_birth: '1985-04-25',
        is_verified: true,
        is_active: true
      },
      {
        email: 'nora.abdullah@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Nora',
        last_name: 'Abdullah',
        phone: '+966500123456',
        date_of_birth: '1998-06-17',
        is_verified: true,
        is_active: true
      },
      {
        email: 'tariq.yousef@hotmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Tariq',
        last_name: 'Yousef',
        phone: '+966501234568',
        date_of_birth: '1991-01-11',
        is_verified: true,
        is_active: true
      },
      {
        email: 'maha.saleh@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Maha',
        last_name: 'Saleh',
        phone: '+966502345679',
        date_of_birth: '1993-10-23',
        is_verified: true,
        is_active: true
      },
      {
        email: 'abdullah.khan@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Abdullah',
        last_name: 'Khan',
        phone: '+966503456780',
        date_of_birth: '1989-03-19',
        is_verified: true,
        is_active: true
      }
    ];

    const { data: createdUsers, error: usersError } = await supabase
      .from('users')
      .insert(users)
      .select('id, email, role');

    if (usersError) throw usersError;

    createdUsers.forEach(user => {
      userIds.push({ id: user.id, email: user.email, role: user.role });
    });

    console.log(`✅ Created ${createdUsers.length} users`);

    // Get customer and staff IDs
    const customerIds = userIds.filter(u => u.role === 'customer');
    const staffIds = userIds.filter(u => u.role === 'staff');

    // ==================== SERVICES ====================
    console.log('\n🧼 Creating services...');
    const services = [
      {
        name: 'Express Wash',
        description: 'Quick exterior wash perfect for busy schedules',
        category: 'Express',
        base_price: 30.00,
        duration_minutes: 15,
        is_active: true,
        features: ['Automated exterior wash', 'Quick dry', 'Tire rinse'],
        display_order: 1
      },
      {
        name: 'Basic Wash',
        description: 'Exterior hand wash with soap and water, tire shine',
        category: 'Basic',
        base_price: 50.00,
        duration_minutes: 30,
        is_active: true,
        features: ['Exterior hand wash', 'Tire cleaning', 'Window cleaning', 'Tire shine'],
        display_order: 2
      },
      {
        name: 'Premium Wash',
        description: 'Complete exterior and interior cleaning',
        category: 'Premium',
        base_price: 100.00,
        duration_minutes: 60,
        is_active: true,
        features: ['Exterior hand wash', 'Interior vacuum', 'Dashboard cleaning', 'Window cleaning', 'Tire shine', 'Air freshener'],
        display_order: 3
      },
      {
        name: 'Deluxe Detail',
        description: 'Full professional detailing service',
        category: 'Deluxe',
        base_price: 250.00,
        duration_minutes: 120,
        is_active: true,
        features: ['Complete exterior wash and wax', 'Interior deep cleaning', 'Leather conditioning', 'Engine bay cleaning', 'Headlight restoration', 'Clay bar treatment', 'Premium air freshener'],
        display_order: 4
      },
      {
        name: 'Interior Only',
        description: 'Comprehensive interior cleaning',
        category: 'Specialty',
        base_price: 80.00,
        duration_minutes: 45,
        is_active: true,
        features: ['Full interior vacuum', 'Dashboard and console cleaning', 'Door panel cleaning', 'Upholstery cleaning', 'Air freshener'],
        display_order: 5
      },
      {
        name: 'Wax & Polish',
        description: 'Professional waxing and polishing',
        category: 'Specialty',
        base_price: 150.00,
        duration_minutes: 90,
        is_active: true,
        features: ['Hand wax application', 'Paint polishing', 'Chrome polishing', 'Scratch removal (light)', 'Paint sealant'],
        display_order: 6
      },
      {
        name: 'Ceramic Coating',
        description: 'Premium paint protection with ceramic coating',
        category: 'Premium',
        base_price: 800.00,
        duration_minutes: 240,
        is_active: true,
        features: ['Paint decontamination', 'Paint correction', '9H ceramic coating application', '5-year warranty', 'Hydrophobic protection'],
        display_order: 7
      },
      {
        name: 'Engine Bay Cleaning',
        description: 'Deep cleaning of engine compartment',
        category: 'Specialty',
        base_price: 120.00,
        duration_minutes: 60,
        is_active: true,
        features: ['Engine degreasing', 'Component cleaning', 'Protective dressing', 'Hose inspection'],
        display_order: 8
      }
    ];

    const { data: createdServices, error: servicesError } = await supabase
      .from('services')
      .insert(services)
      .select('id, name, base_price');

    if (servicesError) throw servicesError;

    console.log(`✅ Created ${createdServices.length} services`);

    // ==================== VEHICLES ====================
    console.log('\n🚗 Creating vehicles...');
    const vehicleData = [
      { make: 'Toyota', model: 'Camry', year: 2022, color: 'Silver', type: 'sedan', license: 'ABC-1234' },
      { make: 'Honda', model: 'Accord', year: 2021, color: 'Black', type: 'sedan', license: 'XYZ-5678' },
      { make: 'BMW', model: 'X5', year: 2023, color: 'White', type: 'suv', license: 'BMW-9012' },
      { make: 'Mercedes', model: 'C-Class', year: 2022, color: 'Gray', type: 'sedan', license: 'MER-3456' },
      { make: 'Ford', model: 'F-150', year: 2020, color: 'Blue', type: 'truck', license: 'FOR-7890' },
      { make: 'Lexus', model: 'RX 350', year: 2023, color: 'Pearl White', type: 'suv', license: 'LEX-2345' },
      { make: 'Nissan', model: 'Patrol', year: 2021, color: 'Black', type: 'suv', license: 'NIS-6789' },
      { make: 'Chevrolet', model: 'Tahoe', year: 2022, color: 'Silver', type: 'suv', license: 'CHE-0123' },
      { make: 'GMC', model: 'Yukon', year: 2023, color: 'White', type: 'suv', license: 'GMC-4567' }
    ];

    const vehicles = customerIds.slice(0, vehicleData.length).map((customer, index) => ({
      user_id: customer.id,
      make: vehicleData[index].make,
      model: vehicleData[index].model,
      year: vehicleData[index].year,
      color: vehicleData[index].color,
      license_plate: vehicleData[index].license,
      vehicle_type: vehicleData[index].type,
      is_primary: true
    }));

    const { data: createdVehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .insert(vehicles)
      .select('id, user_id, make, model, vehicle_type');

    if (vehiclesError) throw vehiclesError;
    console.log(`✅ Created ${createdVehicles.length} vehicles`);

    // ==================== BOOKINGS ====================
    console.log('\n📅 Creating bookings...');
    const bookings = [];
    const statuses = ['completed', 'completed', 'completed', 'confirmed', 'in_progress', 'pending', 'cancelled'];
    const paymentMethods = ['card', 'wallet', 'cash'];

    // Create 30 bookings
    for (let i = 0; i < 30; i++) {
      const vehicle = randomElement(createdVehicles);
      const service = randomElement(createdServices);
      const status = randomElement(statuses);
      const daysAgo = Math.floor(Math.random() * 60);
      const scheduledDate = addDays(new Date(), -daysAgo);

      const totalAmount = service.base_price;
      const discountAmount = Math.random() > 0.7 ? service.base_price * 0.1 : 0;
      const finalAmount = totalAmount - discountAmount;

      bookings.push({
        user_id: vehicle.user_id,
        vehicle_id: vehicle.id,
        service_id: service.id,
        booking_number: generateBookingNumber(),
        scheduled_date: scheduledDate,
        status: status,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_status: status === 'completed' ? 'paid' : (status === 'cancelled' ? 'refunded' : 'pending'),
        payment_method: randomElement(paymentMethods),
        assigned_staff_id: status !== 'pending' ? randomElement(staffIds).id : null,
        completed_at: status === 'completed' ? scheduledDate : null,
        cancelled_at: status === 'cancelled' ? scheduledDate : null
      });
    }

    const { data: createdBookings, error: bookingsError } = await supabase
      .from('bookings')
      .insert(bookings)
      .select('id, user_id, status, final_amount');

    if (bookingsError) throw bookingsError;
    console.log(`✅ Created ${createdBookings.length} bookings`);

    // ==================== REVIEWS ====================
    console.log('\n⭐ Creating reviews...');
    const completedBookings = createdBookings.filter(b => b.status === 'completed');
    const reviewComments = [
      'Excellent service! My car looks brand new.',
      'Very professional team and great attention to detail.',
      'Quick and efficient. Will definitely come back.',
      'Outstanding job on the interior cleaning!',
      'Best car wash experience in Riyadh.',
      'The staff was friendly and the results were amazing.',
      'Good value for money. Highly recommended.',
      'My car has never been this clean!',
      'Professional service with a smile.',
      'The deluxe package was worth every riyal!'
    ];

    const reviews = completedBookings.slice(0, 15).map(booking => ({
      booking_id: booking.id,
      user_id: booking.user_id,
      rating: Math.random() > 0.2 ? (4 + Math.floor(Math.random() * 2)) : 3,
      comment: randomElement(reviewComments),
      is_public: true,
      helpful_count: Math.floor(Math.random() * 20)
    }));

    const { data: createdReviews, error: reviewsError } = await supabase
      .from('reviews')
      .insert(reviews)
      .select('id');

    if (reviewsError) console.log('⚠️ Reviews might already exist or table not available');
    else console.log(`✅ Created ${createdReviews?.length || 0} reviews`);

    // ==================== WALLETS ====================
    console.log('\n💰 Creating wallets...');
    const wallets = customerIds.map(customer => ({
      user_id: customer.id,
      balance: 50 + Math.floor(Math.random() * 500),
      currency: 'SAR',
      is_active: true
    }));

    const { data: createdWallets, error: walletsError } = await supabase
      .from('wallets')
      .insert(wallets)
      .select('id');

    if (walletsError) console.log('⚠️ Wallets might already exist or table not available');
    else console.log(`✅ Created ${createdWallets?.length || 0} wallets`);

    // ==================== ENHANCED WALLETS ====================
    console.log('\n💳 Creating enhanced wallets...');
    const enhancedWallets = customerIds.map(customer => {
      const available = 100 + Math.floor(Math.random() * 1000);
      return {
        user_id: customer.id,
        balance: {
          available: available,
          pending: Math.floor(Math.random() * 50),
          reserved: 0,
          total: available
        },
        currency: 'SAR',
        auto_reload: {
          enabled: Math.random() > 0.5,
          threshold: 50,
          amount: 100
        },
        cashback: {
          rate: 0.05,
          earned: Math.floor(Math.random() * 200),
          pending: Math.floor(Math.random() * 20)
        }
      };
    });

    const { data: createdEnhancedWallets, error: enhancedWalletsError } = await supabase
      .from('enhanced_wallets')
      .insert(enhancedWallets)
      .select('id');

    if (enhancedWalletsError) console.log('⚠️ Enhanced wallets might already exist or table not available');
    else console.log(`✅ Created ${createdEnhancedWallets?.length || 0} enhanced wallets`);

    // ==================== LOYALTY PROGRAMS ====================
    console.log('\n🎁 Creating loyalty programs...');
    const loyaltyPrograms = customerIds.map(customer => {
      const pointsEarned = Math.floor(Math.random() * 5000);
      const pointsRedeemed = Math.floor(Math.random() * 1000);
      const pointsBalance = pointsEarned - pointsRedeemed;
      const tier = pointsBalance < 500 ? 'bronze' : pointsBalance < 1500 ? 'silver' : pointsBalance < 3000 ? 'gold' : 'platinum';

      return {
        user_id: customer.id,
        points_balance: pointsBalance,
        points_earned_lifetime: pointsEarned,
        points_redeemed_lifetime: pointsRedeemed,
        tier_level: tier
      };
    });

    const { data: createdLoyalty, error: loyaltyError } = await supabase
      .from('loyalty_programs')
      .insert(loyaltyPrograms)
      .select('id');

    if (loyaltyError) console.log('⚠️ Loyalty programs might already exist or table not available');
    else console.log(`✅ Created ${createdLoyalty?.length || 0} loyalty programs`);

    // ==================== LOYALTY PUNCH CARDS ====================
    console.log('\n🎫 Creating loyalty punch cards...');
    const punchCards = customerIds.map(customer => ({
      user_id: customer.id,
      active_punch_cards: [{
        id: `card_${crypto.randomUUID()}`,
        name: 'Basic Wash Card',
        washes_required: 5,
        washes_completed: Math.floor(Math.random() * 5),
        start_date: addDays(new Date(), -30),
        expiry_date: addDays(new Date(), 60),
        status: 'active'
      }],
      statistics: {
        total_cards_completed: Math.floor(Math.random() * 10),
        total_washes_recorded: Math.floor(Math.random() * 50),
        free_washes_earned: Math.floor(Math.random() * 10),
        free_washes_redeemed: Math.floor(Math.random() * 8)
      }
    }));

    const { data: createdPunchCards, error: punchCardsError } = await supabase
      .from('loyalty_punch_cards')
      .insert(punchCards)
      .select('id');

    if (punchCardsError) console.log('⚠️ Punch cards might already exist or table not available');
    else console.log(`✅ Created ${createdPunchCards?.length || 0} loyalty punch cards`);

    // ==================== SUBSCRIPTIONS ====================
    console.log('\n📦 Creating subscriptions...');
    const subscriptionPlans = [
      { name: 'Basic Monthly', type: 'monthly', price: 199, washes: 4 },
      { name: 'Premium Monthly', type: 'monthly', price: 349, washes: 8 },
      { name: 'Unlimited Monthly', type: 'monthly', price: 499, washes: 999 }
    ];

    const subscriptions = customerIds.slice(0, 5).map(customer => {
      const plan = randomElement(subscriptionPlans);
      const startDate = addDays(new Date(), -30);
      return {
        user_id: customer.id,
        plan_name: plan.name,
        plan_type: plan.type,
        price: plan.price,
        billing_cycle: 'monthly',
        start_date: startDate,
        end_date: addDays(new Date(startDate), 30),
        status: 'active',
        auto_renew: true,
        washes_included: plan.washes,
        washes_used: Math.floor(Math.random() * plan.washes),
        next_billing_date: addDays(new Date(), 30)
      };
    });

    const { data: createdSubscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .insert(subscriptions)
      .select('id');

    if (subscriptionsError) console.log('⚠️ Subscriptions might already exist or table not available');
    else console.log(`✅ Created ${createdSubscriptions?.length || 0} subscriptions`);

    // ==================== EMPLOYEES ====================
    console.log('\n👔 Creating employee records...');
    const employees = staffIds.map((staff, index) => ({
      user_id: staff.id,
      employee_number: `EMP-${String(1000 + index).padStart(4, '0')}`,
      department: randomElement(['operations', 'management', 'mobile_crew']),
      position: randomElement(['Wash Technician', 'Detail Specialist', 'Shift Supervisor']),
      hire_date: addDays(new Date(), -Math.floor(Math.random() * 730)),
      salary: 3000 + Math.floor(Math.random() * 3000),
      is_active: true
    }));

    const { data: createdEmployees, error: employeesError } = await supabase
      .from('employees')
      .insert(employees)
      .select('id');

    if (employeesError) console.log('⚠️ Employees might already exist or table not available');
    else console.log(`✅ Created ${createdEmployees?.length || 0} employees`);

    // ==================== INVENTORY ITEMS ====================
    console.log('\n📦 Creating inventory items...');
    const inventoryItems = [
      { sku: 'SOAP-001', name: 'Premium Car Soap', category: 'cleaning_supplies', unit_of_measure: 'liter', quantity_in_stock: 150, reorder_level: 30, unit_cost: 25.00 },
      { sku: 'WAX-001', name: 'Carnauba Wax', category: 'waxing', unit_of_measure: 'jar', quantity_in_stock: 45, reorder_level: 10, unit_cost: 120.00 },
      { sku: 'TOWEL-001', name: 'Microfiber Towels', category: 'tools', unit_of_measure: 'piece', quantity_in_stock: 200, reorder_level: 50, unit_cost: 15.00 },
      { sku: 'TIRE-001', name: 'Tire Shine Spray', category: 'chemicals', unit_of_measure: 'bottle', quantity_in_stock: 80, reorder_level: 20, unit_cost: 35.00 },
      { sku: 'FRESH-001', name: 'Air Freshener', category: 'accessories', unit_of_measure: 'piece', quantity_in_stock: 120, reorder_level: 30, unit_cost: 12.00 }
    ];

    const { data: createdInventory, error: inventoryError } = await supabase
      .from('inventory_items')
      .insert(inventoryItems.map(item => ({...item, is_active: true, description: `${item.name} for car wash services`})))
      .select('id');

    if (inventoryError) console.log('⚠️ Inventory items might already exist or table not available');
    else console.log(`✅ Created ${createdInventory?.length || 0} inventory items`);

    // ==================== GAMIFICATION ====================
    console.log('\n🎮 Creating gamification records...');
    const gamification = customerIds.map(customer => {
      const xpPoints = Math.floor(Math.random() * 10000);
      const level = Math.floor(xpPoints / 1000) + 1;
      return {
        user_id: customer.id,
        xp_points: xpPoints,
        level: level,
        achievements: [
          { id: 'first_wash', name: 'First Wash', earned: true, date: addDays(new Date(), -60) },
          { id: 'loyal_customer', name: 'Loyal Customer', earned: Math.random() > 0.5 }
        ],
        badges: [
          { id: 'bronze_member', name: 'Bronze Member', tier: 'bronze' }
        ],
        leaderboard_rank: Math.floor(Math.random() * 100) + 1
      };
    });

    const { data: createdGamification, error: gamificationError } = await supabase
      .from('gamification')
      .insert(gamification)
      .select('id');

    if (gamificationError) console.log('⚠️ Gamification might already exist or table not available');
    else console.log(`✅ Created ${createdGamification?.length || 0} gamification records`);

    // ==================== CUSTOMER RETENTION ====================
    console.log('\n🎯 Creating customer retention records...');
    const retention = customerIds.map(customer => {
      const riskScore = Math.floor(Math.random() * 100);
      return {
        user_id: customer.id,
        status: {
          risk_level: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
          risk_score: riskScore,
          churn_probability: (riskScore / 100).toFixed(2),
          last_visit: addDays(new Date(), -Math.floor(Math.random() * 60))
        },
        engagement: {
          total_visits: Math.floor(Math.random() * 50),
          avg_monthly_visits: Math.floor(Math.random() * 5),
          engagement_score: Math.floor(Math.random() * 100)
        },
        metrics: {
          lifetime_value: Math.floor(Math.random() * 5000),
          avg_spending: Math.floor(Math.random() * 200)
        }
      };
    });

    const { data: createdRetention, error: retentionError } = await supabase
      .from('customer_retention')
      .insert(retention)
      .select('id');

    if (retentionError) console.log('⚠️ Customer retention might already exist or table not available');
    else console.log(`✅ Created ${createdRetention?.length || 0} customer retention records`);

    // ==================== ENVIRONMENTAL TRACKING ====================
    console.log('\n🌱 Creating environmental tracking records...');
    const environmental = customerIds.map(customer => ({
      user_id: customer.id,
      total_water_saved: Math.floor(Math.random() * 500),
      total_co2_offset: Math.floor(Math.random() * 100),
      eco_score: Math.floor(Math.random() * 100),
      eco_achievements: [
        { id: 'water_saver', name: 'Water Saver', level: 1, earned: true }
      ]
    }));

    const { data: createdEnvironmental, error: environmentalError } = await supabase
      .from('environmental_tracking')
      .insert(environmental)
      .select('id');

    if (environmentalError) console.log('⚠️ Environmental tracking might already exist or table not available');
    else console.log(`✅ Created ${createdEnvironmental?.length || 0} environmental tracking records`);

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE SEED DATA SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n👥 Users: ${createdUsers.length} (1 admin, ${staffIds.length} staff, ${customerIds.length} customers)`);
    console.log(`🧼 Services: ${createdServices.length}`);
    console.log(`🚗 Vehicles: ${createdVehicles.length}`);
    console.log(`📅 Bookings: ${createdBookings.length}`);
    console.log(`⭐ Reviews: ${createdReviews?.length || 0}`);
    console.log(`💰 Wallets: ${createdWallets?.length || 0}`);
    console.log(`💳 Enhanced Wallets: ${createdEnhancedWallets?.length || 0}`);
    console.log(`🎁 Loyalty Programs: ${createdLoyalty?.length || 0}`);
    console.log(`🎫 Punch Cards: ${createdPunchCards?.length || 0}`);
    console.log(`📦 Subscriptions: ${createdSubscriptions?.length || 0}`);
    console.log(`👔 Employees: ${createdEmployees?.length || 0}`);
    console.log(`📦 Inventory Items: ${createdInventory?.length || 0}`);
    console.log(`🎮 Gamification: ${createdGamification?.length || 0}`);
    console.log(`🎯 Customer Retention: ${createdRetention?.length || 0}`);
    console.log(`🌱 Environmental Tracking: ${createdEnvironmental?.length || 0}`);

    console.log('\n' + '='.repeat(60));
    console.log('🔑 TEST ACCOUNTS');
    console.log('='.repeat(60));
    console.log('\nAdmin Account:');
    console.log('  Email: admin@carwash.com');
    console.log('  Password: admin123');
    console.log('\nStaff Accounts:');
    console.log('  Email: staff@carwash.com');
    console.log('  Password: staff123');
    console.log('\nCustomer Account:');
    console.log('  Email: customer@test.com');
    console.log('  Password: customer123');
    console.log('\nOther Customers:');
    console.log('  Email: sarah.ahmad@gmail.com / password123');
    console.log('  Email: faisal.hassan@outlook.com / password123');
    console.log('\n' + '='.repeat(60));

    console.log('\n✅ Comprehensive seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding process failed:', error);
    process.exit(1);
  });
