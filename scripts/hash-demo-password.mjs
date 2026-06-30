#!/usr/bin/env node
/**
 * Generate a password hash + salt for a client demo entry.
 *
 * Usage:
 *   node scripts/hash-demo-password.mjs <password>
 *
 * Copy the output into the matching entry in data/client-demos.json.
 */

import { createHash, randomBytes } from 'crypto';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-demo-password.mjs <password>');
  process.exit(1);
}

const salt = randomBytes(16).toString('hex');
const hash = createHash('sha256').update(salt + password).digest('hex');

console.log(JSON.stringify({ passwordHash: hash, passwordSalt: salt }, null, 2));
console.log('\nPaste the above into the correct entry in data/client-demos.json.');
