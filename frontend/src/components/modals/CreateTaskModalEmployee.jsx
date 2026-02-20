import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createTask } from "../../features/tasks/api/taskApi";
import { useAuth } from "../../features/auth/AuthContext";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Input from "../ui/form/Input";
import Textarea from "../ui/form/Textarea";
import Button from "../ui/Button";
import InlinePrioritySelector from "../tasks/InlinePrioritySelector";
import EmbeddedCalendar from "../tasks/EmbeddedCalendar";

export default function CreateTaskModalEmployee({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      toast.success("Task created successfully!");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to create task");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Auto-assign to current user
    const taskData = {
      ...formData,
      assigned_to: user.id
      // Status will default to 'assigned' on backend
    };
    
    createTaskMutation.mutate(taskData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrioritySelect = (priority) => {
    setFormData(prev => ({
      ...prev,
      priority: priority
    }));
  };

  const handleDateTimeSelect = (dateTime) => {
    setFormData(prev => ({
      ...prev,
      deadline: dateTime
    }));
  };

  return (
    <Modal onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter task title"
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter task description"
          rows={4}
        />

        <InlinePrioritySelector
          selectedPriority={formData.priority}
          onSelect={handlePrioritySelect}
          label="Priority"
        />

        <EmbeddedCalendar
          selectedDateTime={formData.deadline}
          onSelect={handleDateTimeSelect}
          label="Deadline (Optional)"
        />

        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
          <p>📌 This task will be assigned to you automatically</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
