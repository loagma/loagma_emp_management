import { Bell, Search, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "../../features/auth/AuthContext";
import QuickActionMenu from "./QuickActionMenu";
import useClickOutside from "../../hooks/useClickOutside";
import useEscapeKey from "../../hooks/useEscapeKey";


export default function TopNavbar({ onCreateTask, onAddEmployee }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const pageTitles = {
    "/": "Dashboard",
    "/dashboard": "Dashboard",
    "/tasks": "Task Management",
    "/analytics": "Analytics",
    "/automation": "Automation",
    "/employees": "Employee Management",
    "/employee": "Employee Profile",
  };

  const currentTitle = pageTitles[location.pathname] || "Dashboard";

  // Close dropdowns when clicking outside
  useClickOutside(notificationRef, () => setOpenNotifications(false));
  useClickOutside(profileRef, () => setOpenProfile(false));

  // Close dropdowns on Escape key
  useEscapeKey(() => {
    setOpenNotifications(false);
    setOpenProfile(false);
  });

  return (
    <div className="h-[70px] bg-white border-b border-gray-100 px-6 flex items-center justify-between z-30">

      {/* Left Side */}
      <div>
        <h1 className="text-lg font-semibold">
          {currentTitle}
        </h1>
      </div>


      {/* Right Side */}
      <div className="flex items-center gap-4">

        {/* Global Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search anything..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none w-[240px]"
          />
        </div>


        {/* Notification Bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Bell size={18} />
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[260px] bg-white border rounded-lg shadow-lg p-3 text-sm z-40">
              <p className="font-semibold mb-2">
                Notifications
              </p>
              <div className="space-y-2">
                <p className="text-gray-500 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  New task assigned
                </p>
                <p className="text-gray-500 hover:bg-gray-50 p-2 rounded cursor-pointer">
                  Deadline reminder
                </p>
              </div>
            </div>
          )}
        </div>


        {/* Quick Action Button - Admin Only */}
        {(user?.is_superuser || user?.is_staff) && (
          <QuickActionMenu
            onCreateTask={onCreateTask}
            onAddEmployee={onAddEmployee}
          />
        )}


        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <div
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition"
          >
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">{user?.username || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role_display || "Role"}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </div>

          {openProfile && (
            <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border rounded-lg shadow-lg py-2 text-sm z-40">
              <div className="px-4 py-2 border-b">
                <p className="font-medium">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {user?.organization_name}
                </p>
              </div>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50">
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50">
                Preferences
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
