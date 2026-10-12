import api from "./api";

const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);

  const token = response.data.token || response.data.data?.token;

  if (token) {
    localStorage.setItem("token", token);
  }

  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

const logout = () => {
  localStorage.removeItem("token");
};

const authService = {
  register,
  login,
  getCurrentUser,
  logout,
};

export default authService;
