
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import authService from "../services/authService";

function TeacherDashboard() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [coursesResponse, studentsResponse] = await Promise.all([
                    api.get("/teacher/courses"),
                    api.get("/teacher/students"),
                ]);

                setCourses(coursesResponse.data.data?.courses || []);
                setEnrollments(studentsResponse.data.data?.enrollments || []);
            } catch (err) {
                setError(
                    err.response?.data?.message || "Failed to load teacher dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const handleLogout = () => {
        authService.logout();
        navigate("/login");
    };

    if (loading) {
        return <main className="dashboard-page"><p>Loading dashboard...</p></main>;
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <h1>Teacher Dashboard</h1>
                    <p>Manage your courses and view enrolled students.</p>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <section>
                <h2>My Courses ({courses.length})</h2>

                {courses.length === 0 ? (
                    <p>No courses have been assigned to you yet.</p>
                ) : (
                    <div className="course-grid">
                        {courses.map((course) => (
                            <article className="course-card" key={course._id}>
                                <h3>{course.title}</h3>
                                <p>{course.description}</p>
                                <p><strong>Level:</strong> {course.level}</p>
                                <p><strong>Duration:</strong> {course.duration}</p>
                                <p><strong>Status:</strong> {course.status}</p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2>Enrolled Students ({enrollments.length})</h2>

                {enrollments.length === 0 ? (
                    <p>No students have enrolled in your courses yet.</p>
                ) : (
                    <div className="course-grid">
                        {enrollments.map((enrollment) => (
                            <article className="course-card" key={enrollment._id}>
                                <h3>{enrollment.studentId?.name || "Student"}</h3>
                                <p>
                                    <strong>Email:</strong>{" "}
                                    {enrollment.studentId?.email || "Not available"}
                                </p>
                                <p>
                                    <strong>Course:</strong>{" "}
                                    {enrollment.courseId?.title || "Course unavailable"}
                                </p>
                                <p>
                                    <strong>Status:</strong> {enrollment.status}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default TeacherDashboard;
