import { useState } from "react";
import Sidebar from "../components/navigation/Sidebar";
import TopNavbar from "../components/navigation/TopNavbar";
import { Outlet } from "react-router-dom";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import CreateEmployeeModal from "../components/modals/CreateEmployeeModal";

export default function MainLayout() {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const handleTaskCreated = () => {
    setShowCreateTask(false);
    // Optionally refresh data or show success message
  };

  const handleEmployeeCreated = () => {
    setShowAddEmployee(false);
    // Optionally refresh data or show success message
  };

  return (
    <div className="flex relative">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 bg-gray-50 min-h-screen relative">

        <TopNavbar 
          onCreateTask={() => setShowCreateTask(true)}
          onAddEmployee={() => setShowAddEmployee(true)}
        />

        {/* Page Content Wrapper */}
        <div className="px-6 py-6">

          {/* Centered Container */}
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>

        </div>

      </div>

      {/* Global Modals */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onSuccess={handleTaskCreated}
        />
      )}

      {showAddEmployee && (
        <CreateEmployeeModal
          onClose={() => setShowAddEmployee(false)}
          onSuccess={handleEmployeeCreated}
        />
      )}

    </div>
  );
}
