import { useState } from 'react';
import { Pencil, Trash2, Pause, Play } from 'lucide-react';
import InlineStatusDropdown from '../../components/tasks/InlineStatusDropdown';
import InlinePriorityDropdown from '../../components/tasks/InlinePriorityDropdown';
import { updateTaskStatus, updateTaskPriority, pauseTask, resumeTask } from './api/taskApi';
import toast from 'react-hot-toast';

export default function TaskRow({ task, onDelete, onEdit, onTaskUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      toast.success('Status updated successfully');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setIsUpdating(true);
    try {
      await updateTaskPriority(task.id, newPriority);
      toast.success('Priority updated successfully');
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePauseToggle = async () => {
    setIsUpdating(true);
    try {
      if (task.is_paused) {
        await resumeTask(task.id);
        toast.success('Task resumed successfully');
      } else {
        await pauseTask(task.id);
        toast.success('Task paused successfully');
      }
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      toast.error(`Failed to ${task.is_paused ? 'resume' : 'pause'} task`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine row background color based on status
  const getRowBackgroundClass = () => {
    if (task.is_overdue && !task.is_paused) {
      return 'bg-red-50 hover:bg-red-100';
    }
    
    switch (task.status) {
      case 'completed':
        return 'bg-green-50 hover:bg-green-100';
      case 'in_progress':
        return 'bg-yellow-50 hover:bg-yellow-100';
      case 'paused':
        return 'bg-gray-50 hover:bg-gray-100';
      default:
        return 'hover:bg-gray-50';
    }
  };

  // Check if user can pause/resume (only for assigned tasks or in_progress)
  const canPauseResume = task.status === 'in_progress' || task.is_paused;

  return (
    <tr className={`border-b transition-colors ${getRowBackgroundClass()}`}>
      <td className="py-4 font-medium">
        <div>
          <p className={task.is_paused ? 'text-gray-500' : ''}>{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
          {task.is_paused && (
            <p className="text-xs text-orange-600 mt-1 font-medium">⏸ Paused</p>
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
        <InlineStatusDropdown
          currentStatus={task.status}
          onStatusChange={handleStatusChange}
          disabled={isUpdating}
        />
      </td>

      <td>
        <InlinePriorityDropdown
          currentPriority={task.priority}
          onPriorityChange={handlePriorityChange}
          disabled={isUpdating}
        />
      </td>

      <td>
        <div>
          <p>{formatDate(task.deadline)}</p>
          {task.is_overdue && !task.is_paused && (
            <p className="text-xs text-red-600 font-medium">Overdue</p>
          )}
          {task.is_paused && task.remaining_time && (
            <p className="text-xs text-orange-600">Time saved</p>
          )}
        </div>
      </td>

      <td>
        <div className="flex gap-2 text-gray-400">
          {canPauseResume && (
            <button
              onClick={handlePauseToggle}
              disabled={isUpdating}
              className={`
                p-1 rounded transition-colors
                ${isUpdating 
                  ? 'opacity-50 cursor-not-allowed' 
                  : task.is_paused 
                    ? 'hover:text-green-600 hover:bg-green-50' 
                    : 'hover:text-orange-600 hover:bg-orange-50'
                }
              `}
              title={task.is_paused ? 'Resume task' : 'Pause task'}
            >
              {task.is_paused ? <Play size={16} /> : <Pause size={16} />}
            </button>
          )}
          
          <button
            onClick={() => onEdit(task)}
            disabled={isUpdating}
            className="p-1 rounded hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            title="Edit task"
          >
            <Pencil size={16} />
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            disabled={isUpdating}
            className="p-1 rounded hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
