const express = require("express");

const {
  getMyCourses,
  getMyStudents,
  getCourseStudents,
} = require("../controllers/teacherController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// Teacher: view own courses
router.get("/courses", protect, authorize("teacher"), getMyCourses);

// Teacher: view students enrolled in own courses
router.get("/students", protect, authorize("teacher"), getMyStudents);

// Teacher: view students in one assigned course
router.get(
  "/courses/:courseId/students",
  protect,
  authorize("teacher"),
  getCourseStudents,
);

module.exports = router;
