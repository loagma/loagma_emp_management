import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getCurrentUser } from "../features/auth/api/authApi";
import { useAuth } from "../features/auth/AuthContext";
import toast from "react-hot-toast";
import Input from "../components/ui/form/Input";
import Button from "../components/ui/Button";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(formData);

      // Save tokens temporarily
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // Fetch user info to check user type
      const userInfo = await getCurrentUser();

      // Check if user is active
      if (!userInfo.is_active) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        toast.error("Your account has been deactivated. Please contact your administrator for assistance.");
        setLoading(false);
        return;
      }

      // Save user info to localStorage for routing
      localStorage.setItem("user", JSON.stringify(userInfo));

      // Refresh AuthContext to update user state
      await refreshUser();

      // Allow both superusers and regular employees
      toast.success("Login successful!");

      // Redirect based on user role
      const isAdmin = userInfo.is_superuser || userInfo.is_staff;
      if (isAdmin) {
        navigate("/dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Clear tokens on error
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      toast.error(
        error.response?.data?.detail || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Loagma</h1>
            <p className="text-gray-600">Employee Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p className="font-medium text-gray-700">Loagma Employee Management</p>
            <p className="mt-2 text-xs">
              Login with your credentials to access the system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
