/**
 * Comprehensive Setup Verification Script
 * Verifies all connections and dependencies are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('\n========================================');
console.log('  SETUP VERIFICATION');
console.log('  In and Out Car Wash System');
console.log('========================================\n');

let passedTests = 0;
let failedTests = 0;
const errors = [];

// Helper functions
function testPassed(name) {
  console.log(`✅ ${name}`);
  passedTests++;
}

function testFailed(name, error) {
  console.log(`❌ ${name}`);
  if (error) errors.push({ test: name, error: error.message });
  failedTests++;
}

function fileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    testPassed(description);
    return true;
  } else {
    testFailed(description, new Error(`File not found: ${filePath}`));
    return false;
  }
}

// Test 1: Check directory structure
console.log('📁 Checking Directory Structure...\n');
const dirs = [
  { path: 'apps/api', desc: 'API directory exists' },
  { path: 'apps/web', desc: 'Web directory exists' },
  { path: 'apps/mobile', desc: 'Mobile directory exists' },
  { path: 'apps/api/src', desc: 'API src directory exists' },
  { path: 'apps/api/src/routes', desc: 'API routes directory exists' },
  { path: 'apps/api/src/models', desc: 'API models directory exists' },
  { path: 'apps/api/src/middleware', desc: 'API middleware directory exists' },
  { path: 'apps/api/src/__tests__', desc: 'API tests directory exists' }
];

dirs.forEach(({ path: dirPath, desc }) => {
  fileExists(path.join(__dirname, dirPath), desc);
});

// Test 2: Check critical files
console.log('\n📄 Checking Critical Files...\n');
const files = [
  { path: 'package.json', desc: 'Root package.json exists' },
  { path: 'apps/api/package.json', desc: 'API package.json exists' },
  { path: 'apps/web/package.json', desc: 'Web package.json exists' },
  { path: 'apps/mobile/package.json', desc: 'Mobile package.json exists' },
  { path: '.env.example', desc: 'Environment template exists' },
  { path: 'README.md', desc: 'README exists' }
];

files.forEach(({ path: filePath, desc }) => {
  fileExists(path.join(__dirname, filePath), desc);
});

// Test 3: Check testing infrastructure
console.log('\n🧪 Checking Testing Infrastructure...\n');
const testFiles = [
  { path: 'apps/api/jest.config.js', desc: 'Jest config exists' },
  { path: 'apps/api/babel.config.js', desc: 'Babel config exists' },
  { path: 'apps/web/vitest.config.js', desc: 'Vitest config exists' },
  { path: 'apps/web/src/test/setup.js', desc: 'Test setup exists' },
  { path: 'apps/api/src/__tests__/models/User.test.js', desc: 'User model tests exist' },
  { path: 'apps/api/src/__tests__/integration/auth.test.js', desc: 'Auth integration tests exist' },
  { path: 'apps/api/src/__tests__/middleware/security.test.js', desc: 'Security tests exist' }
];

testFiles.forEach(({ path: filePath, desc }) => {
  fileExists(path.join(__dirname, filePath), desc);
});

// Test 4: Check API documentation
console.log('\n📚 Checking API Documentation...\n');
const docFiles = [
  { path: 'apps/api/src/config/swagger.js', desc: 'Swagger config exists' },
  { path: 'TESTING_GUIDE.md', desc: 'Testing guide exists' },
  { path: 'PROJECT_IMPROVEMENTS_2024.md', desc: 'Improvements log exists' },
  { path: 'QUICK_REFERENCE.md', desc: 'Quick reference exists' },
  { path: 'IMPROVEMENTS_SUMMARY.md', desc: 'Summary document exists' }
];

docFiles.forEach(({ path: filePath, desc }) => {
  fileExists(path.join(__dirname, filePath), desc);
});

// Test 5: Check middleware and utilities
console.log('\n🔧 Checking Middleware & Utilities...\n');
const middleware = [
  { path: 'apps/api/src/middleware/auth.js', desc: 'Auth middleware exists' },
  { path: 'apps/api/src/middleware/security.js', desc: 'Security middleware exists' },
  { path: 'apps/api/src/middleware/rateLimiter.js', desc: 'Rate limiter exists' },
  { path: 'apps/api/src/middleware/errorHandler.js', desc: 'Error handler exists' },
  { path: 'apps/api/src/utils/validators.js', desc: 'Validators utility exists' }
];

middleware.forEach(({ path: filePath, desc }) => {
  fileExists(path.join(__dirname, filePath), desc);
});

// Test 6: Check package.json scripts
console.log('\n🎯 Checking Package Scripts...\n');
try {
  const rootPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  if (rootPkg.scripts.test) {
    testPassed('Root test script configured');
  } else {
    testFailed('Root test script configured');
  }

  if (rootPkg.scripts['test:api']) {
    testPassed('API test script configured');
  } else {
    testFailed('API test script configured');
  }

  if (rootPkg.scripts['test:web']) {
    testPassed('Web test script configured');
  } else {
    testFailed('Web test script configured');
  }

  const apiPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps/api/package.json'), 'utf8'));

  if (apiPkg.scripts.test) {
    testPassed('API package has test script');
  } else {
    testFailed('API package has test script');
  }

  const webPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps/web/package.json'), 'utf8'));

  if (webPkg.scripts.test) {
    testPassed('Web package has test script');
  } else {
    testFailed('Web package has test script');
  }

} catch (error) {
  testFailed('Package scripts check', error);
}

// Test 7: Check dependencies
console.log('\n📦 Checking Dependencies...\n');
try {
  const apiPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps/api/package.json'), 'utf8'));

  const apiDeps = [
    'jest',
    'supertest',
    '@babel/preset-env',
    'swagger-jsdoc',
    'swagger-ui-express'
  ];

  apiDeps.forEach(dep => {
    if (apiPkg.devDependencies && apiPkg.devDependencies[dep]) {
      testPassed(`API has ${dep}`);
    } else if (apiPkg.dependencies && apiPkg.dependencies[dep]) {
      testPassed(`API has ${dep}`);
    } else {
      testFailed(`API has ${dep}`);
    }
  });

  const webPkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'apps/web/package.json'), 'utf8'));

  const webDeps = [
    'vitest',
    '@testing-library/react',
    '@testing-library/jest-dom'
  ];

  webDeps.forEach(dep => {
    if (webPkg.devDependencies && webPkg.devDependencies[dep]) {
      testPassed(`Web has ${dep}`);
    } else {
      testFailed(`Web has ${dep}`);
    }
  });

} catch (error) {
  testFailed('Dependencies check', error);
}

// Test 8: Check node_modules
console.log('\n📚 Checking Node Modules...\n');
if (fs.existsSync(path.join(__dirname, 'apps/api/node_modules'))) {
  testPassed('API node_modules exists');
} else {
  testFailed('API node_modules exists (run: cd apps/api && npm install)');
}

if (fs.existsSync(path.join(__dirname, 'apps/web/node_modules'))) {
  testPassed('Web node_modules exists');
} else {
  testFailed('Web node_modules exists (run: cd apps/web && npm install)');
}

// Test 9: Check environment configuration
console.log('\n🔐 Checking Environment Configuration...\n');
if (fs.existsSync(path.join(__dirname, 'apps/api/.env'))) {
  testPassed('API .env file exists');

  try {
    const envContent = fs.readFileSync(path.join(__dirname, 'apps/api/.env'), 'utf8');
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    requiredVars.forEach(varName => {
      if (envContent.includes(varName)) {
        testPassed(`${varName} is configured`);
      } else {
        testFailed(`${varName} is configured`);
      }
    });
  } catch (error) {
    testFailed('Environment variables check', error);
  }
} else {
  testFailed('API .env file exists (copy from .env.example)');
}

// Summary
console.log('\n========================================');
console.log('  VERIFICATION SUMMARY');
console.log('========================================\n');

console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📊 Total:  ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 All checks passed! System is properly configured.\n');
  console.log('Next steps:');
  console.log('1. Run tests: npm test');
  console.log('2. Start API: npm run api');
  console.log('3. View docs: http://localhost:3000/api-docs\n');
} else {
  console.log('\n⚠️  Some checks failed. Please review the errors above.\n');

  if (errors.length > 0) {
    console.log('Detailed errors:');
    errors.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`);
    });
    console.log('');
  }

  console.log('Common fixes:');
  console.log('1. Install dependencies: npm run install-all');
  console.log('2. Create .env file: copy .env.example to apps/api/.env');
  console.log('3. Configure environment variables in .env file\n');
}

console.log('For detailed help, see:');
console.log('- QUICK_REFERENCE.md');
console.log('- TESTING_GUIDE.md');
console.log('- PROJECT_IMPROVEMENTS_2024.md\n');

process.exit(failedTests > 0 ? 1 : 0);
