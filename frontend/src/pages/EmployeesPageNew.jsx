import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEmployees } from "../features/employees/api/employeeApi";
import { getAttendanceList } from "../features/attendance/api/attendanceApi";
import { useAuth } from "../features/auth/AuthContext";
import toast from "react-hot-toast";
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
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  const employees = employeesData?.results || employeesData || [];
  const attendanceRecords = attendanceData?.results || attendanceData || [];

  const getEmployeeStatus = (employeeId) => {
    // Find attendance record for this employee today
    const attendance = attendanceRecords.find(
      att => att.user === employeeId && !att.punch_out
    );
    
    if (!attendance) {
      return { status: 'not_active', label: 'Not Punched In', color: 'gray' };
    }
    
    if (attendance.status === 'on_break') {
      return { status: 'on_break', label: 'On Break', color: 'orange' };
    }
    
    return { status: 'punched_in', label: 'Punched In', color: 'green' };
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
                  {employeeStatus.status === 'not_active' && (
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

                {/* Status */}
                <div className="pt-4 border-t">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    employee.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {employee.is_active ? 'Active' : 'Inactive'}
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
