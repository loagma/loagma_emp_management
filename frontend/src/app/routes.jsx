import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/DashboardPage";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import TaskPage from "../pages/TaskPage";
import EmployeeTasksPage from "../pages/EmployeeTasksPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import AutomationPage from "../pages/AutomationPage";
import EmployeeProfilePage from "../pages/EmployeeProfilePage";
import EmployeesPage from "../pages/EmployeesPageNew";
import EmployeeDetailPage from "../pages/EmployeeDetailPage";
import LoginPage from "../pages/LoginPage";

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Dashboard Router - redirects based on user role
const DashboardRouter = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  const isAdmin = user?.is_superuser || user?.is_staff;
  
  if (isAdmin) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/employee-dashboard" replace />;
  }
};

// Task Router - shows different task pages based on user role
const TaskRouter = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userStr);
  const isAdmin = user?.is_superuser || user?.is_staff;
  
  if (isAdmin) {
    return <TaskPage />;
  } else {
    return <EmployeeTasksPage />;
  }
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: <DashboardRouter /> },
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/employee-dashboard", element: <EmployeeDashboard /> },
      { path: "/tasks", element: <TaskRouter /> },
      { path: "/analytics", element: <AnalyticsPage /> },
      { path: "/employees", element: <EmployeesPage /> },
      { path: "/employees/:id", element: <EmployeeDetailPage /> },
      { path: "/automation", element: <AutomationPage /> },
      { path: "/employee", element: <EmployeeProfilePage /> },
    ],
  },
]);
