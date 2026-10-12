
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

function ProtectedRoute({ allowedRoles, children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const verifyUser = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                if (!cancelled) {
                    setUnauthorized(true);
                    setLoading(false);
                }
                return;
            }

            try {
                const response = await authService.getCurrentUser();
                const currentUser =
                    response.user ||
                    response.data?.user ||
                    response.data;

                if (!cancelled) {
                    if (currentUser?.role) {
                        setUser(currentUser);
                    } else {
                        setUnauthorized(true);
                    }
                }
            } catch {
                localStorage.removeItem("token");

                if (!cancelled) {
                    setUnauthorized(true);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        verifyUser();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <main className="dashboard-page"><p>Verifying login...</p></main>;
    }

    if (unauthorized || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        if (user.role === "admin") {
            return <Navigate to="/admin" replace />;
        }

        if (user.role === "teacher") {
            return <Navigate to="/teacher" replace />;
        }

        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;
