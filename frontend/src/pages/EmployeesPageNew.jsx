import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEmployees } from "../features/employees/api/employeeApi";
import { getAttendanceList } from "../features/attendance/api/attendanceApi";
import { useAuth } from "../features/auth/AuthContext";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import Button from "../components/ui/Button";
import CreateEmployeeModal from "../components/modals/CreateEmployeeModal";
import EnhancedEmployeeCard from "../components/employees/EnhancedEmployeeCard";
import EmployeeQuickView from "../components/employees/EmployeeQuickView";
import { Plus, User } from "lucide-react";

export default function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Fetch employees with React Query
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch today's attendance with React Query
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return getAttendanceList({ start_date: today });
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const employees = employeesData?.results || employeesData || [];
  const attendanceRecords = attendanceData?.results || attendanceData || [];

  // Debug: Log attendance data to verify it's being fetched
  console.log('Attendance Records:', attendanceRecords);
  console.log('Employees:', employees.map(e => ({ id: e.id, email: e.email })));

  const getEmployeeStatus = (employeeId) => {
    // Find attendance record for this employee today
    const attendance = attendanceRecords.find(att => {
      if (att.user !== employeeId) return false;

      // Check if attendance is from today
      const attendanceDate = new Date(att.punch_in).toDateString();
      const todayDate = new Date().toDateString();

      return attendanceDate === todayDate;
    });

    console.log(`Employee ${employeeId} attendance:`, attendance);

    if (!attendance) {
      return {
        status: 'not_punched_in',
        label: 'Not Punched In',
        color: 'gray',
        punchIn: null,
        punchOut: null,
        duration: null
      };
    }

    // Calculate duration if punched out
    let duration = null;
    if (attendance.punch_out) {
      const punchInTime = new Date(attendance.punch_in);
      const punchOutTime = new Date(attendance.punch_out);
      const durationMs = punchOutTime - punchInTime;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      duration = `${hours}h ${minutes}m`;
    }

    // Format times
    const formatTime = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    };

    if (attendance.punch_out) {
      return {
        status: 'punched_out',
        label: 'Punched Out',
        color: 'red',
        punchIn: formatTime(attendance.punch_in),
        punchOut: formatTime(attendance.punch_out),
        duration: duration
      };
    }

    if (attendance.status === 'on_break') {
      return {
        status: 'on_break',
        label: 'On Break',
        color: 'orange',
        punchIn: formatTime(attendance.punch_in),
        punchOut: null,
        duration: null
      };
    }

    return {
      status: 'punched_in',
      label: 'Active',
      color: 'green',
      punchIn: formatTime(attendance.punch_in),
      punchOut: null,
      duration: null
    };
  };

  const handleEmployeeClick = (employeeId) => {
    setSelectedEmployeeId(employeeId);
  };

  const isAdmin = user?.is_superuser || user?.is_staff;

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Access denied</p>
        </div>
      </PageLayout>
    );
  }

  if (employeesLoading || attendanceLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <p className="text-gray-600">Manage and monitor your team</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee Cards Grid */}
      <Section title={`Employees (${employees.length})`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => {
            const employeeStatus = getEmployeeStatus(employee.id);

            return (
              <EnhancedEmployeeCard
                key={employee.id}
                employee={employee}
                workingStatus={employeeStatus}
                onCardClick={handleEmployeeClick}
              />
            );
          })}
        </div>

        {employees.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No employees yet</p>
            <p className="text-sm">Add your first employee to get started</p>
          </div>
        )}
      </Section>

      {/* Quick View Modal */}
      <EmployeeQuickView
        employeeId={selectedEmployeeId}
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
      />

      {/* Create Employee Modal */}
      {showCreateModal && (
        <CreateEmployeeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(["employees"]);
            queryClient.invalidateQueries(["attendance-today"]);
          }}
        />
      )}
    </PageLayout>
  );
}
