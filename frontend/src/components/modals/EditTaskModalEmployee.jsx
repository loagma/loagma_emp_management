import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { partialUpdateTask } from "../../features/tasks/api/taskApi";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Input from "../ui/form/Input";
import Textarea from "../ui/form/Textarea";
import Button from "../ui/Button";
import InlinePrioritySelector from "../tasks/InlinePrioritySelector";
import EmbeddedCalendar from "../tasks/EmbeddedCalendar";

export default function EditTaskModalEmployee({ isOpen, onClose, task, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        deadline: task.deadline || "",
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => partialUpdateTask(id, data),
    onSuccess: () => {
      toast.success("Task updated successfully!");
      onClose();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update task");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!task) return;
    
    updateTaskMutation.mutate({
      id: task.id,
      data: formData
    });
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

  if (!isOpen || !task) return null;

  return (
    <Modal onClose={onClose} title="Edit Task">
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
            disabled={updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
