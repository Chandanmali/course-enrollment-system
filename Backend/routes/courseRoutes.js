const express = require("express");

const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deactivateCourse,
  getAdminCourses,
} = require("../controllers/courseController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/admin", protect, authorize("admin"), getAdminCourses);

// Public: list active courses
router.get("/", getCourses);

// Public: get one active course
router.get("/:id", getCourseById);

// Admin only: create a course
router.post("/", protect, authorize("admin"), createCourse);

// Admin only: update a course
router.patch("/:id", protect, authorize("admin"), updateCourse);

// Admin only: deactivate a course
router.delete("/:id", protect, authorize("admin"), deactivateCourse);

module.exports = router;
