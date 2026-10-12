const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
        errors: [],
      });
    }

    if (name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 100 characters",
        errors: [],
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
        errors: [],
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
        errors: [],
      });
    }

    if (!["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be admin, teacher or student",
        errors: [],
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
        errors: [],
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
        errors: [],
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
        errors: [],
      });
    }

    console.error("Create user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const filter = {};

    if (req.query.role !== undefined) {
      if (!["admin", "teacher", "student"].includes(req.query.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
          errors: [],
        });
      }

      filter.role = req.query.role;
    }

    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
          errors: [],
        });
      }

      filter.isActive = req.query.isActive === "true";
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: users.map(publicUser),
        count: users.length,
      },
    });
  } catch (error) {
    console.error("Get users error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        errors: [],
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    console.error("Get user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  }
};

// PATCH /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        errors: [],
      });
    }

    const user = await User.findById(id).select("+passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: [],
      });
    }

    if (
      name === undefined &&
      email === undefined &&
      password === undefined &&
      role === undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
        errors: [],
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain 2 to 100 characters",
          errors: [],
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({
          success: false,
          message: "Email must be a string",
          errors: [],
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
          errors: [],
        });
      }

      user.email = normalizedEmail;
    }

    if (password !== undefined) {
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must contain at least 6 characters",
          errors: [],
        });
      }

      user.passwordHash = await bcrypt.hash(password, 12);
    }

    if (role !== undefined) {
      if (!["admin", "teacher", "student"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
          errors: [],
        });
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
          errors: [],
        });
      }

      // Prevent an Admin from deactivating their own account.
      if (user._id.equals(req.user._id) && isActive === false) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account",
          errors: [],
        });
      }

      user.isActive = isActive;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
        errors: [],
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user data",
        errors: [],
      });
    }

    console.error("Update user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  }
};

// DELETE /api/admin/users/:id
// Soft-delete: deactivate instead of removing the database record.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
        errors: [],
      });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
        errors: [],
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        errors: [],
      });
    }

    user.isActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    console.error("Deactivate user error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      errors: [],
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
