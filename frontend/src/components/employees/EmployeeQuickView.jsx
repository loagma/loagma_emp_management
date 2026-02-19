import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, User, Mail, Building2, Briefcase, Clock, 
  Activity, ListTodo, CheckCircle2, Circle, Loader2 
} from 'lucide-react';
import api from '../../app/axios';

const EmployeeQuickView = ({ employeeId, isOpen, onClose }) => {
  const [currentDuration, setCurrentDuration] = useState(0);

  // Fetch employee quick view data
  const { data, isLoading, error } = useQuery({
    queryKey: ['employee-quick-view', employeeId],
    queryFn: async () => {
      const response = await api.get(`/api/employees/${employeeId}/quick_view/`);
      return response.data;
    },
    enabled: isOpen && !!employeeId,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Live timer for working duration
  useEffect(() => {
    if (data?.working_status?.status === 'punched_in' && data?.working_status?.current_duration_seconds) {
      setCurrentDuration(data.working_status.current_duration_seconds);
      
      const interval = setInterval(() => {
        setCurrentDuration(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (data?.working_status?.current_duration_seconds) {
      setCurrentDuration(data.working_status.current_duration_seconds);
    }
  }, [data?.working_status]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'punched_in':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'on_break':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'punched_out':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'punched_in':
        return 'Working';
      case 'on_break':
        return 'On Break';
      case 'punched_out':
        return 'Punched Out';
      default:
        return 'Not Punched In';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'punch_in':
        return '🟢';
      case 'punch_out':
        return '🔴';
      case 'break_start':
        return '⏸️';
      case 'break_end':
        return '▶️';
      default:
        return '•';
    }
  };

  const getActivityLabel = (type) => {
    switch (type) {
      case 'punch_in':
        return 'Punched In';
      case 'punch_out':
        return 'Punched Out';
      case 'break_start':
        return 'Break Started';
      case 'break_end':
        return 'Break Ended';
      default:
        return type;
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Side Panel */}
      <div 
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transform transition-transform animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/50">
                {data?.profile_picture ? (
                  <img
                    src={data.profile_picture}
                    alt={`${data.first_name} ${data.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {data ? `${data.first_name} ${data.last_name}` : 'Loading...'}
                </h2>
                <p className="text-blue-100 text-sm">{data?.role}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-medium">Failed to load employee data</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            ) : data ? (
              <>
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                  
                  <div className="flex items-center text-sm text-gray-700">
                    <Mail className="w-4 h-4 mr-3 text-gray-500" />
                    <span>{data.email}</span>
                  </div>
                  
                  {data.department && (
                    <div className="flex items-center text-sm text-gray-700">
                      <Building2 className="w-4 h-4 mr-3 text-gray-500" />
                      <span>{data.department}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-700">
                    <Briefcase className="w-4 h-4 mr-3 text-gray-500" />
                    <span>{data.role}</span>
                  </div>
                </div>

                {/* Current Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Current Status</h3>
                  
                  <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(data.working_status.status)}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        data.working_status.status === 'punched_in' 
                          ? 'bg-green-500 animate-pulse' 
                          : data.working_status.status === 'on_break'
                          ? 'bg-orange-500'
                          : 'bg-gray-400'
                      }`} />
                      <span className="font-semibold text-lg">
                        {getStatusLabel(data.working_status.status)}
                      </span>
                    </div>
                  </div>

                  {data.working_status.punch_in_time && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium mb-1">Punch In</p>
                        <p className="text-sm font-semibold text-blue-900">
                          {formatTime(data.working_status.punch_in_time)}
                        </p>
                      </div>
                      
                      {data.working_status.status === 'punched_in' && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium mb-1">Working Duration</p>
                          <p className="text-sm font-semibold text-green-900">
                            {formatDuration(currentDuration)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Today's Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Today's Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <Clock className="w-6 h-6 text-purple-600 mb-2" />
                      <p className="text-xs text-purple-600 font-medium mb-1">Total Work Time</p>
                      <p className="text-lg font-bold text-purple-900">
                        {formatDuration(data.today_summary.total_work_time_seconds)}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <Activity className="w-6 h-6 text-orange-600 mb-2" />
                      <p className="text-xs text-orange-600 font-medium mb-1">Break Time</p>
                      <p className="text-lg font-bold text-orange-900">
                        {formatDuration(data.today_summary.total_break_time_seconds)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Today's Activity Log</h3>
                  
                  {data.activity_log.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {data.activity_log.map((activity, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{getActivityIcon(activity.type)}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {getActivityLabel(activity.type)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No activity recorded today
                    </p>
                  )}
                </div>

                {/* Tasks */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Today's Tasks</h3>
                  
                  {data.tasks.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {data.tasks.map((task) => (
                        <div 
                          key={task.id}
                          className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{task.title}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                                <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No tasks assigned for today
                    </p>
                  )}
                </div>

                {/* Task Statistics */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Task Statistics</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {data.task_stats.completed_today}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Completed Today</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Circle className="w-8 h-8 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-700">
                        {data.task_stats.pending}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Pending</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <ListTodo className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {data.task_stats.total_assigned}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Total Assigned</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeQuickView;
