import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadNotificationCount, checkExceededBreaks } from '../../features/attendance/api/attendanceApi';

const BreakNotificationBadge = ({ onNotificationClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      console.log('[BreakNotificationBadge] Fetching unread count...');
      const response = await getUnreadNotificationCount();
      console.log('[BreakNotificationBadge] Unread count:', response.unread_count);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('[BreakNotificationBadge] Error fetching notification count:', error);
      // Don't show error toast, just log it
    }
  };

  const checkForExceededBreaks = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('[BreakNotificationBadge] Checking for exceeded breaks...');
      await checkExceededBreaks();
      // Refresh count after checking
      await fetchUnreadCount();
    } catch (error) {
      console.error('[BreakNotificationBadge] Error checking exceeded breaks:', error);
      // Silently fail - might be permission issue
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    checkForExceededBreaks();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      checkForExceededBreaks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onNotificationClick}
      className="relative p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 shadow-sm hover:shadow-md bg-white border border-gray-200"
      title="Break notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full animate-pulse">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

export default BreakNotificationBadge;
