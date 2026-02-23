import { Pencil, Pause, Play } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";

const STATUS_FLOW = {
  'assigned': 'in_progress',
  'in_progress': 'completed',
  'paused': 'in_progress',
  'completed': null
};

const STATUS_LABELS = {
  'assigned': 'Assigned',
  'in_progress': 'In Progress',
  'paused': 'Paused',
  'completed': 'Completed'
};

/**
 * TaskRow - Ultra-flat horizontal strip matching reference pixel-perfect
 * Minimal borders, soft colors, tight spacing
 */
export default function TaskRow({ task, onStatusChange, onPriorityChange, onPauseToggle, onEdit }) {
  const nextStatus = STATUS_FLOW[task.status];
  const canPauseResume = task.status === 'in_progress' || task.is_paused;
  
  const isOverdue = (deadline, status, isPaused) => {
    if (!deadline || status === 'completed' || isPaused) return false;
    return new Date(deadline) < new Date();
  };

  const overdue = isOverdue(task.deadline, task.status, task.is_paused);

  // Darker, more visible background colors
  const getRowBackgroundClass = () => {
    if (overdue) {
      return 'bg-red-100';
    }
    
    switch (task.status) {
      case 'completed':
        return 'bg-green-100';
      case 'in_progress':
        return 'bg-green-100';
      case 'paused':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Darker badge colors for better visibility
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'paused':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActionButtonText = () => {
    if (task.status === 'completed') return null;
    if (task.is_paused) return 'Resume';
    if (nextStatus === 'in_progress') return 'In Progress';
    if (nextStatus === 'completed') return 'Complete';
    return STATUS_LABELS[nextStatus];
  };

  const getActionButtonColor = () => {
    if (task.is_paused) return 'bg-green-100 text-green-700 border-green-200';
    if (task.status === 'assigned') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${getRowBackgroundClass()} border-gray-200 hover:border-gray-300`}
    >
      {/* Left: Status Badge */}
      <div className="flex-shrink-0">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {/* Priority Badge */}
      <div className="flex-shrink-0">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(task.priority)}`}>
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1) || 'Medium'}
        </span>
      </div>

      {/* Task Title */}
      <div className="flex-shrink-0 min-w-[180px]">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight">
          {task.title}
        </h3>
      </div>

      {/* Description - Center, flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-600 truncate leading-tight">
          {task.description || 'No description provided'}
        </p>
      </div>

      {/* Right: Action Buttons - Softer chip style */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onEdit && onEdit(task)}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-200 transition-all duration-200"
        >
          Edit
        </button>

        {task.status !== 'completed' && (
          <>
            {canPauseResume && (
              <button
                onClick={() => onPauseToggle(task)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                  task.is_paused 
                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                    : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                }`}
              >
                {task.is_paused ? 'Resume' : 'Pause'}
              </button>
            )}

            {nextStatus && !task.is_paused && (
              <button
                onClick={() => onStatusChange(nextStatus)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border hover:opacity-90 transition-all duration-200 ${getActionButtonColor()}`}
              >
                {getActionButtonText()}
              </button>
            )}

            {!nextStatus && !canPauseResume && (
              <button
                className="px-3 py-1.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-medium cursor-not-allowed"
                disabled
              >
                Need Help
              </button>
            )}
          </>
        )}

        {task.status === 'completed' && (
          <span className="px-3 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-lg text-xs font-medium">
            Completed
          </span>
        )}
      </div>
    </div>
  );
}
