require('dotenv').config({ path: __dirname + '/.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// PostgreSQL connection pool
// Using direct connection to Supabase (requires SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to generate UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to generate booking number
const generateBookingNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CW-${timestamp}-${random}`;
};

// Helper to get random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random date in range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to add days to date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.setDate(date.getDate() + days));
  return result;
};

async function seedDatabase() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🚀 Starting database seeding...\n');

    // ==================== USERS ====================
    console.log('👥 Creating users...');
    const userIds = [];
    const users = [
      // Admin
      {
        id: generateUUID(),
        email: 'admin@carwash.com',
        password_hash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User',
        phone: '+966501234567',
        date_of_birth: '1985-05-15',
        is_verified: true,
        is_active: true,
        preferences: JSON.stringify({ notifications: true, language: 'en', theme: 'light' })
      },
      // Staff Members
      {
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
        email: 'sarah.ahmad@gmail.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Sarah',
        last_name: 'Ahmad',
        phone: '+966506789012',
        date_of_birth: '1995-02-14',
        is_verified: true,
        is_active: true,
        address: JSON.stringify({
          street: 'King Fahd Road',
          city: 'Riyadh',
          district: 'Al Olaya',
          postal_code: '12211',
          country: 'Saudi Arabia'
        })
      },
      {
        id: generateUUID(),
        email: 'faisal.hassan@outlook.com',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'customer',
        first_name: 'Faisal',
        last_name: 'Hassan',
        phone: '+966507890123',
        date_of_birth: '1987-09-30',
        is_verified: true,
        is_active: true,
        address: JSON.stringify({
          street: 'Tahlia Street',
          city: 'Riyadh',
          district: 'Al Malqa',
          postal_code: '12851',
          country: 'Saudi Arabia'
        })
      },
      {
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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
        id: generateUUID(),
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

    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, date_of_birth,
         is_verified, is_active, address, preferences, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())`,
        [user.id, user.email, user.password_hash, user.role, user.first_name, user.last_name,
         user.phone, user.date_of_birth, user.is_verified, user.is_active,
         user.address || null, user.preferences || null]
      );
      userIds.push({ id: user.id, email: user.email, role: user.role });
    }
    console.log(`✅ Created ${users.length} users`);

    // Get customer and staff IDs
    const customerIds = userIds.filter(u => u.role === 'customer');
    const staffIds = userIds.filter(u => u.role === 'staff');

    // ==================== SERVICES ====================
    console.log('\n🧼 Creating services...');
    const serviceIds = [];
    const services = [
      {
        id: generateUUID(),
        name: 'Express Wash',
        description: 'Quick exterior wash perfect for busy schedules',
        category: 'Express',
        base_price: 30.00,
        duration_minutes: 15,
        is_active: true,
        features: JSON.stringify(['Automated exterior wash', 'Quick dry', 'Tire rinse']),
        display_order: 1
      },
      {
        id: generateUUID(),
        name: 'Basic Wash',
        description: 'Exterior hand wash with soap and water, tire shine',
        category: 'Basic',
        base_price: 50.00,
        duration_minutes: 30,
        is_active: true,
        features: JSON.stringify(['Exterior hand wash', 'Tire cleaning', 'Window cleaning', 'Tire shine']),
        display_order: 2
      },
      {
        id: generateUUID(),
        name: 'Premium Wash',
        description: 'Complete exterior and interior cleaning',
        category: 'Premium',
        base_price: 100.00,
        duration_minutes: 60,
        is_active: true,
        features: JSON.stringify(['Exterior hand wash', 'Interior vacuum', 'Dashboard cleaning', 'Window cleaning', 'Tire shine', 'Air freshener']),
        display_order: 3
      },
      {
        id: generateUUID(),
        name: 'Deluxe Detail',
        description: 'Full professional detailing service',
        category: 'Deluxe',
        base_price: 250.00,
        duration_minutes: 120,
        is_active: true,
        features: JSON.stringify(['Complete exterior wash and wax', 'Interior deep cleaning', 'Leather conditioning', 'Engine bay cleaning', 'Headlight restoration', 'Clay bar treatment', 'Premium air freshener']),
        display_order: 4
      },
      {
        id: generateUUID(),
        name: 'Interior Only',
        description: 'Comprehensive interior cleaning',
        category: 'Specialty',
        base_price: 80.00,
        duration_minutes: 45,
        is_active: true,
        features: JSON.stringify(['Full interior vacuum', 'Dashboard and console cleaning', 'Door panel cleaning', 'Upholstery cleaning', 'Air freshener']),
        display_order: 5
      },
      {
        id: generateUUID(),
        name: 'Wax & Polish',
        description: 'Professional waxing and polishing',
        category: 'Specialty',
        base_price: 150.00,
        duration_minutes: 90,
        is_active: true,
        features: JSON.stringify(['Hand wax application', 'Paint polishing', 'Chrome polishing', 'Scratch removal (light)', 'Paint sealant']),
        display_order: 6
      },
      {
        id: generateUUID(),
        name: 'Ceramic Coating',
        description: 'Premium paint protection with ceramic coating',
        category: 'Premium',
        base_price: 800.00,
        duration_minutes: 240,
        is_active: true,
        features: JSON.stringify(['Paint decontamination', 'Paint correction', '9H ceramic coating application', '5-year warranty', 'Hydrophobic protection']),
        display_order: 7
      },
      {
        id: generateUUID(),
        name: 'Engine Bay Cleaning',
        description: 'Deep cleaning of engine compartment',
        category: 'Specialty',
        base_price: 120.00,
        duration_minutes: 60,
        is_active: true,
        features: JSON.stringify(['Engine degreasing', 'Component cleaning', 'Protective dressing', 'Hose inspection']),
        display_order: 8
      }
    ];

    for (const service of services) {
      await client.query(
        `INSERT INTO services (id, name, description, category, base_price, duration_minutes,
         is_active, features, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [service.id, service.name, service.description, service.category, service.base_price,
         service.duration_minutes, service.is_active, service.features, service.display_order]
      );
      serviceIds.push({ id: service.id, name: service.name, price: service.base_price });
    }
    console.log(`✅ Created ${services.length} services`);

    // ==================== VEHICLES ====================
    console.log('\n🚗 Creating vehicles...');
    const vehicleIds = [];
    const vehicleData = [
      { make: 'Toyota', model: 'Camry', year: 2022, color: 'Silver', type: 'sedan', license: 'ABC-1234' },
      { make: 'Honda', model: 'Accord', year: 2021, color: 'Black', type: 'sedan', license: 'XYZ-5678' },
      { make: 'BMW', model: 'X5', year: 2023, color: 'White', type: 'suv', license: 'BMW-9012' },
      { make: 'Mercedes', model: 'C-Class', year: 2022, color: 'Gray', type: 'sedan', license: 'MER-3456' },
      { make: 'Ford', model: 'F-150', year: 2020, color: 'Blue', type: 'truck', license: 'FOR-7890' },
      { make: 'Lexus', model: 'RX 350', year: 2023, color: 'Pearl White', type: 'suv', license: 'LEX-2345' },
      { make: 'Nissan', model: 'Patrol', year: 2021, color: 'Black', type: 'suv', license: 'NIS-6789' },
      { make: 'Chevrolet', model: 'Tahoe', year: 2022, color: 'Silver', type: 'suv', license: 'CHE-0123' },
      { make: 'GMC', model: 'Yukon', year: 2023, color: 'White', type: 'suv', license: 'GMC-4567' },
      { make: 'Audi', model: 'A6', year: 2021, color: 'Dark Blue', type: 'sedan', license: 'AUD-8901' },
      { make: 'Hyundai', model: 'Sonata', year: 2020, color: 'Red', type: 'sedan', license: 'HYU-2346' },
      { make: 'Kia', model: 'Sportage', year: 2022, color: 'Gray', type: 'suv', license: 'KIA-6780' },
      { make: 'Range Rover', model: 'Sport', year: 2023, color: 'Black', type: 'suv', license: 'RAN-0124' }
    ];

    customerIds.forEach((customer, index) => {
      if (index < vehicleData.length) {
        const vehicle = vehicleData[index];
        const vehicleId = generateUUID();
        vehicleIds.push({
          id: vehicleId,
          userId: customer.id,
          type: vehicle.type,
          name: `${vehicle.make} ${vehicle.model}`
        });

        client.query(
          `INSERT INTO vehicles (id, user_id, make, model, year, color, license_plate, vehicle_type,
           is_primary, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [vehicleId, customer.id, vehicle.make, vehicle.model, vehicle.year, vehicle.color,
           vehicle.license, vehicle.type, true]
        );
      }
    });
    console.log(`✅ Created ${vehicleIds.length} vehicles`);

    // ==================== BOOKINGS ====================
    console.log('\n📅 Creating bookings...');
    const bookingIds = [];
    const statuses = ['completed', 'completed', 'completed', 'confirmed', 'in_progress', 'pending', 'cancelled'];
    const paymentStatuses = ['paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'refunded'];
    const paymentMethods = ['card', 'card', 'wallet', 'cash', 'card'];

    // Create 50 bookings with varied dates
    for (let i = 0; i < 50; i++) {
      const bookingId = generateUUID();
      const vehicle = randomElement(vehicleIds);
      const service = randomElement(serviceIds);
      const status = randomElement(statuses);
      const paymentStatus = status === 'completed' ? 'paid' : (status === 'cancelled' ? 'refunded' : 'pending');
      const paymentMethod = randomElement(paymentMethods);

      // Create bookings spread over last 90 days
      const daysAgo = Math.floor(Math.random() * 90);
      const scheduledDate = addDays(new Date(), -daysAgo);

      const totalAmount = service.price;
      const discountAmount = Math.random() > 0.7 ? service.price * 0.1 : 0;
      const finalAmount = totalAmount - discountAmount;

      const assignedStaff = status !== 'pending' ? randomElement(staffIds).id : null;
      const completedAt = status === 'completed' ? scheduledDate : null;
      const cancelledAt = status === 'cancelled' ? scheduledDate : null;

      await client.query(
        `INSERT INTO bookings (id, user_id, vehicle_id, service_id, booking_number, scheduled_date,
         status, total_amount, discount_amount, final_amount, payment_status, payment_method,
         assigned_staff_id, completed_at, cancelled_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
        [bookingId, vehicle.userId, vehicle.id, service.id, generateBookingNumber(), scheduledDate,
         status, totalAmount, discountAmount, finalAmount, paymentStatus, paymentMethod,
         assignedStaff, completedAt, cancelledAt]
      );

      bookingIds.push({
        id: bookingId,
        userId: vehicle.userId,
        status,
        amount: finalAmount,
        serviceId: service.id
      });
    }
    console.log(`✅ Created ${bookingIds.length} bookings`);

    // ==================== REVIEWS ====================
    console.log('\n⭐ Creating reviews...');
    const completedBookings = bookingIds.filter(b => b.status === 'completed');
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

    for (let i = 0; i < Math.min(30, completedBookings.length); i++) {
      const booking = completedBookings[i];
      const rating = Math.random() > 0.2 ? (4 + Math.floor(Math.random() * 2)) : 3;

      await client.query(
        `INSERT INTO reviews (id, booking_id, user_id, rating, comment, is_public, helpful_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [generateUUID(), booking.id, booking.userId, rating, randomElement(reviewComments),
         true, Math.floor(Math.random() * 20)]
      );
    }
    console.log(`✅ Created reviews for completed bookings`);

    // ==================== EMPLOYEES ====================
    console.log('\n👔 Creating employee records...');
    const employeeIds = [];
    const departments = ['operations', 'management', 'mobile_crew'];
    const positions = ['Wash Technician', 'Detail Specialist', 'Shift Supervisor'];

    for (let i = 0; i < staffIds.length; i++) {
      const employeeId = generateUUID();
      const staff = staffIds[i];
      const empNumber = `EMP-${String(1000 + i).padStart(4, '0')}`;

      await client.query(
        `INSERT INTO employees (id, user_id, employee_number, department, position, hire_date,
         salary, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [employeeId, staff.id, empNumber, randomElement(departments), randomElement(positions),
         randomDate(new Date(2022, 0, 1), new Date(2024, 0, 1)),
         3000 + Math.floor(Math.random() * 3000), true]
      );

      employeeIds.push({ id: employeeId, userId: staff.id });
    }
    console.log(`✅ Created ${employeeIds.length} employee records`);

    // ==================== ATTENDANCE ====================
    console.log('\n📋 Creating attendance records...');
    let attendanceCount = 0;

    for (const employee of employeeIds) {
      // Create 30 days of attendance
      for (let day = 0; day < 30; day++) {
        const date = addDays(new Date(), -day);
        const checkIn = new Date(date);
        checkIn.setHours(8, Math.floor(Math.random() * 30), 0);

        const checkOut = new Date(date);
        checkOut.setHours(17, Math.floor(Math.random() * 30), 0);

        const totalHours = (checkOut - checkIn) / (1000 * 60 * 60);

        await client.query(
          `INSERT INTO attendance (id, employee_id, date, check_in_time, check_out_time,
           check_in_method, check_out_method, total_hours, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
          [generateUUID(), employee.id, date.toISOString().split('T')[0], checkIn, checkOut,
           'face_recognition', 'face_recognition', totalHours, 'present']
        );
        attendanceCount++;
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // ==================== WALLETS ====================
    console.log('\n💰 Creating wallets...');
    for (const customer of customerIds) {
      const balance = 50 + Math.floor(Math.random() * 500);

      await client.query(
        `INSERT INTO wallets (id, user_id, balance, currency, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [generateUUID(), customer.id, balance, 'SAR', true]
      );
    }
    console.log(`✅ Created wallets for all customers`);

    // ==================== ENHANCED WALLETS ====================
    console.log('\n💳 Creating enhanced wallets...');
    for (const customer of customerIds) {
      const available = 100 + Math.floor(Math.random() * 1000);
      const balance = JSON.stringify({
        available: available,
        pending: Math.floor(Math.random() * 50),
        reserved: 0,
        total: available
      });

      const autoReload = JSON.stringify({
        enabled: Math.random() > 0.5,
        threshold: 50,
        amount: 100,
        paymentMethodId: 'pm_' + Math.random().toString(36).substr(2, 9)
      });

      const cashback = JSON.stringify({
        rate: 0.05,
        earned: Math.floor(Math.random() * 200),
        pending: Math.floor(Math.random() * 20)
      });

      await client.query(
        `INSERT INTO enhanced_wallets (id, user_id, balance, currency, auto_reload, cashback,
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [generateUUID(), customer.id, balance, 'SAR', autoReload, cashback]
      );
    }
    console.log(`✅ Created enhanced wallets for all customers`);

    // ==================== LOYALTY PROGRAMS ====================
    console.log('\n🎁 Creating loyalty programs...');
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];

    for (const customer of customerIds) {
      const pointsEarned = Math.floor(Math.random() * 5000);
      const pointsRedeemed = Math.floor(Math.random() * 1000);
      const pointsBalance = pointsEarned - pointsRedeemed;
      const tier = pointsBalance < 500 ? 'bronze' : pointsBalance < 1500 ? 'silver' : pointsBalance < 3000 ? 'gold' : 'platinum';

      await client.query(
        `INSERT INTO loyalty_programs (id, user_id, points_balance, points_earned_lifetime,
         points_redeemed_lifetime, tier_level, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [generateUUID(), customer.id, pointsBalance, pointsEarned, pointsRedeemed, tier]
      );
    }
    console.log(`✅ Created loyalty programs for all customers`);

    // ==================== LOYALTY PUNCH CARDS ====================
    console.log('\n🎫 Creating loyalty punch cards...');
    for (const customer of customerIds) {
      const activePunchCards = [];
      const numActiveCards = Math.floor(Math.random() * 3);

      for (let i = 0; i < numActiveCards; i++) {
        activePunchCards.push({
          id: `card_${generateUUID()}`,
          name: 'Basic Wash Card',
          washesRequired: 5,
          washesCompleted: Math.floor(Math.random() * 5),
          startDate: addDays(new Date(), -30).toISOString(),
          expiryDate: addDays(new Date(), 60).toISOString(),
          status: 'active'
        });
      }

      const statistics = JSON.stringify({
        totalCardsCompleted: Math.floor(Math.random() * 10),
        totalWashesRecorded: Math.floor(Math.random() * 50),
        freeWashesEarned: Math.floor(Math.random() * 10),
        freeWashesRedeemed: Math.floor(Math.random() * 8)
      });

      await client.query(
        `INSERT INTO loyalty_punch_cards (id, user_id, active_punch_cards, statistics,
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [generateUUID(), customer.id, JSON.stringify(activePunchCards), statistics]
      );
    }
    console.log(`✅ Created loyalty punch cards for all customers`);

    // ==================== SUBSCRIPTIONS ====================
    console.log('\n📦 Creating subscriptions...');
    const subscriptionPlans = [
      { name: 'Basic Monthly', type: 'monthly', price: 199, washes: 4 },
      { name: 'Premium Monthly', type: 'monthly', price: 349, washes: 8 },
      { name: 'Unlimited Monthly', type: 'monthly', price: 499, washes: 999 }
    ];

    for (let i = 0; i < Math.min(5, customerIds.length); i++) {
      const customer = customerIds[i];
      const plan = randomElement(subscriptionPlans);
      const startDate = addDays(new Date(), -30);
      const washesUsed = Math.floor(Math.random() * plan.washes);

      await client.query(
        `INSERT INTO subscriptions (id, user_id, plan_name, plan_type, price, billing_cycle,
         start_date, end_date, status, auto_renew, washes_included, washes_used,
         next_billing_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [generateUUID(), customer.id, plan.name, plan.type, plan.price, 'monthly',
         startDate, addDays(startDate, 30), 'active', true, plan.washes, washesUsed,
         addDays(new Date(), 30)]
      );
    }
    console.log(`✅ Created subscriptions for active customers`);

    // ==================== FINANCIAL TRANSACTIONS ====================
    console.log('\n💵 Creating financial transactions...');
    let transactionCount = 0;

    for (const booking of bookingIds) {
      if (booking.status === 'completed' || booking.status === 'confirmed') {
        await client.query(
          `INSERT INTO financial_transactions (id, transaction_number, booking_id, user_id,
           type, category, amount, payment_method, status, description, processed_at,
           created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
          [generateUUID(), `TXN-${Date.now()}-${transactionCount}`, booking.id, booking.userId,
           'payment', 'service_payment', booking.amount, 'card', 'completed',
           'Payment for car wash service']
        );
        transactionCount++;
      }
    }
    console.log(`✅ Created ${transactionCount} financial transactions`);

    // ==================== INVENTORY ITEMS ====================
    console.log('\n📦 Creating inventory items...');
    const inventoryItems = [
      { sku: 'SOAP-001', name: 'Premium Car Soap', category: 'cleaning_supplies', unit: 'liter', quantity: 150, reorder: 30, cost: 25.00 },
      { sku: 'WAX-001', name: 'Carnauba Wax', category: 'waxing', unit: 'jar', quantity: 45, reorder: 10, cost: 120.00 },
      { sku: 'TOWEL-001', name: 'Microfiber Towels', category: 'tools', unit: 'piece', quantity: 200, reorder: 50, cost: 15.00 },
      { sku: 'TIRE-001', name: 'Tire Shine Spray', category: 'chemicals', unit: 'bottle', quantity: 80, reorder: 20, cost: 35.00 },
      { sku: 'FRESH-001', name: 'Air Freshener', category: 'accessories', unit: 'piece', quantity: 120, reorder: 30, cost: 12.00 },
      { sku: 'BRUSH-001', name: 'Wheel Brush Set', category: 'tools', unit: 'set', quantity: 25, reorder: 5, cost: 65.00 },
      { sku: 'POLISH-001', name: 'Paint Polish', category: 'polishing', unit: 'bottle', quantity: 35, reorder: 10, cost: 85.00 },
      { sku: 'GLASS-001', name: 'Glass Cleaner', category: 'cleaning_supplies', unit: 'liter', quantity: 60, reorder: 15, cost: 28.00 }
    ];

    for (const item of inventoryItems) {
      await client.query(
        `INSERT INTO inventory_items (id, sku, name, description, category, unit_of_measure,
         quantity_in_stock, reorder_level, unit_cost, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [generateUUID(), item.sku, item.name, `${item.name} for car wash services`,
         item.category, item.unit, item.quantity, item.reorder, item.cost, true]
      );
    }
    console.log(`✅ Created ${inventoryItems.length} inventory items`);

    // ==================== GAMIFICATION ====================
    console.log('\n🎮 Creating gamification records...');
    for (const customer of customerIds) {
      const xpPoints = Math.floor(Math.random() * 10000);
      const level = Math.floor(xpPoints / 1000) + 1;

      const achievements = JSON.stringify([
        { id: 'first_wash', name: 'First Wash', earned: true, date: addDays(new Date(), -60).toISOString() },
        { id: 'loyal_customer', name: 'Loyal Customer', earned: Math.random() > 0.5, date: addDays(new Date(), -30).toISOString() },
        { id: 'referral_master', name: 'Referral Master', earned: Math.random() > 0.7 }
      ]);

      const badges = JSON.stringify([
        { id: 'bronze_member', name: 'Bronze Member', tier: 'bronze' },
        { id: 'eco_warrior', name: 'Eco Warrior', tier: 'silver', earned: Math.random() > 0.6 }
      ]);

      await client.query(
        `INSERT INTO gamification (id, user_id, xp_points, level, achievements, badges,
         leaderboard_rank, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [generateUUID(), customer.id, xpPoints, level, achievements, badges,
         Math.floor(Math.random() * 100) + 1]
      );
    }
    console.log(`✅ Created gamification records for all customers`);

    // ==================== CUSTOMER RETENTION ====================
    console.log('\n🎯 Creating customer retention records...');
    for (const customer of customerIds) {
      const riskScore = Math.floor(Math.random() * 100);
      const churnProbability = riskScore / 100;

      const status = JSON.stringify({
        riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
        riskScore: riskScore,
        churnProbability: churnProbability.toFixed(2),
        lastVisit: addDays(new Date(), -Math.floor(Math.random() * 60)).toISOString()
      });

      const engagement = JSON.stringify({
        totalVisits: Math.floor(Math.random() * 50),
        avgMonthlyVisits: Math.floor(Math.random() * 5),
        lastInteraction: addDays(new Date(), -Math.floor(Math.random() * 30)).toISOString(),
        engagementScore: Math.floor(Math.random() * 100)
      });

      const metrics = JSON.stringify({
        lifetimeValue: Math.floor(Math.random() * 5000),
        avgSpending: Math.floor(Math.random() * 200),
        retentionRate: (Math.random() * 0.4 + 0.6).toFixed(2)
      });

      await client.query(
        `INSERT INTO customer_retention (id, user_id, status, engagement, metrics,
         created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [generateUUID(), customer.id, status, engagement, metrics]
      );
    }
    console.log(`✅ Created customer retention records`);

    // ==================== ENVIRONMENTAL TRACKING ====================
    console.log('\n🌱 Creating environmental tracking records...');
    for (const customer of customerIds) {
      const totalWaterSaved = Math.floor(Math.random() * 500);
      const totalCo2Offset = Math.floor(Math.random() * 100);
      const ecoScore = Math.floor(Math.random() * 100);

      const ecoAchievements = JSON.stringify([
        { id: 'water_saver', name: 'Water Saver', level: 1, earned: true },
        { id: 'eco_champion', name: 'Eco Champion', level: 2, earned: Math.random() > 0.5 }
      ]);

      await client.query(
        `INSERT INTO environmental_tracking (id, user_id, total_water_saved, total_co2_offset,
         eco_score, eco_achievements, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [generateUUID(), customer.id, totalWaterSaved, totalCo2Offset, ecoScore, ecoAchievements]
      );
    }
    console.log(`✅ Created environmental tracking records`);

    // ==================== AI ASSISTANTS ====================
    console.log('\n🤖 Creating AI assistant records...');
    for (let i = 0; i < Math.min(5, customerIds.length); i++) {
      const customer = customerIds[i];
      const conversationHistory = JSON.stringify([
        { role: 'user', message: 'I need to book a car wash', timestamp: new Date().toISOString() },
        { role: 'assistant', message: 'I can help you with that! What type of service are you looking for?', timestamp: new Date().toISOString() }
      ]);

      const preferences = JSON.stringify({
        preferredServices: ['Premium Wash', 'Deluxe Detail'],
        preferredTime: 'morning',
        notifications: true
      });

      await client.query(
        `INSERT INTO ai_assistants (id, user_id, conversation_history, preferences,
         last_interaction, total_interactions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW())`,
        [generateUUID(), customer.id, conversationHistory, preferences,
         Math.floor(Math.random() * 50)]
      );
    }
    console.log(`✅ Created AI assistant records`);

    // ==================== STAFF WORK TRACKING ====================
    console.log('\n⏱️ Creating staff work tracking records...');
    for (const employee of employeeIds) {
      const dailyMetrics = JSON.stringify({
        jobsCompleted: Math.floor(Math.random() * 10),
        hoursWorked: 8 + Math.random() * 2,
        efficiency: (Math.random() * 0.3 + 0.7).toFixed(2),
        customerRating: (Math.random() * 1 + 4).toFixed(1)
      });

      const weeklyMetrics = JSON.stringify({
        totalJobs: Math.floor(Math.random() * 50),
        totalHours: 40 + Math.random() * 10,
        avgEfficiency: (Math.random() * 0.3 + 0.7).toFixed(2)
      });

      const productivity = JSON.stringify({
        score: Math.floor(Math.random() * 30 + 70),
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        benchmark: 85
      });

      await client.query(
        `INSERT INTO staff_work_tracking (id, employee_id, daily_metrics, weekly_metrics,
         productivity, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [generateUUID(), employee.id, dailyMetrics, weeklyMetrics, productivity]
      );
    }
    console.log(`✅ Created staff work tracking records`);

    // ==================== AUTOMATED REWARDS ====================
    console.log('\n🎁 Creating automated rewards system...');
    const businessId = generateUUID();

    const rewardPrograms = JSON.stringify([
      { id: 'birthday_special', name: 'Birthday Special', type: 'birthday', reward: '50% off any service' },
      { id: 'anniversary_bonus', name: 'Anniversary Bonus', type: 'anniversary', reward: 'Free premium wash' },
      { id: 'referral_reward', name: 'Referral Reward', type: 'referral', reward: '100 SAR wallet credit' }
    ]);

    const birthdayRewards = JSON.stringify({
      enabled: true,
      rewardType: 'discount',
      rewardValue: 50,
      validityDays: 30,
      issued: Math.floor(Math.random() * 50),
      redeemed: Math.floor(Math.random() * 30)
    });

    const spendingMilestones = JSON.stringify([
      { amount: 500, reward: '50 SAR credit', reached: Math.floor(Math.random() * 20) },
      { amount: 1000, reward: 'Free deluxe wash', reached: Math.floor(Math.random() * 10) },
      { amount: 2000, reward: 'VIP status upgrade', reached: Math.floor(Math.random() * 5) }
    ]);

    const analytics = JSON.stringify({
      totalRewardsIssued: Math.floor(Math.random() * 200),
      totalRewardsRedeemed: Math.floor(Math.random() * 150),
      redemptionRate: (Math.random() * 0.3 + 0.6).toFixed(2),
      customerEngagement: (Math.random() * 0.2 + 0.7).toFixed(2)
    });

    await client.query(
      `INSERT INTO automated_rewards (id, business_id, reward_programs, birthday_rewards,
       spending_milestones, analytics, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [generateUUID(), businessId, rewardPrograms, birthdayRewards, spendingMilestones, analytics]
    );
    console.log(`✅ Created automated rewards system`);

    // ==================== COMMIT ====================
    await client.query('COMMIT');
    console.log('\n✨ Database seeding completed successfully!\n');

    // ==================== SUMMARY ====================
    console.log('='.repeat(60));
    console.log('📊 SEED DATA SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n👥 Users: ${users.length}`);
    console.log(`   - Admins: 1`);
    console.log(`   - Staff: ${staffIds.length}`);
    console.log(`   - Customers: ${customerIds.length}`);
    console.log(`\n🧼 Services: ${services.length}`);
    console.log(`🚗 Vehicles: ${vehicleIds.length}`);
    console.log(`📅 Bookings: ${bookingIds.length}`);
    console.log(`⭐ Reviews: ~30`);
    console.log(`👔 Employees: ${employeeIds.length}`);
    console.log(`📋 Attendance Records: ${attendanceCount}`);
    console.log(`💰 Wallets: ${customerIds.length}`);
    console.log(`💳 Enhanced Wallets: ${customerIds.length}`);
    console.log(`🎁 Loyalty Programs: ${customerIds.length}`);
    console.log(`🎫 Punch Cards: ${customerIds.length}`);
    console.log(`📦 Subscriptions: 5`);
    console.log(`💵 Financial Transactions: ${transactionCount}`);
    console.log(`📦 Inventory Items: ${inventoryItems.length}`);
    console.log(`🎮 Gamification: ${customerIds.length}`);
    console.log(`🎯 Customer Retention: ${customerIds.length}`);
    console.log(`🌱 Environmental Tracking: ${customerIds.length}`);
    console.log(`🤖 AI Assistants: 5`);
    console.log(`⏱️ Staff Work Tracking: ${employeeIds.length}`);
    console.log(`🎁 Automated Rewards: 1 system`);

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
    console.log('  Email: sarah.ahmad@gmail.com');
    console.log('  Password: password123');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
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
