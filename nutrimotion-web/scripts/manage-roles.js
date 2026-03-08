/**
 * Role Management Script
 * 
 * Usage: 
 *   node scripts/manage-roles.js add <email> <role>
 *   node scripts/manage-roles.js remove <email> <role>
 *   node scripts/manage-roles.js set <email> <roles>
 *   node scripts/manage-roles.js list <email>
 * 
 * Examples:
 *   node scripts/manage-roles.js add admin@example.com administrator
 *   node scripts/manage-roles.js add admin@example.com driver
 *   node scripts/manage-roles.js set user@example.com client,administrator
 *   node scripts/manage-roles.js remove user@example.com driver
 *   node scripts/manage-roles.js list user@example.com
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

const VALID_ROLES = ['client', 'administrator', 'driver'];

function validateRole(role) {
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nutrimotion';
  await mongoose.connect(MONGODB_URI);
  console.log(`✓ Connected to MongoDB\n`);
}

async function findUser(email) {
  const user = await User.findOne({ email });
  
  if (!user) {
    console.error(`❌ User not found: ${email}`);
    console.log(`\nPlease make sure the user has logged in at least once.`);
    process.exit(1);
  }
  
  return user;
}

function displayUser(user) {
  console.log(`User Information:`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Email: ${user.email}`);
  console.log(`  Roles: ${user.roles.join(', ') || '(none)'}`);
  console.log(`  Updated: ${user.updatedAt.toISOString()}`);
}

async function addRole(email, role) {
  validateRole(role);
  await connectDB();
  
  const user = await findUser(email);
  
  console.log(`Adding role: ${role}\n`);
  displayUser(user);
  
  if (user.roles.includes(role)) {
    console.log(`\n✓ User already has the ${role} role!`);
  } else {
    user.roles.push(role);
    user.updatedAt = new Date();
    await user.save();
    
    console.log(`\n✅ Successfully added ${role} role!`);
    console.log(`  New roles: ${user.roles.join(', ')}`);
  }
}

async function removeRole(email, role) {
  validateRole(role);
  await connectDB();
  
  const user = await findUser(email);
  
  console.log(`Removing role: ${role}\n`);
  displayUser(user);
  
  if (!user.roles.includes(role)) {
    console.log(`\n✓ User doesn't have the ${role} role.`);
  } else {
    user.roles = user.roles.filter(r => r !== role);
    user.updatedAt = new Date();
    await user.save();
    
    console.log(`\n✅ Successfully removed ${role} role!`);
    console.log(`  New roles: ${user.roles.join(', ')}`);
  }
}

async function setRoles(email, rolesString) {
  const roles = rolesString.split(',').map(r => r.trim());
  
  roles.forEach(validateRole);
  await connectDB();
  
  const user = await findUser(email);
  
  console.log(`Setting roles: ${roles.join(', ')}\n`);
  displayUser(user);
  
  user.roles = roles;
  user.updatedAt = new Date();
  await user.save();
  
  console.log(`\n✅ Successfully updated roles!`);
  console.log(`  New roles: ${user.roles.join(', ')}`);
}

async function listRoles(email) {
  await connectDB();
  
  const user = await findUser(email);
  
  console.log(`\n`);
  displayUser(user);
  
  console.log(`\nPermissions by Role:`);
  user.roles.forEach(role => {
    console.log(`  ${role}:`);
    // You could add permission details here
  });
}

async function main() {
  const command = process.argv[2];
  const email = process.argv[3];
  const roleArg = process.argv[4];
  
  if (!command || !email) {
    console.log(`\n📝 Role Management Script`);
    console.log(`\nUsage:`);
    console.log(`  node scripts/manage-roles.js add <email> <role>`);
    console.log(`  node scripts/manage-roles.js remove <email> <role>`);
    console.log(`  node scripts/manage-roles.js set <email> <roles>`);
    console.log(`  node scripts/manage-roles.js list <email>`);
    console.log(`\nExamples:`);
    console.log(`  node scripts/manage-roles.js add admin@example.com administrator`);
    console.log(`  node scripts/manage-roles.js add admin@example.com driver`);
    console.log(`  node scripts/manage-roles.js set user@example.com client,administrator`);
    console.log(`  node scripts/manage-roles.js remove user@example.com driver`);
    console.log(`  node scripts/manage-roles.js list user@example.com`);
    console.log(`\nValid Roles:`);
    console.log(`  ${VALID_ROLES.join(', ')}`);
    console.log(``);
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'add':
        if (!roleArg) {
          console.error(`❌ Missing role argument`);
          process.exit(1);
        }
        await addRole(email, roleArg);
        break;
        
      case 'remove':
        if (!roleArg) {
          console.error(`❌ Missing role argument`);
          process.exit(1);
        }
        await removeRole(email, roleArg);
        break;
        
      case 'set':
        if (!roleArg) {
          console.error(`❌ Missing roles argument (comma-separated)`);
          process.exit(1);
        }
        await setRoles(email, roleArg);
        break;
        
      case 'list':
        await listRoles(email);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(`Valid commands: add, remove, set, list`);
        process.exit(1);
    }
    
    console.log(`\n📝 Next steps:`);
    console.log(`  1. Log out from the application`);
    console.log(`  2. Log back in`);
    console.log(`  3. Check the role badges in the top bar`);
    console.log(`  4. Open the menu to see all sections\n`);
    
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(`✓ Disconnected from MongoDB\n`);
  }
}

main();
