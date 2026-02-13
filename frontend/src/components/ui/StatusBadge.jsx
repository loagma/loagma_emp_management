export default function StatusBadge({ status }) {
  // Map backend status values to display
  const statusMap = {
    assigned: { label: "Assigned", style: "bg-blue-100 text-blue-700" },
    in_progress: { label: "In Progress", style: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Completed", style: "bg-green-100 text-green-700" },
    delayed: { label: "Delayed", style: "bg-red-100 text-red-700" },
    // Legacy support
    pending: { label: "Pending", style: "bg-yellow-100 text-yellow-700" },
    overdue: { label: "Overdue", style: "bg-red-100 text-red-700" },
  };

  const statusKey = status?.toLowerCase().replace(/\s+/g, "_");
  const statusInfo = statusMap[statusKey] || {
    label: status,
    style: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.style}`}>
      {statusInfo.label}
    </span>
  );
}
