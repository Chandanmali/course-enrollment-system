require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const connectDB = require("./config/db");

const createAdmin = async () => {
  try {
    await connectDB();

    const name = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env first.",
      );
    }

    if (password.length < 12) {
      throw new Error(
        "For this one-time setup, use an admin password of at least 12 characters.",
      );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role === "admin" && existingUser.isActive) {
        console.log("An active admin already exists for this email.");
        return;
      }

      throw new Error(
        "This email already belongs to a non-admin or inactive account. No changes were made.",
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("Admin account created successfully.");
    console.log(`Admin email: ${email}`);
  } catch (error) {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

createAdmin();
