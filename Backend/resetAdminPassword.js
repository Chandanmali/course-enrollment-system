require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdminPassword() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL,
    );

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
    }

    if (password.length < 12) {
      throw new Error("Admin password must be at least 12 characters.");
    }

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || user.role !== "admin" || !user.isActive) {
      throw new Error("Active admin account not found. No changes made.");
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    console.log("Admin password reset successfully.");
    console.log("Email:", email);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

resetAdminPassword();
