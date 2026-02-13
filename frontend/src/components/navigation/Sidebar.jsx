import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Settings,
  Users,
  Menu,
  User
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../features/auth/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const isAdmin = user?.is_superuser || user?.is_staff;
  
  // Dynamic menu based on user role
  const menu = [
    {
      name: "Dashboard",
      path: isAdmin ? "/dashboard" : "/employee-dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Tasks",
      path: "/tasks",
      icon: CheckSquare,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      adminOnly: true,
    },
    {
      name: "Employees",
      path: "/employees",
      icon: Users,
      adminOnly: true,
    },
    // {
    //   name: "Automation",
    //   path: "/automation",
    //   icon: Settings,
    // },
    {
      name: "Profile",
      path: "/employee",
      icon: User,
      employeeOnly: true, // Show only for employees
    },
  ];
  
  // Filter menu items based on user role
  const filteredMenu = menu.filter(item => {
    if (item.adminOnly) {
      return isAdmin;
    }
    if (item.employeeOnly) {
      return !isAdmin; // Show only for non-admin users (employees)
    }
    return true;
  });

  return (
    <div
      className={`
        bg-white border-r border-gray-100
        h-screen
        transition-all duration-300
        ${collapsed ? "w-[80px]" : "w-[240px]"}
      `}
    >

      {/* Top section */}
      <div className="flex items-center justify-between p-4">

        {!collapsed && (
          <h2 className="text-lg font-semibold">
            Loagma
          </h2>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Menu size={18} />
        </button>

      </div>


      {/* Menu */}
      <nav className="mt-4 space-y-1">

        {filteredMenu.map((item) => {

          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3 px-4 py-3 text-sm
                transition
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }
                `
              }
            >

              <Icon size={18} />

              {!collapsed && item.name}

            </NavLink>
          );
        })}

      </nav>

    </div>
  );
}
