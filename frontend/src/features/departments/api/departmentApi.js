import api from "../../../app/axios";

// GET /api/departments/ (placeholder - to be implemented)
export const fetchDepartments = async () => {
  // For now, return hardcoded departments
  // TODO: Implement backend API endpoint
  return {
    results: [
      { id: 1, name: "Sales" },
      { id: 2, name: "Marketing" },
      { id: 3, name: "Engineering" },
      { id: 4, name: "HR" },
      { id: 5, name: "Operations" },
    ]
  };
};
