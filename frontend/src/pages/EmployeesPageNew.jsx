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
import { Plus, User, CheckCircle, Clock, Mail, Briefcase, Coffee } from "lucide-react";

export default function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    navigate(`/employees/${employeeId}`);
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
              <div
                key={employee.id}
                onClick={() => handleEmployeeClick(employee.id)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer p-6 border-2 border-transparent hover:border-blue-500"
              >
                {/* Punch Status Badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  {employeeStatus.status === 'punched_in' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {employeeStatus.label}
                    </span>
                  )}
                  {employeeStatus.status === 'on_break' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      <Coffee className="w-4 h-4" />
                      {employeeStatus.label}
                    </span>
                  )}
                  {employeeStatus.status === 'punched_out' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Inactive
                    </span>
                  )}
                  {employeeStatus.status === 'not_punched_in' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      {employeeStatus.label}
                    </span>
                  )}
                </div>

                {/* Employee Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span className="capitalize">{employee.role}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Details */}
                {employeeStatus.punchIn && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Punch In:</span>
                        <span className="font-medium text-gray-800">{employeeStatus.punchIn}</span>
                      </div>
                      {employeeStatus.punchOut && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Punch Out:</span>
                            <span className="font-medium text-gray-800">{employeeStatus.punchOut}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium text-blue-600">{employeeStatus.duration}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Status */}
                <div className="pt-4 border-t">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${employeeStatus.status === 'punched_in' ? 'bg-green-100 text-green-700' :
                    employeeStatus.status === 'on_break' ? 'bg-orange-100 text-orange-700' :
                      employeeStatus.status === 'punched_out' ? 'bg-gray-100 text-gray-700' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                    {employeeStatus.status === 'punched_in' ? '● Working' :
                      employeeStatus.status === 'on_break' ? '● On Break' :
                        employeeStatus.status === 'punched_out' ? '● Day Complete' :
                          '● Not Started'}
                  </span>
                </div>
              </div>
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
