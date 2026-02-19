import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Clock, Activity, ListTodo, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../app/axios';

const EmployeeHoverPreview = ({ employeeId }) => {
  const navigate = useNavigate();
  const [currentDuration, setCurrentDuration] = useState(0);

  // Fetch employee quick view data
  const { data, isLoading, error } = useQuery({
    queryKey: ['employee-hover-preview', employeeId],
    queryFn: async () => {
      const response = await api.get(`/api/employees/${employeeId}/quick_view/`);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 5000,
    retry: 1,
  });

  // Debug logging
  useEffect(() => {
    console.log('EmployeeHoverPreview:', { employeeId, isLoading, hasData: !!data, error });
  }, [employeeId, isLoading, data, error]);

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
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
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

  if (!employeeId) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 z-40 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Preview Content */}
      <div 
        className="relative z-50 w-full max-w-4xl bg-white rounded-xl shadow-2xl border-2 border-blue-300 p-6 animate-fade-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
            <p className="text-base text-gray-600">Loading employee data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-base text-red-600 mb-2 font-semibold">Failed to load employee data</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </div>
        ) : data ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4 pb-4 border-b-2 border-gray-200">
                {/* Profile Picture */}
                <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 border-3 border-blue-300 shadow-lg">
                  {data.profile_picture ? (
                    <img
                      src={data.profile_picture}
                      alt={`${data.first_name} ${data.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-blue-500" />
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 truncate mb-1">
                    {data.first_name} {data.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate mb-1">{data.email}</p>
                  <p className="text-xs text-gray-500">{data.department || 'No Department'}</p>
                </div>

                {/* Work Time Badge */}
                <div className="flex-shrink-0 bg-purple-100 rounded-xl px-4 py-3 text-center shadow-md">
                  <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-purple-900">
                    {formatDuration(data.today_summary.total_work_time_seconds)}
                  </p>
                  <p className="text-xs text-purple-600 font-medium">Today</p>
                </div>
              </div>

              {/* Activity Status */}
              <div className={`flex items-center justify-between p-4 rounded-xl border-2 shadow-sm ${getStatusColor(data.working_status.status)}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    data.working_status.status === 'punched_in' 
                      ? 'bg-green-500 animate-pulse shadow-lg' 
                      : data.working_status.status === 'on_break'
                      ? 'bg-orange-500 shadow-lg'
                      : 'bg-gray-400'
                  }`} />
                  <span className="text-base font-bold">
                    {getStatusLabel(data.working_status.status)}
                  </span>
                </div>
                
                {data.working_status.status === 'punched_in' && (
                  <span className="text-base font-bold">
                    {formatDuration(currentDuration)}
                  </span>
                )}
              </div>

              {/* Tasks Section */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-blue-600" />
                    Today's Tasks
                  </h4>
                  <span className="text-sm bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-bold">
                    {data.tasks.length}
                  </span>
                </div>
                
                {data.tasks.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {data.tasks.slice(0, 3).map((task) => (
                      <div 
                        key={task.id}
                        className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm"
                      >
                        <p className="font-semibold text-gray-900 truncate text-sm mb-1">{task.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {data.tasks.length > 3 && (
                      <p className="text-sm text-blue-600 text-center pt-1 font-medium">
                        +{data.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks today</p>
                )}
              </div>

              {/* Activity Logs */}
              <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gray-600" />
                  Recent Activity
                </h4>
                
                {data.activity_log.length > 0 ? (
                  <div className="space-y-2 max-h-28 overflow-y-auto">
                    {data.activity_log.slice(-3).reverse().map((activity, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getActivityIcon(activity.type)}</span>
                          <span className="font-semibold text-gray-700 text-sm">
                            {getActivityLabel(activity.type)}
                          </span>
                        </div>
                        <span className="text-gray-500 text-sm font-medium">
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No activity today</p>
                )}
              </div>

              {/* View Full Details Button */}
              <div className="pt-2 border-t-2 border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/employees/${employeeId}`);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>View Full Details</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-base text-gray-500">No data available</p>
            </div>
          )}
      </div>
    </>
  );
};

export default EmployeeHoverPreview;
