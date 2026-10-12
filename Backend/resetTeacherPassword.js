const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const resetTeacherPassword = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    const email = "teacher.course@example.com";

    // Apna naya temporary password yahan set karo.
    const newPassword = "Teacher@12345";

    await mongoose.connect(process.env.MONGODB_URI);

    const teacher = await User.findOne({ email });

    if (!teacher) {
      console.log("Teacher account not found:", email);
      return;
    }

    if (teacher.role !== "teacher") {
      throw new Error("This account is not a teacher account.");
    }

    teacher.passwordHash = await bcrypt.hash(newPassword, 12);
    await teacher.save();

    console.log("Teacher password reset successfully.");
    console.log("Email:", email);
    console.log("Temporary password:", newPassword);
  } catch (error) {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

resetTeacherPassword();
