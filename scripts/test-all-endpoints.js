const axios = require('axios');
require('dotenv').config();

/**
 * Test all 19 admin API endpoints
 * Usage: node test-all-endpoints.js
 */

const BASE_URL = 'http://localhost:3000';
let authToken = null;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login() {
  log('\n========================================', 'cyan');
  log('  AUTHENTICATING AS ADMIN', 'cyan');
  log('========================================\n', 'cyan');

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@carwash.com',
      password: 'admin123'
    });

    authToken = response.data.token;
    log('✓ Authentication successful!', 'green');
    log(`  Token: ${authToken.substring(0, 20)}...`, 'blue');
    return true;
  } catch (error) {
    log('✗ Authentication failed!', 'red');
    log(`  Error: ${error.response?.data?.error || error.message}`, 'red');
    log('\n  Make sure you have created an admin user with:', 'yellow');
    log('  Email: admin@carwash.com', 'yellow');
    log('  Password: admin123\n', 'yellow');
    return false;
  }
}

async function testEndpoint(method, path, description, data = null) {
  const fullUrl = `${BASE_URL}${path}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(fullUrl, config);
    } else if (method === 'POST') {
      response = await axios.post(fullUrl, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(fullUrl, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(fullUrl, config);
    }

    log(`✓ ${method.padEnd(6)} ${path}`, 'green');
    log(`     ${description}`, 'blue');
    log(`     Status: ${response.status}`, 'cyan');

    return { success: true, data: response.data };
  } catch (error) {
    log(`✗ ${method.padEnd(6)} ${path}`, 'red');
    log(`     ${description}`, 'blue');
    log(`     Error: ${error.response?.status || 'Network Error'} - ${error.response?.data?.error || error.message}`, 'red');

    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('  TESTING ALL 19 ADMIN API ENDPOINTS', 'cyan');
  log('========================================\n', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    endpoints: []
  };

  // Test 1: Dashboard Stats
  log('\n[1/19] Testing Dashboard Stats...', 'yellow');
  let test = await testEndpoint('GET', '/api/admin/dashboard-stats', 'Get dashboard statistics');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Dashboard Stats', ...test });

  // Test 2: Recent Activity
  log('\n[2/19] Testing Recent Activity...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/recent-activity?limit=5', 'Get recent activity');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Recent Activity', ...test });

  // Test 3: Get All Users
  log('\n[3/19] Testing Get All Users...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/users', 'Get all users');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get All Users', ...test });
  const users = test.data?.users || [];

  // Test 4: Get User by ID (if users exist)
  log('\n[4/19] Testing Get User by ID...', 'yellow');
  if (users.length > 0) {
    const userId = users[0].id;
    test = await testEndpoint('GET', `/api/admin/users/${userId}`, 'Get user details');
  } else {
    log('⊘ Skipped - No users available', 'yellow');
    test = { success: false, error: 'No users to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get User by ID', ...test });

  // Test 5: Get All Bookings
  log('\n[5/19] Testing Get All Bookings...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/bookings', 'Get all bookings');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get All Bookings', ...test });
  const bookings = test.data?.bookings || [];

  // Test 6: Get Booking by ID (if bookings exist)
  log('\n[6/19] Testing Get Booking by ID...', 'yellow');
  if (bookings.length > 0) {
    const bookingId = bookings[0].id;
    test = await testEndpoint('GET', `/api/admin/bookings/${bookingId}`, 'Get booking details');
  } else {
    log('⊘ Skipped - No bookings available', 'yellow');
    test = { success: false, error: 'No bookings to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Booking by ID', ...test });

  // Test 7: Get Booking Stats
  log('\n[7/19] Testing Get Booking Stats...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/bookings/stats/summary', 'Get booking statistics');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Booking Stats', ...test });

  // Test 8: Get All Services
  log('\n[8/19] Testing Get All Services...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/services', 'Get all services');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get All Services', ...test });
  const services = test.data?.services || [];

  // Test 9: Get Service by ID (if services exist)
  log('\n[9/19] Testing Get Service by ID...', 'yellow');
  if (services.length > 0) {
    const serviceId = services[0].id;
    test = await testEndpoint('GET', `/api/admin/services/${serviceId}`, 'Get service details');
  } else {
    log('⊘ Skipped - No services available', 'yellow');
    test = { success: false, error: 'No services to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Service by ID', ...test });

  // Test 10: Create Service
  log('\n[10/19] Testing Create Service...', 'yellow');
  test = await testEndpoint('POST', '/api/admin/services', 'Create new service', {
    name: 'Test Service',
    description: 'This is a test service',
    basePrice: 75.00,
    duration: 20,
    category: 'basic',
    features: ['Test feature 1', 'Test feature 2']
  });
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Create Service', ...test });
  const createdServiceId = test.data?.service?.id;

  // Test 11: Update Service (if we created one)
  log('\n[11/19] Testing Update Service...', 'yellow');
  if (createdServiceId) {
    test = await testEndpoint('PUT', `/api/admin/services/${createdServiceId}`, 'Update service', {
      name: 'Updated Test Service',
      basePrice: 80.00
    });
  } else {
    log('⊘ Skipped - Service creation failed', 'yellow');
    test = { success: false, error: 'No service ID to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Update Service', ...test });

  // Test 12: Toggle Service Status
  log('\n[12/19] Testing Toggle Service Status...', 'yellow');
  if (createdServiceId) {
    test = await testEndpoint('PUT', `/api/admin/services/${createdServiceId}/toggle-status`, 'Toggle service active status');
  } else {
    log('⊘ Skipped - No service ID available', 'yellow');
    test = { success: false, error: 'No service ID to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Toggle Service Status', ...test });

  // Test 13: Delete Service
  log('\n[13/19] Testing Delete Service...', 'yellow');
  if (createdServiceId) {
    test = await testEndpoint('DELETE', `/api/admin/services/${createdServiceId}`, 'Delete service');
  } else {
    log('⊘ Skipped - No service ID available', 'yellow');
    test = { success: false, error: 'No service ID to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Delete Service', ...test });

  // Test 14: Get Analytics
  log('\n[14/19] Testing Get Analytics...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/analytics?timeframe=week', 'Get analytics data');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Analytics', ...test });

  // Test 15: Get Revenue by Day
  log('\n[15/19] Testing Get Revenue by Day...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/analytics/revenue-by-day', 'Get daily revenue');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Revenue by Day', ...test });

  // Test 16: Get Top Services
  log('\n[16/19] Testing Get Top Services...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/analytics/top-services?limit=5', 'Get top performing services');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Top Services', ...test });

  // Test 17: Get Customer Growth
  log('\n[17/19] Testing Get Customer Growth...', 'yellow');
  test = await testEndpoint('GET', '/api/admin/analytics/customer-growth?months=6', 'Get customer growth data');
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Get Customer Growth', ...test });

  // Test 18: Update User (if users exist)
  log('\n[18/19] Testing Update User...', 'yellow');
  if (users.length > 1) {  // Skip admin user
    const userId = users[1].id;
    test = await testEndpoint('PUT', `/api/admin/users/${userId}`, 'Update user details', {
      phone: '+966500000000'
    });
  } else {
    log('⊘ Skipped - Not enough users available', 'yellow');
    test = { success: false, error: 'Not enough users to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Update User', ...test });

  // Test 19: Update Booking Status (if bookings exist)
  log('\n[19/19] Testing Update Booking Status...', 'yellow');
  if (bookings.length > 0) {
    const bookingId = bookings[0].id;
    test = await testEndpoint('PUT', `/api/admin/bookings/${bookingId}/status`, 'Update booking status', {
      status: 'confirmed'
    });
  } else {
    log('⊘ Skipped - No bookings available', 'yellow');
    test = { success: false, error: 'No bookings to test with' };
  }
  results.total++;
  if (test.success) results.passed++; else results.failed++;
  results.endpoints.push({ name: 'Update Booking Status', ...test });

  // Print summary
  log('\n========================================', 'cyan');
  log('  TEST SUMMARY', 'cyan');
  log('========================================\n', 'cyan');

  log(`Total Tests:  ${results.total}`, 'blue');
  log(`Passed:       ${results.passed}`, 'green');
  log(`Failed:       ${results.failed}`, results.failed === 0 ? 'green' : 'red');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%\n`, results.passed === results.total ? 'green' : 'yellow');

  // Print failed tests details
  if (results.failed > 0) {
    log('Failed Tests:', 'red');
    results.endpoints
      .filter(e => !e.success)
      .forEach(e => {
        log(`  ✗ ${e.name}`, 'red');
        log(`    ${e.error}`, 'yellow');
      });
    log('');
  }

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Main execution
async function main() {
  const authenticated = await login();
  if (!authenticated) {
    process.exit(1);
  }

  await runTests();
}

main();
