import { useState, useEffect } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { fetchTasks } from "../features/tasks/api/taskApi";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import DashboardGrid from "../components/ui/DashboardGrid";
import DashboardSectionCard from "../components/ui/DashboardSectionCard";
import MetricCard from "../components/cards/MetricCard";
import StatusBadge from "../components/ui/StatusBadge";
import Skeleton from "../components/ui/Skeleton";

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      // Fetch tasks assigned to current user
      const tasksData = await fetchTasks({ assigned_to: user.id });
      const taskList = tasksData.results || tasksData;
      setTasks(taskList);

      // Calculate stats
      const total = taskList.length;
      const completed = taskList.filter((t) => t.status === "completed").length;
      const pending = taskList.filter(
        (t) => t.status === "assigned" || t.status === "in_progress"
      ).length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      setStats({ total, completed, pending, completionRate });
    } catch (error) {
      console.error("Failed to load employee data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Employee Header */}
      <DashboardSectionCard title="Employee Profile">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-lg font-semibold">{user?.username}</h3>
            <p className="text-sm text-gray-500">{user?.role_display}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <div className="ml-auto text-right">
            <p className="text-sm text-gray-500">Organization</p>
            <p className="font-semibold">{user?.organization_name}</p>
            <p className="text-sm text-gray-500 mt-1">Department</p>
            <p className="font-semibold">{user?.department_name}</p>
          </div>
        </div>
      </DashboardSectionCard>

      {/* Performance Metrics */}
      <Section title="Performance Overview">
        <DashboardGrid cols={4}>
          <MetricCard
            title="Completion Rate"
            value={`${stats.completionRate.toFixed(1)}%`}
          />
          <MetricCard title="Tasks Completed" value={stats.completed} />
          <MetricCard title="Pending Tasks" value={stats.pending} />
          <MetricCard title="Total Tasks" value={stats.total} />
        </DashboardGrid>
      </Section>

      {/* Charts + Activity */}
      <DashboardGrid cols={3}>
        <DashboardSectionCard
          title="Task Distribution"
          className="lg:col-span-2"
        >
          <div className="h-[260px] bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-4 gap-4 h-full">
              <div className="flex flex-col items-center justify-center bg-blue-100 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {tasks.filter((t) => t.status === "assigned").length}
                </p>
                <p className="text-sm text-gray-600 mt-2">Assigned</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-yellow-100 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </p>
                <p className="text-sm text-gray-600 mt-2">In Progress</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-green-100 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {tasks.filter((t) => t.status === "completed").length}
                </p>
                <p className="text-sm text-gray-600 mt-2">Completed</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-red-100 rounded-lg">
                <p className="text-3xl font-bold text-red-600">
                  {tasks.filter((t) => t.status === "delayed").length}
                </p>
                <p className="text-sm text-gray-600 mt-2">Delayed</p>
              </div>
            </div>
          </div>
        </DashboardSectionCard>

        <DashboardSectionCard title="Recent Activity">
          <ul className="text-sm space-y-3">
            {tasks.slice(0, 5).map((task, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {task.status_display} - {formatDate(task.updated_at)}
                  </p>
                </div>
              </li>
            ))}
            {tasks.length === 0 && (
              <li className="text-gray-500 text-center py-4">
                No recent activity
              </li>
            )}
          </ul>
        </DashboardSectionCard>
      </DashboardGrid>

      {/* Task History */}
      <DashboardSectionCard title="Task History">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks assigned yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr className="border-b text-left">
                  <th className="py-3">Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          task.priority === "critical"
                            ? "bg-red-100 text-red-600"
                            : task.priority === "high"
                            ? "bg-orange-100 text-orange-600"
                            : task.priority === "medium"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.priority_display}
                      </span>
                    </td>

                    <td>
                      <StatusBadge status={task.status} />
                    </td>

                    <td>{formatDate(task.deadline)}</td>

                    <td className="text-gray-500">
                      {formatDate(task.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSectionCard>
    </PageLayout>
  );
}
