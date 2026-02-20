import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, partialUpdateTask, pauseTask, resumeTask } from "../features/tasks/api/taskApi";
import { useAuth } from "../features/auth/AuthContext";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import Button from "../components/ui/Button";
import StatusBadge from "../components/ui/StatusBadge";
import CreateTaskModalEmployee from "../components/modals/CreateTaskModalEmployee";
import { Plus, Bell, AlertCircle, CheckCircle2, Clock, Pause, Play } from "lucide-react";

const STATUS_FLOW = {
  'assigned': 'in_progress',
  'in_progress': 'completed',
  'paused': 'in_progress', // Can resume from paused
  'completed': null // Cannot move forward from completed
};

const STATUS_LABELS = {
  'assigned': 'Assigned',
  'in_progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed'
};

export default function EmployeeTasksPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch tasks assigned to this employee
  const { data, isLoading } = useQuery({
    queryKey: ["employee-tasks"],
    queryFn: () => fetchTasks({ assigned_to: user?.id }),
  });

  const tasks = data?.results || [];

  // Check for notifications
  useEffect(() => {
    if (tasks.length > 0) {
      const newNotifications = [];
      const now = new Date();

      tasks.forEach(task => {
        // Check for overdue tasks (but not paused ones)
        if (task.deadline && task.status !== 'completed' && !task.is_paused) {
          const dueDate = new Date(task.deadline);
          if (dueDate < now) {
            newNotifications.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              message: `Task "${task.title}" is overdue`,
              taskId: task.id
            });
          }
        }

        // Check for newly assigned tasks (created in last 24 hours)
        const createdAt = new Date(task.created_at);
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
        if (hoursSinceCreated < 24 && task.status === 'assigned') {
          newNotifications.push({
            id: `new-${task.id}`,
            type: 'new',
            message: `New task assigned: "${task.title}"`,
            taskId: task.id
          });
        }
      });

      setNotifications(newNotifications);
    }
  }, [tasks]);

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => partialUpdateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Task updated successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
    },
  });

  // Pause task mutation
  const pauseTaskMutation = useMutation({
    mutationFn: (id) => pauseTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Task paused successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to pause task");
    },
  });

  // Resume task mutation
  const resumeTaskMutation = useMutation({
    mutationFn: (id) => resumeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Task resumed successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to resume task");
    },
  });

  const handleStatusChange = (task, newStatus) => {
    const currentStatus = task.status;
    const allowedNextStatus = STATUS_FLOW[currentStatus];

    // Check if trying to move backward (except for resume from paused)
    if (newStatus !== allowedNextStatus && !(currentStatus === 'paused' && newStatus === 'in_progress')) {
      toast.error("You can only move tasks forward in status. Contact admin to move backward.", {
        duration: 4000,
        icon: '⚠️'
      });
      return;
    }

    // Update task status
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: newStatus }
    });
  };

  const handlePauseToggle = (task) => {
    if (task.is_paused) {
      resumeTaskMutation.mutate(task.id);
    } else {
      pauseTaskMutation.mutate(task.id);
    }
  };

  const getNextStatus = (currentStatus) => {
    return STATUS_FLOW[currentStatus];
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (deadline, status, isPaused) => {
    if (!deadline || status === 'completed' || isPaused) return false;
    return new Date(deadline) < new Date();
  };

  // Get card background color based on status
  const getCardBackgroundClass = (task) => {
    if (isOverdue(task.deadline, task.status, task.is_paused)) {
      return 'bg-red-50 border-red-200';
    }
    
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-200';
      case 'paused':
        return 'bg-gray-50 border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600">Manage your assigned tasks</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <Section title="Notifications">
          <div className="bg-white rounded-lg shadow p-4 space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  notif.type === 'overdue' 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <Bell className={`w-5 h-5 ${
                  notif.type === 'overdue' ? 'text-red-600' : 'text-blue-600'
                }`} />
                <p className={`flex-1 ${
                  notif.type === 'overdue' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {notif.message}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tasks List */}
      <Section title="Tasks">
        <div className="bg-white rounded-lg shadow">
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No tasks assigned yet</p>
              <p className="text-sm mt-2">Create a task for yourself or wait for admin to assign tasks</p>
            </div>
          ) : (
            <div className="divide-y">
              {tasks.map(task => {
                const nextStatus = getNextStatus(task.status);
                const overdue = isOverdue(task.deadline, task.status, task.is_paused);
                const canPauseResume = task.status === 'in_progress' || task.is_paused;

                return (
                  <div
                    key={task.id}
                    className={`p-4 transition border-l-4 ${getCardBackgroundClass(task)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Task Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${task.is_paused ? 'text-gray-500' : 'text-gray-800'}`}>
                            {task.title}
                          </h3>
                          {overdue && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              OVERDUE
                            </span>
                          )}
                          {task.is_paused && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                              ⏸ PAUSED
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className={`text-sm mb-3 ${task.is_paused ? 'text-gray-500' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {/* Status */}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            <StatusBadge status={task.status} />
                          </div>

                          {/* Priority */}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority?.toUpperCase() || 'NORMAL'}
                          </span>

                          {/* Due Date */}
                          {task.deadline && (
                            <span className="text-gray-600">
                              Due: {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                          
                          {/* Remaining time for paused tasks */}
                          {task.is_paused && task.remaining_time && (
                            <span className="text-orange-600 text-xs">
                              Time saved
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {/* Pause/Resume Button */}
                        {canPauseResume && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePauseToggle(task)}
                            disabled={pauseTaskMutation.isPending || resumeTaskMutation.isPending}
                            className={task.is_paused ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}
                          >
                            {task.is_paused ? (
                              <>
                                <Play className="w-4 h-4 mr-1" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Pause className="w-4 h-4 mr-1" />
                                Pause
                              </>
                            )}
                          </Button>
                        )}
                        
                        {/* Status Change Button */}
                        {nextStatus && !task.is_paused && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(task, nextStatus)}
                            disabled={updateTaskMutation.isPending}
                          >
                            Move to {STATUS_LABELS[nextStatus]}
                          </Button>
                        )}
                        
                        {task.status === 'completed' && (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModalEmployee
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries(["employee-tasks"]);
          }}
        />
      )}
    </PageLayout>
  );
}
