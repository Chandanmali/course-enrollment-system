const express = require("express");

const {
  enrollInCourse,
  getMyEnrollments,
  getAllEnrollments,
  getCourseEnrollments,
} = require("../controllers/enrollmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Student: enroll in a course
router.post("/", protect, authorize("student"), enrollInCourse);

// Student: view own enrollments
router.get("/my", protect, authorize("student"), getMyEnrollments);

// Admin: view all enrollments
router.get("/", protect, authorize("admin"), getAllEnrollments);

// Admin or teacher: view enrollments for a specific course
router.get(
  "/course/:courseId",
  protect,
  authorize("admin", "teacher"),
  getCourseEnrollments,
);

module.exports = router;
