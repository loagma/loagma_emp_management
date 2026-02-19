import { useState, useRef } from 'react';
import { User, Mail, Briefcase, Building2, ListTodo, Clock, Activity } from 'lucide-react';
import EmployeeHoverPreview from './EmployeeHoverPreview';

const EnhancedEmployeeCard = ({ employee, workingStatus, onCardClick }) => {
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const isHoveringRef = useRef(false);
  
  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.username;

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (isHoveringRef.current) {
        setShowPreview(true);
      }
    }, 300);
  };

  const handleMouseLeave = (e) => {
    isHoveringRef.current = false;
    // Don't close immediately - give time to move to overlay
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setShowPreview(false);
      }
    }, 100);
  };

  const handlePreviewMouseEnter = () => {
    isHoveringRef.current = true;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handlePreviewMouseLeave = () => {
    isHoveringRef.current = false;
    setShowPreview(false);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'punched_in':
      case 'working':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on_break':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'punched_out':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return 'N/A';
    }
  };

  const formatLastActivity = (timestamp) => {
    if (!timestamp) return 'No recent activity';
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <div
        onClick={() => onCardClick(employee.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-200 hover:border-blue-400 transform hover:-translate-y-1 relative group"
      >
        {/* Quick View Hint */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
            Hover for preview
          </span>
        </div>

      {/* Header with Profile Picture and Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Profile Picture */}
          <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 border-2 border-blue-200">
            {employee.profile_picture_url ? (
              <img
                src={employee.profile_picture_url}
                alt={fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ display: employee.profile_picture_url ? 'none' : 'flex' }}
            >
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              {fullName}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Mail className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{employee.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role and Department */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-700">
          <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
          <span className="font-medium">{employee.role_display || employee.role}</span>
        </div>
        
        {employee.department_name && (
          <div className="flex items-center text-sm text-gray-700">
            <Building2 className="w-4 h-4 mr-2 text-gray-500" />
            <span>{employee.department_name}</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Task Count */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between">
            <ListTodo className="w-5 h-5 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">
              {employee.task_count || 0}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1 font-medium">Active Tasks</p>
        </div>

        {/* Work Hours Today */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center justify-between">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-lg font-bold text-purple-700">
              {employee.today_work_hours || '0h 0m'}
            </span>
          </div>
          <p className="text-xs text-purple-600 mt-1 font-medium">Today</p>
        </div>
      </div>

      {/* Last Activity */}
      {employee.last_activity && (
        <div className="flex items-center text-xs text-gray-500 mb-4 bg-gray-50 rounded p-2">
          <Activity className="w-4 h-4 mr-1" />
          <span>Last activity: {formatLastActivity(employee.last_activity)}</span>
        </div>
      )}

      {/* Working Status */}
      {workingStatus && (
        <div className="border-t pt-4">
          <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(workingStatus.status)}`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                workingStatus.status === 'punched_in' || workingStatus.status === 'working' 
                  ? 'bg-green-500 animate-pulse' 
                  : workingStatus.status === 'on_break'
                  ? 'bg-orange-500'
                  : 'bg-gray-400'
              }`} />
              <span className="text-sm font-medium">{workingStatus.label}</span>
            </div>
            
            {workingStatus.punchIn && (
              <div className="text-xs">
                <span className="font-medium">In:</span> {formatTime(workingStatus.punchIn)}
              </div>
            )}
          </div>

          {workingStatus.duration && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="text-sm font-semibold text-gray-700">{workingStatus.duration}</p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Hover Preview Overlay - Rendered outside card */}
    {showPreview && (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        onMouseEnter={handlePreviewMouseEnter}
        onMouseLeave={handlePreviewMouseLeave}
      >
        {/* Backdrop - clicking here closes the preview */}
        <div 
          className="absolute inset-0"
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(false);
          }}
        />
        {/* Preview content */}
        <div className="relative z-10">
          <EmployeeHoverPreview employeeId={employee.id} />
        </div>
      </div>
    )}
  </>
  );
};

export default EnhancedEmployeeCard;
