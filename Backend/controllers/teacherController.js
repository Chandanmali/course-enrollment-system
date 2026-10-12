const mongoose = require("mongoose");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Teacher: view own courses
const getMyCourses = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user._id;

    const courses = await Course.find({
      teacherId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: { courses },
    });
  } catch (error) {
    console.error("Get teacher courses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your courses",
      errors: [],
    });
  }
};

// Teacher: view enrolled students across own courses
const getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user.id || req.user._id;

    const courses = await Course.find({
      teacherId,
      isActive: true,
    }).select("_id title");

    const courseIds = courses.map((course) => course._id);

    const enrollments = await Enrollment.find({
      courseId: { $in: courseIds },
    })
      .populate("studentId", "name email")
      .populate("courseId", "title")
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: { enrollments },
    });
  } catch (error) {
    console.error("Get teacher students error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled students",
      errors: [],
    });
  }
};

// Teacher: view students enrolled in one of their courses
const getCourseStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
        errors: [],
      });
    }

    const teacherId = req.user.id || req.user._id;

    const course = await Course.findOne({
      _id: courseId,
      teacherId,
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found or not assigned to you",
        errors: [],
      });
    }

    const enrollments = await Enrollment.find({ courseId })
      .populate("studentId", "name email")
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: { course, enrollments },
    });
  } catch (error) {
    console.error("Get course students error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course students",
      errors: [],
    });
  }
};

module.exports = {
  getMyCourses,
  getMyStudents,
  getCourseStudents,
};
