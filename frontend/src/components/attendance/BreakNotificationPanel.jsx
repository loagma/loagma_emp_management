import { useState, useEffect } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getNotifications, 
  markNotificationRead, 
  dismissNotification 
} from '../../features/attendance/api/attendanceApi';

const BreakNotificationPanel = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('unread'); // 'all', 'unread', 'read'

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getNotifications(params);
      setNotifications(response);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      toast.success('Marked as read');
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await dismissNotification(notificationId);
      toast.success('Notification dismissed');
      loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Failed to dismiss notification');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Break Notifications</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'read'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-3 font-medium transition-colors ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {filter !== 'all' ? filter : ''} notifications
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border ${
                    notification.status === 'unread'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-gray-900">
                        {notification.employee_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        exceeded break time
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>

                  <div className="ml-7 space-y-1 text-sm">
                    <div className="text-gray-700">
                      <span className="font-medium">Category:</span> {notification.break_category_name}
                    </div>
                    {notification.break_reason && (
                      <div className="text-gray-700">
                        <span className="font-medium">Reason:</span> {notification.break_reason}
                      </div>
                    )}
                    <div className="text-gray-700">
                      <span className="font-medium">Expected:</span> {notification.expected_duration_minutes} minutes
                    </div>
                    <div className="text-orange-600 font-medium">
                      Overtime: {notification.overtime_minutes} minutes
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-7 mt-3 flex space-x-2">
                    {notification.status === 'unread' && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakNotificationPanel;
