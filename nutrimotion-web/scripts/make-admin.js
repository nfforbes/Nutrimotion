/**
 * Make User Admin Script
 * 
 * Usage: node scripts/make-admin.js your-email@example.com
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  auth0Sub: String,
  email: String,
  name: String,
  roles: [String],
  phoneNumber: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

async function makeAdmin(email) {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrimotion';
    await mongoose.connect(MONGODB_URI);
    
    console.log(`Connected to MongoDB`);
    console.log(`Looking for user with email: ${email}`);
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log(`\nPlease make sure the user has logged in at least once.`);
      process.exit(1);
    }
    
    console.log(`\nFound user:`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current roles: ${user.roles.join(', ')}`);
    
    // Update roles to include administrator
    if (user.roles.includes('administrator')) {
      console.log(`\n✓ User is already an administrator!`);
    } else {
      user.roles = ['administrator'];
      user.updatedAt = new Date();
      await user.save();
      
      console.log(`\n✅ Successfully updated user to ADMINISTRATOR role!`);
      console.log(`  New roles: ${user.roles.join(', ')}`);
    }
    
    console.log(`\n📝 Next steps:`);
    console.log(`  1. Log out from the application`);
    console.log(`  2. Log back in`);
    console.log(`  3. Visit: https://localhost:3000/admin/dashboard`);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`\nDisconnected from MongoDB`);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error(`\n❌ Usage: node scripts/make-admin.js <email>`);
  console.error(`\nExample: node scripts/make-admin.js admin@example.com`);
  process.exit(1);
}

makeAdmin(email);
