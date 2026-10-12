require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    if (
      !process.env.ADMIN_NAME ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env",
      );
    }

    if (process.env.ADMIN_PASSWORD.length < 6) {
      throw new Error("Admin password must contain at least 6 characters");
    }

    await connectDB();

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role !== "admin") {
        throw new Error(
          "ADMIN_EMAIL already belongs to a non-Admin user. Choose a different email.",
        );
      }

      console.log("Admin account already exists. No changes made.");
      return;
    }

    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

    await User.create({
      name: process.env.ADMIN_NAME.trim(),
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("Initial Admin account created successfully.");
  } catch (error) {
    console.error("Admin seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

seedAdmin();
