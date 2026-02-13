import { useState, useEffect } from "react";
import { updateTask } from "../../features/tasks/api/taskApi";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Input from "../ui/form/Input";
import Select from "../ui/form/Select";
import Textarea from "../ui/form/Textarea";
import Button from "../ui/Button";

export default function EditTaskModal({ onClose, onSuccess, task, employees }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: "assigned",
    deadline: "",
  });

  // Populate form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assigned_to: task.assigned_to || "",
        priority: task.priority || "medium",
        status: task.status || "assigned",
        deadline: task.deadline ? formatDateForInput(task.deadline) : "",
      });
    }
  }, [task]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!formData.assigned_to) {
      toast.error("Please assign the task to someone");
      return;
    }

    try {
      setLoading(true);

      // Find the selected employee to get their department
      const selectedEmployee = employees.find(
        (emp) => emp.id === parseInt(formData.assigned_to)
      );

      // Format data for API
      const taskData = {
        title: formData.title,
        description: formData.description || "",
        assigned_to: parseInt(formData.assigned_to),
        department: selectedEmployee?.department || task.department,
        priority: formData.priority,
        status: formData.status,
      };

      // Only add deadline if provided
      if (formData.deadline) {
        taskData.deadline = new Date(formData.deadline).toISOString();
      }

      await updateTask(task.id, taskData);
      toast.success("Task updated successfully!");
      onSuccess();
    } catch (error) {
      console.error("Failed to update task:", error);

      let errorMessage = "Failed to update task";
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.assigned_to) {
          errorMessage = `Assigned To: ${errorData.assigned_to[0]}`;
        } else if (errorData.department) {
          errorMessage = `Department: ${errorData.department[0]}`;
        } else if (errorData.title) {
          errorMessage = `Title: ${errorData.title[0]}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Edit Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
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
          rows={3}
        />

        <Select
          label="Assign To"
          name="assigned_to"
          value={formData.assigned_to}
          onChange={handleChange}
          required
        >
          <option value="">Select employee</option>
          {employees?.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.username} - {employee.role_display}
            </option>
          ))}
        </Select>

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
        </Select>

        <Select
          label="Priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>

        <Input
          label="Deadline"
          name="deadline"
          type="datetime-local"
          value={formData.deadline}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
