/**
 * Script to set custom claims for manager users
 * Run: node scripts/set-manager-role.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '../service-account.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath))
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:');
  console.error('Make sure you have a service-account.json file in the project root.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

const userEmail = process.argv[2] || 'manager1@3on.ae';

async function setManagerRole(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, { role: 'manager' });
    console.log(`✅ Successfully set role: 'manager' for ${email}`);
    
    // Verify
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Custom claims:', updatedUser.customClaims);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  process.exit(0);
}

setManagerRole(userEmail);
