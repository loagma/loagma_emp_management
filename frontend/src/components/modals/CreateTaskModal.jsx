import { useState } from "react";
import { createTask } from "../../features/tasks/api/taskApi";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Input from "../ui/form/Input";
import Textarea from "../ui/form/Textarea";
import Button from "../ui/Button";
import InlineEmployeeSelector from "../tasks/InlineEmployeeSelector";
import InlinePrioritySelector from "../tasks/InlinePrioritySelector";
import EmbeddedCalendar from "../tasks/EmbeddedCalendar";

export default function CreateTaskModal({ onClose, onSuccess, employees }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    deadline: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmployeeSelect = (employeeId) => {
    setFormData((prev) => ({
      ...prev,
      assigned_to: employeeId.toString(),
    }));
  };

  const handlePrioritySelect = (priority) => {
    setFormData((prev) => ({
      ...prev,
      priority: priority,
    }));
  };

  const handleDateTimeSelect = (dateTime) => {
    setFormData((prev) => ({
      ...prev,
      deadline: dateTime,
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
        department: selectedEmployee?.department || null,
        priority: formData.priority,
      };

      // Only add deadline if provided
      if (formData.deadline) {
        taskData.deadline = new Date(formData.deadline).toISOString();
      }

      console.log("Sending task data:", taskData); // Debug log
      console.log("Task data JSON:", JSON.stringify(taskData, null, 2)); // Debug log

      const response = await createTask(taskData);
      console.log("Success response:", response); // Debug log
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        deadline: "",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to create task:", error);
      console.error("Error response:", error.response?.data); // Debug log
      console.error("Error status:", error.response?.status); // Debug log
      console.error("Full error:", JSON.stringify(error.response?.data, null, 2)); // Debug log
      
      // Show specific error message if available
      let errorMessage = "Failed to create task";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Check for field-specific errors
        if (errorData.assigned_to) {
          errorMessage = `Assigned To: ${errorData.assigned_to[0]}`;
        } else if (errorData.department) {
          errorMessage = `Department: ${errorData.department[0]}`;
        } else if (errorData.title) {
          errorMessage = `Title: ${errorData.title[0]}`;
        } else if (errorData.deadline) {
          errorMessage = `Deadline: ${errorData.deadline[0]}`;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else {
          // Show all errors
          errorMessage = JSON.stringify(errorData);
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Create New Task">
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

        <InlineEmployeeSelector
          employees={employees}
          selectedEmployeeId={formData.assigned_to ? parseInt(formData.assigned_to) : null}
          onSelect={handleEmployeeSelect}
          label="Assign To"
          required
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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
