
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import authService from "../services/authService";

function StudentDashboard() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingCourseId, setEnrollingCourseId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadDashboard = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);

        setError("");

        try {
            const [courseResponse, enrollmentResponse] = await Promise.all([
                api.get("/courses"),
                api.get("/enrollments/my"),
            ]);

            const availableCourses =
                courseResponse.data?.data?.courses || [];

            const myEnrollments =
                enrollmentResponse.data?.data?.enrollments || [];

            setCourses(
                availableCourses.filter(
                    (course) =>
                        course.status === "published" &&
                        course.isActive !== false
                )
            );

            setEnrollments(myEnrollments);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load dashboard. Please try again."
            );
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadDashboard();
        }, 0);

        return () => clearTimeout(timerId);
    }, [loadDashboard]);

    const enrolledCourseIds = new Set(
        enrollments
            .map((item) => {
                const course = item.courseId;

                return typeof course === "object"
                    ? course?._id
                    : course;
            })
            .filter(Boolean)
            .map(String)
    );

    const handleEnroll = async (courseId) => {
        if (enrollingCourseId) return;

        setMessage("");
        setError("");
        setEnrollingCourseId(courseId);

        try {
            await api.post("/enrollments", { courseId });

            setMessage("Successfully enrolled in the course!");

            await loadDashboard(false);
        } catch (err) {
            if (err.response?.status === 409) {
                setError("You are already enrolled in this course.");
                await loadDashboard(false);
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to enroll in this course. Please try again."
                );
            }
        } finally {
            setEnrollingCourseId("");
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate("/login");
    };

    if (loading) {
        return (
            <main className="dashboard-page">
                <p>Loading dashboard...</p>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Student Dashboard</h1>
                    <p>Explore courses and manage your learning.</p>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </header>

            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            {message && (
                <div className="success-message" role="status">
                    {message}
                </div>
            )}

            <section>
                <h2>Available Courses ({courses.length})</h2>

                {courses.length === 0 ? (
                    <p>No published courses are available yet.</p>
                ) : (
                    <div className="course-grid">
                        {courses.map((course) => {
                            const alreadyEnrolled =
                                enrolledCourseIds.has(String(course._id));

                            const isEnrolling =
                                enrollingCourseId === course._id;

                            return (
                                <article
                                    className="course-card"
                                    key={course._id}
                                >
                                    <h3>{course.title}</h3>

                                    <p>
                                        {course.description ||
                                            "No description available."}
                                    </p>

                                    <p>
                                        <strong>Level:</strong>{" "}
                                        {course.level || "Not specified"}
                                    </p>

                                    <p>
                                        <strong>Duration:</strong>{" "}
                                        {course.duration || "Not specified"}
                                    </p>

                                    <p>
                                        <strong>Teacher:</strong>{" "}
                                        {course.teacherId?.name ||
                                            "Assigned teacher"}
                                    </p>

                                    <p>
                                        <strong>Price:</strong>{" "}
                                        {course.isFree
                                            ? "Free"
                                            : `₹${course.price}`}
                                    </p>

                                    <button
                                        disabled={
                                            alreadyEnrolled ||
                                            Boolean(enrollingCourseId)
                                        }
                                        onClick={() =>
                                            handleEnroll(course._id)
                                        }
                                    >
                                        {alreadyEnrolled
                                            ? "Already Enrolled"
                                            : isEnrolling
                                                ? "Enrolling..."
                                                : "Enroll Now"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <h2>My Enrollments ({enrollments.length})</h2>

                {enrollments.length === 0 ? (
                    <p>You have not enrolled in any courses yet.</p>
                ) : (
                    <div className="course-grid">
                        {enrollments.map((enrollment) => (
                            <article
                                className="course-card"
                                key={enrollment._id}
                            >
                                <h3>
                                    {enrollment.courseId?.title ||
                                        "Course unavailable"}
                                </h3>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    {enrollment.status || "Enrolled"}
                                </p>

                                <p>
                                    <strong>Enrolled:</strong>{" "}
                                    {enrollment.enrolledAt
                                        ? new Date(
                                            enrollment.enrolledAt
                                        ).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default StudentDashboard;
