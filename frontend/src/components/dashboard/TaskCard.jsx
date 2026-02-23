import { Pause, Play, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Button from "../ui/Button";
import StatusBadge from "../ui/StatusBadge";
import InlineStatusDropdown from "../tasks/InlineStatusDropdown";
import InlinePriorityDropdown from "../tasks/InlinePriorityDropdown";

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
 * TaskCard - Individual task display with inline actions
 * @param {Object} props
 * @param {Object} props.task - Task data
 * @param {Function} props.onStatusChange - Status change handler
 * @param {Function} props.onPriorityChange - Priority change handler
 * @param {Function} props.onPauseToggle - Pause/resume handler
 */
export default function TaskCard({ task, onStatusChange, onPriorityChange, onPauseToggle }) {
  const nextStatus = STATUS_FLOW[task.status];
  const canPauseResume = task.status === 'in_progress' || task.is_paused;
  
  const isOverdue = (deadline, status, isPaused) => {
    if (!deadline || status === 'completed' || isPaused) return false;
    return new Date(deadline) < new Date();
  };

  const overdue = isOverdue(task.deadline, task.status, task.is_paused);

  const getCardBackgroundClass = () => {
    if (overdue) {
      return 'bg-red-50 border-red-300';
    }
    
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 border-green-300';
      case 'in_progress':
        return 'bg-yellow-50 border-yellow-300';
      case 'paused':
        return 'bg-gray-50 border-gray-400';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'assigned':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-w-[280px] max-w-[320px] rounded-lg border-2 p-4 transition-all hover:shadow-md ${getCardBackgroundClass()}`}
    >
      {/* Task Title */}
      <div className="mb-3">
        <h3 className={`font-semibold text-lg mb-2 ${task.is_paused ? 'text-gray-500' : 'text-gray-800'}`}>
          {task.title}
        </h3>
        
        {/* Status and Priority Badges */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {getStatusIcon(task.status)}
            <StatusBadge status={task.status} />
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority?.toUpperCase() || 'NORMAL'}
          </span>
        </div>

        {/* Indicators */}
        <div className="flex flex-wrap gap-2">
          {overdue && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
              OVERDUE
            </span>
          )}
          {task.is_paused && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
              ⏸ PAUSED
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className={`text-sm mb-3 line-clamp-2 ${task.is_paused ? 'text-gray-500' : 'text-gray-600'}`}>
          {task.description}
        </p>
      )}

      {/* Deadline */}
      {task.deadline && (
        <p className="text-sm text-gray-600 mb-3">
          Due: {new Date(task.deadline).toLocaleDateString()}
        </p>
      )}

      {/* Inline Editing */}
      <div className="mb-3 space-y-2">
        <div>
          <p className="text-xs text-gray-500 mb-1">Status:</p>
          <InlineStatusDropdown
            currentStatus={task.status}
            onStatusChange={onStatusChange}
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Priority:</p>
          <InlinePriorityDropdown
            currentPriority={task.priority}
            onPriorityChange={onPriorityChange}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {canPauseResume && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onPauseToggle}
            className={`flex-1 ${task.is_paused ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
          >
            {task.is_paused ? (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            )}
          </Button>
        )}
        
        {nextStatus && !task.is_paused && (
          <Button
            size="sm"
            onClick={() => onStatusChange(nextStatus)}
            className="flex-1"
          >
            {STATUS_LABELS[nextStatus]}
          </Button>
        )}
        
        {task.status === 'completed' && (
          <span className="text-sm text-green-600 font-medium flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Done
          </span>
        )}
      </div>
    </div>
  );
}
