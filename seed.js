const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/userModel");

async function seedDB() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const user = new User({
    email: "admin@example.com",
    password: "password123", // Remember to hash this in production
    isAdmin: true,
  });

  await user.save();
  console.log("✅ Admin User Created!");

  mongoose.connection.close();
}

seedDB();
