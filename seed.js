const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/userModel");

async function seedDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if admin user should be created from environment variables
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.log("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file");
      console.log("Example:");
      console.log("  ADMIN_EMAIL=admin@yourdomain.com");
      console.log("  ADMIN_PASSWORD=your-secure-password");
      mongoose.connection.close();
      return;
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email:", process.env.ADMIN_EMAIL);
      mongoose.connection.close();
      return;
    }

    const user = new User({
      name: process.env.ADMIN_NAME || "Admin",
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      isAdmin: true,
      role: 'admin',
    });

    await user.save();
    console.log("✅ Admin User Created!");
    console.log("   Email:", process.env.ADMIN_EMAIL);
    console.log("   Role: admin");
    console.log("⚠️  IMPORTANT: Change the password after first login!");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedDB();
