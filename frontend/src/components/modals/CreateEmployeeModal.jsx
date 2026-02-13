import { useState, useEffect } from "react";
import { createEmployee } from "../../features/employees/api/employeeApi";
import { fetchDepartments } from "../../features/departments/api/departmentApi";
import toast from "react-hot-toast";
import Modal from "./Modal";
import Input from "../ui/form/Input";
import Select from "../ui/form/Select";
import Button from "../ui/Button";

export default function CreateEmployeeModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    department: "",
  });

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      // For now, we'll use a simple list. You can create a departments API later
      setDepartments([
        { id: 1, name: "Sales" },
        { id: 2, name: "Marketing" },
        { id: 3, name: "Engineering" },
      ]);
    } catch (error) {
      console.error("Failed to load departments:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createEmployee(formData);
      toast.success("Employee created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Failed to create employee:", error);
      toast.error(
        error.response?.data?.detail ||
          error.response?.data?.username?.[0] ||
          error.response?.data?.email?.[0] ||
          "Failed to create employee"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Create New Employee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter username"
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter password (min 8 characters)"
          required
          minLength={8}
        />

        <Input
          label="First Name"
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder="Enter first name"
        />

        <Input
          label="Last Name"
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder="Enter last name"
        />

        <Select
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Employee"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
