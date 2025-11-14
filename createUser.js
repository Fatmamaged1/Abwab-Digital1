const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

dotenv.config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Validate environment variables
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file");
      console.log("Example:");
      console.log("  ADMIN_EMAIL=admin@yourdomain.com");
      console.log("  ADMIN_PASSWORD=your-secure-password");
      mongoose.disconnect();
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email:", process.env.ADMIN_EMAIL);
      mongoose.disconnect();
      return;
    }

    const adminUser = new User({
      name: process.env.ADMIN_NAME || 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      isAdmin: true,
      role: 'admin',
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('   Email:', process.env.ADMIN_EMAIL);
    console.log('   Role: admin');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
  } finally {
    mongoose.disconnect();
  }
}

createAdminUser();
