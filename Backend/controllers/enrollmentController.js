const mongoose = require("mongoose");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

// Student: enroll in a published course
const enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { courseId } = req.body;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "A valid course ID is required",
        errors: [],
      });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
      isActive: true,
    });

    if (!student) {
      return res.status(403).json({
        success: false,
        message: "Only active students can enroll in courses",
        errors: [],
      });
    }

    const course = await Course.findOne({
      _id: courseId,
      status: "published",
      isActive: true,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
        errors: [],
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
        errors: [],
      });
    }

    const enrollment = await Enrollment.create({
      studentId,
      courseId,
    });

    const populatedEnrollment = await Enrollment.findById(enrollment._id)
      .populate("studentId", "name email")
      .populate("courseId", "title description teacherId level price isFree");

    return res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      data: { enrollment: populatedEnrollment },
    });
  } catch (error) {
    // Handles duplicate requests protected by the unique database index.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
        errors: [],
      });
    }

    console.error("Enroll in course error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to enroll in course",
      errors: [],
    });
  }
};

// Student: view their own enrollments

const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const enrollments = await Enrollment.find({ studentId })
      .populate({
        path: "courseId",
        select:
          "title description teacherId level price isFree duration status isActive",
        populate: {
          path: "teacherId",
          select: "name email",
        },
      })
      .populate("studentId", "name email")
      .sort({ enrolledAt: -1 });

    // Remove enrollments whose course is missing or inactive.
    const visibleEnrollments = enrollments.filter(
      (enrollment) => enrollment.courseId && enrollment.courseId.isActive,
    );

    return res.status(200).json({
      success: true,
      count: visibleEnrollments.length,
      data: { enrollments: visibleEnrollments },
    });
  } catch (error) {
    console.error("Get my enrollments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your enrollments",
      errors: [],
    });
  }
};


// Admin: view and filter all enrollments
const getAllEnrollments = async (req, res) => {
  try {
    const filter = {};

    const { courseId, studentId, teacherId } = req.query;

    if (courseId) {
      if (!mongoose.isValidObjectId(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
          errors: [],
        });
      }

      filter.courseId = courseId;
    }

    if (studentId) {
      if (!mongoose.isValidObjectId(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid student ID",
          errors: [],
        });
      }

      filter.studentId = studentId;
    }

    if (teacherId) {
      if (!mongoose.isValidObjectId(teacherId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID",
          errors: [],
        });
      }

      const teacherCourses = await Course.find({
        teacherId,
      }).select("_id");

      filter.courseId = {
        $in: teacherCourses.map((course) => course._id),
      };

      if (courseId) {
        filter.courseId = {
          $in: teacherCourses
            .map((course) => course._id)
            .filter((id) => id.toString() === courseId),
        };
      }
    }

    const enrollments = await Enrollment.find(filter)
      .populate("studentId", "name email")
      .populate({
        path: "courseId",
        select: "title teacherId level",
        populate: {
          path: "teacherId",
          select: "name email",
        },
      })
      .sort({ enrolledAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.length,
      data: { enrollments },
    });
  } catch (error) {
    console.error("Get all enrollments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments",
      errors: [],
    });
  }
};

// Admin or assigned teacher: view students enrolled in a course
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
        errors: [],
      });
    }

    const course = await Course.findById(courseId);

    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
        errors: [],
      });
    }

    const requesterId = req.user.id || req.user._id;

    if (
      req.user.role === "teacher" &&
      course.teacherId.toString() !== requesterId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view students in your assigned courses",
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
    console.error("Get course enrollments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch course enrollments",
      errors: [],
    });
  }
};



module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getAllEnrollments,
  getCourseEnrollments,
};
