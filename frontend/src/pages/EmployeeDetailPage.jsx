import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEmployees, toggleEmployeeActive, downloadMonthlyReport } from "../features/employees/api/employeeApi";
import { fetchTasks } from "../features/tasks/api/taskApi";
import { getAttendanceList } from "../features/attendance/api/attendanceApi";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import {
  ArrowLeft, User, Mail, Briefcase, Calendar, Clock,
  CheckCircle, AlertCircle, TrendingUp, Activity, Coffee, Download, Power
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [timeFilter, setTimeFilter] = useState('week'); // week, month, all
  const [taskFilter, setTaskFilter] = useState('all'); // all, assigned, in_progress, completed
  const [isToggling, setIsToggling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle toggle active status
  const handleToggleActive = async () => {
    if (!employee) return;

    const action = employee.is_active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this employee?`)) return;

    setIsToggling(true);
    try {
      const response = await toggleEmployeeActive(id);
      toast.success(response.message || `Employee ${action}d successfully`);

      // Invalidate and refetch employee data
      queryClient.invalidateQueries(["employees"]);

      // Force reload to show updated status
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to toggle employee status:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} employee`);
      setIsToggling(false);
    }
  };

  // Handle download monthly report
  const handleDownloadReport = async () => {
    if (!employee) return;

    setIsDownloading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const blob = await downloadMonthlyReport(id, year, month);

      // Check if response is actually a blob (PDF) or JSON error
      if (blob.type === 'application/json') {
        // Error response
        const text = await blob.text();
        const error = JSON.parse(text);
        console.error('Server error:', error);
        throw new Error(error.error || 'Failed to generate report');
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${employee.username}_report_${year}_${month.toString().padStart(2, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Failed to download report:', error);

      // Try to get detailed error from response
      let errorMessage = 'Failed to download report';
      if (error.response?.data) {
        if (error.response.data instanceof Blob) {
          try {
            const text = await error.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.error || errorMessage;
            console.error('Detailed error:', errorData);
          } catch (e) {
            // Could not parse error
          }
        } else if (typeof error.response.data === 'object') {
          errorMessage = error.response.data.error || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch employee data
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  const employee = employeesData?.results?.find(emp => emp.id === parseInt(id));

  // Fetch employee tasks
  const { data: tasksData } = useQuery({
    queryKey: ["employee-tasks", id],
    queryFn: () => fetchTasks({ assigned_to: id }),
    enabled: !!id,
  });

  const tasks = tasksData?.results || [];

  // Fetch attendance records
  const { data: attendanceData } = useQuery({
    queryKey: ["employee-attendance", id, timeFilter],
    queryFn: () => {
      const params = {};
      const now = new Date();

      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.start_date = weekAgo.toISOString().split('T')[0];
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.start_date = monthAgo.toISOString().split('T')[0];
      }

      return getAttendanceList(params);
    },
    enabled: !!id,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  const attendanceRecords = (attendanceData?.results || []).filter(
    record => record.user === parseInt(id)
  );

  // Get today's attendance
  const todayAttendance = attendanceRecords.find(record => {
    const recordDate = new Date(record.punch_in).toDateString();
    const today = new Date().toDateString();
    return recordDate === today;
  });

  // Calculate statistics
  const taskStats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    completion_rate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0
  };

  // Calculate attendance statistics
  const attendanceStats = {
    total_days: attendanceRecords.length,
    total_hours: attendanceRecords.reduce((sum, record) => {
      if (record.total_work_time) {
        const [hours, minutes] = record.total_work_time.split(':');
        return sum + parseInt(hours) + parseInt(minutes) / 60;
      }
      return sum;
    }, 0),
    avg_hours: 0
  };

  attendanceStats.avg_hours = attendanceRecords.length > 0
    ? (attendanceStats.total_hours / attendanceRecords.length).toFixed(1)
    : 0;

  // Prepare chart data
  const chartData = attendanceRecords.slice(0, 7).reverse().map(record => {
    const date = new Date(record.punch_in);
    const workHours = record.total_work_time
      ? parseInt(record.total_work_time.split(':')[0]) + parseInt(record.total_work_time.split(':')[1]) / 60
      : 0;

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: parseFloat(workHours.toFixed(1))
    };
  });

  // Build today's activity log
  const buildActivityLog = () => {
    if (!todayAttendance) return [];

    const log = [];

    if (todayAttendance.punch_in) {
      log.push({
        time: new Date(todayAttendance.punch_in),
        action: 'Punched In',
        icon: 'login',
        color: 'text-green-600'
      });
    }

    if (todayAttendance.breaks) {
      todayAttendance.breaks.forEach(brk => {
        log.push({
          time: new Date(brk.start_time),
          action: 'Break Started',
          icon: 'coffee',
          color: 'text-orange-600'
        });

        if (brk.end_time) {
          log.push({
            time: new Date(brk.end_time),
            action: 'Break Ended',
            icon: 'activity',
            color: 'text-blue-600'
          });
        }
      });
    }

    if (todayAttendance.punch_out) {
      log.push({
        time: new Date(todayAttendance.punch_out),
        action: 'Punched Out',
        icon: 'logout',
        color: 'text-red-600'
      });
    }

    return log.sort((a, b) => a.time - b.time);
  };

  const activityLog = buildActivityLog();

  // Filter tasks
  const filteredTasks = taskFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === taskFilter);

  if (!employee) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Employee not found</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/employees')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Employees
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {employee.first_name} {employee.last_name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="capitalize">{employee.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Punch Status Badge */}
            <div>
              {todayAttendance && !todayAttendance.punch_out ? (
                todayAttendance.status === 'on_break' ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium">
                    <Coffee className="w-5 h-5" />
                    On Break
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium">
                    <CheckCircle className="w-5 h-5" />
                    Punched In
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium">
                  <Clock className="w-5 h-5" />
                  Not Punched In
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download Monthly Report'}
            </Button>

            <Button
              onClick={handleToggleActive}
              disabled={isToggling}
              variant={employee.is_active ? 'danger' : 'success'}
              className="flex-1"
            >
              <Power className="w-4 h-4 mr-2" />
              {isToggling ? 'Processing...' : (employee.is_active ? 'Deactivate Employee' : 'Activate Employee')}
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{taskStats.total}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-blue-600">{taskStats.completion_rate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Hours/Day</p>
              <p className="text-2xl font-bold text-purple-600">{attendanceStats.avg_hours}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <Section title="Work Hours Performance">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-end mb-4">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#3b82f6" name="Work Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* Today's Activity Log */}
      {activityLog.length > 0 && (
        <Section title="Today's Activity">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              {activityLog.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <Activity className={`w-5 h-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{activity.action}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {activity.time.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Tasks Section */}
      <Section title="Tasks">
        <div className="bg-white rounded-lg shadow">
          {/* Task Filters */}
          <div className="p-4 border-b flex gap-2">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-4 py-2 rounded ${taskFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              All ({taskStats.total})
            </button>
            <button
              onClick={() => setTaskFilter('assigned')}
              className={`px-4 py-2 rounded ${taskFilter === 'assigned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Assigned ({taskStats.assigned})
            </button>
            <button
              onClick={() => setTaskFilter('in_progress')}
              className={`px-4 py-2 rounded ${taskFilter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              In Progress ({taskStats.in_progress})
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-4 py-2 rounded ${taskFilter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
                }`}
            >
              Completed ({taskStats.completed})
            </button>
          </div>

          {/* Task List */}
          <div className="divide-y">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tasks found
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <StatusBadge status={task.status} />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                          {task.priority?.toUpperCase()}
                        </span>
                        {task.deadline && (
                          <span className="text-gray-600">
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}
