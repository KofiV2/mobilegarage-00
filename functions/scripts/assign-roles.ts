/**
 * CLI script to assign Firebase Custom Claims (roles) to users.
 * Run from the functions/ directory:
 *   npx ts-node scripts/assign-roles.ts <email> <role>
 *
 * Example:
 *   npx ts-node scripts/assign-roles.ts owner@email.com manager
 *   npx ts-node scripts/assign-roles.ts staff1@email.com staff
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS env var pointing to a
 * Firebase Admin SDK service account key JSON file.
 */

import * as admin from 'firebase-admin';

admin.initializeApp();

const validRoles = ['customer', 'staff', 'manager'] as const;
type Role = typeof validRoles[number];

async function assignRole(email: string, role: Role): Promise<void> {
  try {
    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, { role });

    console.log(`Successfully assigned role '${role}' to ${email} (uid: ${user.uid})`);

    // Verify
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('Current claims:', updatedUser.customClaims);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Unknown error:', error);
    }
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: npx ts-node scripts/assign-roles.ts <email> <role>');
  console.error(`Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

const [email, role] = args;

if (!validRoles.includes(role as Role)) {
  console.error(`Invalid role '${role}'. Valid roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

assignRole(email, role as Role).then(() => {
  console.log('Done.');
  process.exit(0);
});
