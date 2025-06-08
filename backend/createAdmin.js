#!/usr/bin/env node

/**
 * Script to create an admin account
 * Run: node scripts/createAdmin.js
 * or: npm run create-admin
 */

const mongoose = require('mongoose');
const readline = require('readline');
const Admin = require('./models/adminModel');

// Load environment variables if using dotenv
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    console.log('\n=== Create Admin Account ===\n');

    // Get admin details
    const username = await question('Enter username: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password (min 6 characters): ');
    const roleInput = await question('Enter role (admin/super-admin) [default: admin]: ');

    const role = roleInput.trim() || 'admin';

    // Validate input
    if (!username || !email || !password) {
      console.error('❌ All fields are required!');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });

    if (existingAdmin) {
      console.error('❌ Admin with this email or username already exists!');
      process.exit(1);
    }

    // Create admin
    const admin = await Admin.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      role
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('📋 Details:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin._id}`);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
};

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Script terminated by user');
  rl.close();
  process.exit(0);
});

// Run the script
createAdmin();

/*
Add this to your package.json scripts:
{
  "scripts": {
    "create-admin": "node scripts/createAdmin.js"
  }
}

Then run: npm run create-admin
*/