const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");

// Create a new course
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      teacherId,
      price = 0,
      isFree = false,
      duration,
      level,
      status = "draft",
    } = req.body;

    if (!title || !description || !teacherId || !duration || !level) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required course fields",
        errors: [],
      });
    }

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
        errors: [],
      });
    }

    const teacher = await User.findOne({
      _id: teacherId,
      role: "teacher",
      isActive: true,
    });

    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "An active teacher account is required",
        errors: [],
      });
    }

    const course = await Course.create({
      title,
      description,
      teacherId,
      price: isFree ? 0 : price,
      isFree,
      duration,
      level,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: { course },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [],
      });
    }

    console.error("Create course error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create course",
      errors: [],
    });
  }
};

// Get all active courses

const getCourses = async (req, res) => {
  try {
    const filter = { isActive: true };

    // Admin can view all active courses.
    // Public users and students can view published courses only.
    if (!req.user || req.user.role !== "admin") {
      filter.status = "published";
    } else if (req.query.status) {
      filter.status = req.query.status;
    }

    // Optional teacher filter
    if (req.query.teacherId) {
      if (!mongoose.isValidObjectId(req.query.teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID",
          errors: [],
        });
      }

      filter.teacherId = req.query.teacherId;
    }

    const courses = await Course.find(filter)
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: { courses },
    });
  } catch (error) {
    console.error("Get courses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      errors: [],
    });
  }
};


// Get a course by ID

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
        errors: [],
      });
    }

    const filter = {
      _id: id,
      isActive: true,
    };

    // Only admins can view drafts and archived courses.
    if (!req.user || req.user.role !== "admin") {
      filter.status = "published";
    }

    const course = await Course.findOne(filter).populate(
      "teacherId",
      "name email",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      data: { course },
    });
  } catch (error) {
    console.error("Get course error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course",
      errors: [],
    });
  }
};



const getAdminCourses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.status) {
      const allowedStatuses = ["draft", "published", "archived"];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course status",
          errors: [],
        });
      }

      filter.status = req.query.status;
    }

    if (req.query.teacherId) {
      if (!mongoose.isValidObjectId(req.query.teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID",
          errors: [],
        });
      }

      filter.teacherId = req.query.teacherId;
    }

    const courses = await Course.find(filter)
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: { courses },
    });
  } catch (error) {
    console.error("Get admin courses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin courses",
      errors: [],
    });
  }
};


// Update a course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
        errors: [],
      });
    }

    const allowedFields = [
      "title",
      "description",
      "teacherId",
      "price",
      "isFree",
      "duration",
      "level",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
        errors: [],
      });
    }

    if (updates.teacherId !== undefined) {
      if (!mongoose.isValidObjectId(updates.teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID",
          errors: [],
        });
      }

      const teacher = await User.findOne({
        _id: updates.teacherId,
        role: "teacher",
        isActive: true,
      });

      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: "An active teacher account is required",
          errors: [],
        });
      }
    }

    if (updates.isFree === true) {
      updates.price = 0;
    }

    const course = await Course.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).populate("teacherId", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: { course },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: [],
      });
    }

    console.error("Update course error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update course",
      errors: [],
    });
  }
};

// Soft-delete a course
const deactivateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
        errors: [],
      });
    }

    const course = await Course.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or already deactivated",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deactivated successfully",
      data: { course },
    });
  } catch (error) {
    console.error("Deactivate course error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate course",
      errors: [],
    });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  getAdminCourses,
  updateCourse,
  deactivateCourse,
  
};
