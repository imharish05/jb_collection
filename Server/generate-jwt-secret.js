#!/usr/bin/env node
// Generate a cryptographically secure JWT secret
// Run: node generate-jwt-secret.js

const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('\n✅ Generated Secure JWT Secret:\n');
console.log(secret);
console.log('\n⚠️  Update your .env file:');
console.log(`JWT_SECRET=${secret}\n`);
