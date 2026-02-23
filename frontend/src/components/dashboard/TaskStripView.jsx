import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTaskStatus, updateTaskPriority, pauseTask, resumeTask } from "../../features/tasks/api/taskApi";
import toast from "react-hot-toast";
import TaskRow from "./TaskRow";
import PauseTaskModal from "../modals/PauseTaskModal";
import EditTaskModalEmployee from "../modals/EditTaskModalEmployee";
import { ListTodo } from "lucide-react";

/**
 * TaskStripView - Flat list of horizontal task rows
 * Matches reference layout exactly
 */
export default function TaskStripView({ tasks, isLoading, onTaskUpdate }) {
  const queryClient = useQueryClient();
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [taskToPause, setTaskToPause] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Status updated successfully!");
      if (onTaskUpdate) onTaskUpdate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update status");
    },
  });

  // Update task priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: ({ id, priority }) => updateTaskPriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Priority updated successfully!");
      if (onTaskUpdate) onTaskUpdate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update priority");
    },
  });

  // Pause task mutation
  const pauseTaskMutation = useMutation({
    mutationFn: ({ id, reason }) => pauseTask(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(["employee-tasks"]);
      toast.success("Task paused successfully!");
      if (onTaskUpdate) onTaskUpdate();
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
      if (onTaskUpdate) onTaskUpdate();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to resume task");
    },
  });

  const handleStatusChange = (task, newStatus) => {
    updateStatusMutation.mutate({ id: task.id, status: newStatus });
  };

  const handlePriorityChange = (task, newPriority) => {
    updatePriorityMutation.mutate({ id: task.id, priority: newPriority });
  };

  const handlePauseToggle = (task) => {
    if (task.is_paused) {
      resumeTaskMutation.mutate(task.id);
    } else {
      setTaskToPause(task);
      setPauseModalOpen(true);
    }
  };

  const handlePauseConfirm = async (reason) => {
    if (taskToPause) {
      await pauseTaskMutation.mutateAsync({ id: taskToPause.id, reason });
    }
  };

  const handleEdit = (task) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Task Rows - Fixed Height with Scroll */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No tasks assigned yet</p>
          <p className="text-sm mt-2">Your tasks will appear here when assigned</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
          <div className="space-y-2 pb-2">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onStatusChange={(newStatus) => handleStatusChange(task, newStatus)}
                onPriorityChange={(newPriority) => handlePriorityChange(task, newPriority)}
                onPauseToggle={() => handlePauseToggle(task)}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pause Task Modal */}
      <PauseTaskModal
        isOpen={pauseModalOpen}
        onClose={() => {
          setPauseModalOpen(false);
          setTaskToPause(null);
        }}
        onConfirm={handlePauseConfirm}
        taskTitle={taskToPause?.title || ""}
      />

      {/* Edit Task Modal */}
      <EditTaskModalEmployee
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setTaskToEdit(null);
        }}
        task={taskToEdit}
        onSuccess={onTaskUpdate}
      />
    </div>
  );
}
