
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import authService from "../services/authService";

const emptyForm = {
    title: "",
    description: "",
    teacherId: "",
    price: "0",
    isFree: true,
    duration: "",
    level: "beginner",
    status: "draft",
};

function AdminDashboard() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [usersResponse, coursesResponse, enrollmentsResponse] =
                await Promise.all([
                    api.get("/admin/users"),
                    api.get("/courses/admin"),
                    api.get("/enrollments"),
                ]);

            const usersData = usersResponse.data.data;

            const allUsers = Array.isArray(usersData)
                ? usersData
                : usersData?.users || [];

            setTeachers(
                allUsers.filter(
                    (user) => user.role === "teacher" && user.isActive === true
                )
            );

            const courseData = coursesResponse.data.data;
            const enrollmentData = enrollmentsResponse.data.data;

            setUsers(allUsers);

            setCourses(
                Array.isArray(courseData)
                    ? courseData
                    : courseData?.courses || []
            );

            setEnrollments(
                Array.isArray(enrollmentData)
                    ? enrollmentData
                    : enrollmentData?.enrollments || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load admin dashboard."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadDashboard();
        }, 0);

        return () => clearTimeout(timerId);
    }, [loadDashboard]);

    const handleLogout = () => {
        authService.logout();
        navigate("/login");
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
            ...(name === "isFree" && checked ? { price: "0" } : {}),
        }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setError("");
        setMessage("");
    };

    const handleEdit = (course) => {
        setEditingId(course._id);
        setMessage("");
        setError("");

        setForm({
            title: course.title || "",
            description: course.description || "",
            teacherId: course.teacherId?._id || course.teacherId || "",
            price: String(course.price ?? 0),
            isFree: Boolean(course.isFree),
            duration: course.duration || "",
            level: course.level || "beginner",
            status: course.status || "draft",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                ...form,
                price: form.isFree ? 0 : Number(form.price),
            };

            if (!payload.teacherId) {
                setError("Please assign a teacher to the course.");
                return;
            }

            if (!form.isFree && payload.price < 0) {
                setError("Price cannot be negative.");
                return;
            }

            if (editingId) {
                await api.patch(`/courses/${editingId}`, payload);
                setMessage("Course updated successfully.");
            } else {
                await api.post("/courses", payload);
                setMessage("Course created successfully.");
            }

            setForm(emptyForm);
            setEditingId(null);
            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to save the course."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (course) => {
        const confirmed = window.confirm(
            `Deactivate "${course.title}"? Students will no longer be able to enroll.`
        );

        if (!confirmed) return;

        setError("");
        setMessage("");

        try {
            await api.delete(`/courses/${course._id}`);

            if (editingId === course._id) {
                resetForm();
            }

            setMessage("Course deactivated successfully.");
            await loadDashboard();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to deactivate the course."
            );
        }
    };

    // const teachers = users.filter(
    //     (user) => user.role === "teacher" && user.isActive !== false
    // );

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
                    <h1>Admin Dashboard</h1>
                    <p>Manage users, courses and enrollments.</p>
                </div>

                <button className="logout-button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <div className="course-grid">
                <article className="course-card">
                    <h3>Total Users</h3>
                    <p>{users.length}</p>
                </article>

                <article className="course-card">
                    <h3>Total Courses</h3>
                    <p>{courses.length}</p>
                </article>

                <article className="course-card">
                    <h3>Total Enrollments</h3>
                    <p>{enrollments.length}</p>
                </article>
            </div>

            <section>
                <h2>{editingId ? "Edit Course" : "Create New Course"}</h2>

                <form className="auth-card course-form" onSubmit={handleSubmit}>
                    <label htmlFor="title">Course Title</label>
                    <input
                        id="title"
                        name="title"
                        value={form.title}
                        onChange={handleFormChange}
                        minLength={3}
                        maxLength={150}
                        required
                    />

                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        maxLength={5000}
                        rows={4}
                        required
                    />

                    <label htmlFor="teacherId">Assign Teacher</label>
                    <select
                        id="teacherId"
                        name="teacherId"
                        value={form.teacherId}
                        onChange={handleFormChange}
                        required
                    >
                        <option value="">Select a teacher</option>
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.name} ({teacher.email})
                            </option>
                        ))}
                    </select>

                    {teachers.length === 0 && (
                        <p>No active teacher accounts found. Create or activate a teacher account first.</p>
                    )}

                    <label htmlFor="duration">Duration</label>
                    <input
                        id="duration"
                        name="duration"
                        placeholder="e.g. 8 weeks"
                        value={form.duration}
                        onChange={handleFormChange}
                        maxLength={100}
                        required
                    />

                    <label htmlFor="level">Level</label>
                    <select
                        id="level"
                        name="level"
                        value={form.level}
                        onChange={handleFormChange}
                        required
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>

                    <label>
                        <input
                            type="checkbox"
                            name="isFree"
                            checked={form.isFree}
                            onChange={handleFormChange}
                        />
                        {" "}Free course
                    </label>

                    {!form.isFree && (
                        <>
                            <label htmlFor="price">Price (₹)</label>
                            <input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleFormChange}
                                required
                            />
                        </>
                    )}

                    <label htmlFor="status">Course Status</label>
                    <select
                        id="status"
                        name="status"
                        value={form.status}
                        onChange={handleFormChange}
                        required
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>

                    <button type="submit" disabled={saving || teachers.length === 0}>
                        {saving
                            ? "Saving..."
                            : editingId
                                ? "Update Course"
                                : "Create Course"}
                    </button>

                    {editingId && (
                        <button type="button" onClick={resetForm}>
                            Cancel Edit
                        </button>
                    )}
                </form>
            </section>

            <section>
                <h2>Users</h2>

                {users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    <div className="course-grid">
                        {users.map((user) => (
                            <article className="course-card" key={user.id}>
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                                <p>
                                    <strong>Account:</strong>{" "}
                                    {user.isActive === false ? "Inactive" : "Active"}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <section>
                <h2>Courses</h2>

                {courses.length === 0 ? (
                    <p>No courses found.</p>
                ) : (
                    <div className="course-grid">
                        {courses.map((course) => (
                            <article className="course-card" key={course._id}>
                                <h3>{course.title}</h3>
                                <p>{course.description}</p>
                                <p><strong>Level:</strong> {course.level}</p>
                                <p><strong>Duration:</strong> {course.duration}</p>
                                <p><strong>Status:</strong> {course.status}</p>
                                <p>
                                    <strong>Teacher:</strong>{" "}
                                    {course.teacherId?.name || "Not available"}
                                </p>
                                <p>
                                    <strong>Price:</strong>{" "}
                                    {course.isFree ? "Free" : `₹${course.price}`}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => handleEdit(course)}
                                >
                                    Edit Course
                                </button>

                                {" "}

                                <button
                                    type="button"
                                    className="logout-button"
                                    onClick={() => handleDeactivate(course)}
                                >
                                    Deactivate
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default AdminDashboard;
