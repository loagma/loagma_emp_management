import StatusBadge from "../../components/ui/StatusBadge";
import { Pencil, Trash2 } from "lucide-react";

export default function TaskRow({ task, onDelete, onStatusChange, onEdit }) {
  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleStatusClick = () => {
    const statuses = ["assigned", "in_progress", "completed", "delayed"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange(task.id, nextStatus);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "text-gray-600",
      medium: "text-blue-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };
    return colors[priority] || "text-gray-600";
  };

  return (
    <tr className="border-b hover:bg-gray-50 transition">
      <td className="py-4 font-medium">
        <div>
          <p>{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </td>

      <td>
        <div>
          <p>{task.assigned_to_user?.username || "Unassigned"}</p>
          <p className="text-xs text-gray-500">
            {task.assigned_to_user?.role_display}
          </p>
        </div>
      </td>

      <td>
        <div onClick={handleStatusClick} className="cursor-pointer" title="Click to change status">
          <StatusBadge status={task.status} />
        </div>
      </td>

      <td>
        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority_display || task.priority}
        </span>
      </td>

      <td>
        <div>
          <p>{formatDate(task.deadline)}</p>
          {task.is_overdue && (
            <p className="text-xs text-red-600">Overdue</p>
          )}
        </div>
      </td>

      <td>
        <div className="flex gap-3 text-gray-400">
          <Pencil
            size={16}
            className="cursor-pointer hover:text-blue-600 transition"
            onClick={() => onEdit(task)}
            title="Edit task"
          />
          <Trash2
            size={16}
            className="cursor-pointer hover:text-red-600 transition"
            onClick={() => onDelete(task.id)}
            title="Delete task"
          />
        </div>
      </td>
    </tr>
  );
}
