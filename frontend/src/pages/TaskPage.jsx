import { useState, useEffect } from "react";
import { fetchTasks, deleteTask, updateTaskStatus } from "../features/tasks/api/taskApi";
import { fetchEmployees } from "../features/employees/api/employeeApi";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import DashboardSectionCard from "../components/ui/DashboardSectionCard";
import Button from "../components/ui/Button";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import EditTaskModal from "../components/modals/EditTaskModal";
import TaskRow from "../features/tasks/TaskRow";
import Skeleton from "../components/ui/Skeleton";

export default function TaskPage() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;

      const [tasksData, employeesData] = await Promise.all([
        fetchTasks(params),
        fetchEmployees(),
      ]);

      setTasks(tasksData.results || tasksData);
      setEmployees(employeesData.results || employeesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setOpenCreateModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setOpenEditModal(true);
  };

  const handleTaskCreated = () => {
    setOpenCreateModal(false);
    loadData();
    toast.success("Task created successfully!");
  };

  const handleTaskUpdated = () => {
    setOpenEditModal(false);
    setSelectedTask(null);
    loadData();
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
      loadData();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      toast.success("Status updated successfully");
      loadData();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleTaskUpdate = () => {
    loadData(); // Refresh the task list
  };

  const handleSearch = () => {
    loadData();
  };

  const filteredTasks = searchQuery
    ? tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  return (
    <PageLayout>
      <DashboardSectionCard
        title="Task Management"
        rightContent={
          <Button onClick={handleCreateTask}>Create Task</Button>
        }
      >
        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          {/* Search */}
          <div className="flex gap-2">
            <input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="px-4 py-2 border rounded-lg text-sm w-[280px]"
            />
            <Button variant="secondary" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <Button
              variant={statusFilter === "" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "assigned" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("assigned")}
            >
              Assigned
            </Button>
            <Button
              variant={statusFilter === "in_progress" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("in_progress")}
            >
              In Progress
            </Button>
            <Button
              variant={statusFilter === "paused" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("paused")}
            >
              Paused
            </Button>
            <Button
              variant={statusFilter === "completed" ? "primary" : "secondary"}
              onClick={() => setStatusFilter("completed")}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No tasks found</p>
              <p className="text-sm mt-2">Create your first task to get started</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr className="text-left border-b">
                  <th className="py-3 font-medium">Task</th>
                  <th className="font-medium">Assigned To</th>
                  <th className="font-medium">Status</th>
                  <th className="font-medium">Priority</th>
                  <th className="font-medium">Deadline</th>
                  <th className="font-medium">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onTaskUpdate={handleTaskUpdate}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardSectionCard>

      {openCreateModal && (
        <CreateTaskModal
          onClose={() => setOpenCreateModal(false)}
          onSuccess={handleTaskCreated}
          employees={employees}
        />
      )}

      {openEditModal && selectedTask && (
        <EditTaskModal
          onClose={() => {
            setOpenEditModal(false);
            setSelectedTask(null);
          }}
          onSuccess={handleTaskUpdated}
          task={selectedTask}
          employees={employees}
        />
      )}
    </PageLayout>
  );
}
