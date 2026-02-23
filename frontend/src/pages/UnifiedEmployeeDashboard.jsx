import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getCurrentAttendance, punchIn, punchOut, endBreak, getAttendanceList } from "../features/attendance/api/attendanceApi";
import { fetchTasks } from "../features/tasks/api/taskApi";
import { useAuth } from "../features/auth/AuthContext";
import toast from "react-hot-toast";
import BreakStartModal from "../components/attendance/BreakStartModal";
import CreateTaskModalEmployee from "../components/modals/CreateTaskModalEmployee";
import TaskStripView from "../components/dashboard/TaskStripView";
import { Clock, Coffee, LogIn, LogOut, Activity, CheckCircle2, User, Power } from "lucide-react";

/**
 * UnifiedEmployeeDashboard - 1/3 - 2/3 Grid Layout
 * Left: Profile, Clock, Controls, Logs
 * Right: Task Management
 */
export default function UnifiedEmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Attendance state
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [daySummary, setDaySummary] = useState(null);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["employee-tasks"],
    queryFn: () => fetchTasks({ assigned_to: user?.id }),
    refetchInterval: 30000,
  });

  const tasks = tasksData?.results || [];

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => {
    if (!attendance || attendance.status === 'not_punched_in') return;

    const interval = setInterval(() => {
      const now = new Date();
      const punchInTime = new Date(attendance.punch_in);
      const elapsed = Math.floor((now - punchInTime) / 1000);

      let totalBreak = 0;
      if (attendance.breaks) {
        attendance.breaks.forEach(brk => {
          if (brk.end_time) {
            const start = new Date(brk.start_time);
            const end = new Date(brk.end_time);
            totalBreak += Math.floor((end - start) / 1000);
          } else {
            const start = new Date(brk.start_time);
            totalBreak += Math.floor((now - start) / 1000);
          }
        });
      }

      setElapsedTime(elapsed);
      setBreakTime(totalBreak);
    }, 1000);

    return () => clearInterval(interval);
  }, [attendance]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const data = await getCurrentAttendance();

      if (data.status === 'not_punched_in') {
        const today = new Date().toISOString().split('T')[0];
        const attendanceList = await getAttendanceList({ start_date: today });
        const todayRecords = attendanceList.results || attendanceList || [];

        const todayAttendance = todayRecords.find(record => {
          const recordDate = new Date(record.punch_in).toDateString();
          const todayDate = new Date().toDateString();
          return recordDate === todayDate && record.punch_out;
        });

        if (todayAttendance) {
          setAttendance(todayAttendance);
          buildActivityLog(todayAttendance);
        } else {
          setAttendance({ status: 'not_punched_in' });
          setActivityLog([]);
          setDaySummary(null);
        }
      } else {
        const attendanceDate = new Date(data.punch_in).toDateString();
        const todayDate = new Date().toDateString();

        if (attendanceDate === todayDate) {
          setAttendance(data);
          buildActivityLog(data);
        } else {
          setAttendance({ status: 'not_punched_in' });
          setActivityLog([]);
          setDaySummary(null);
        }
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const buildActivityLog = (attendanceData) => {
    const log = [];

    if (attendanceData.punch_in) {
      log.push({
        time: new Date(attendanceData.punch_in),
        action: 'Punched In',
        icon: 'login',
        color: 'text-green-600'
      });
    }

    if (attendanceData.breaks && attendanceData.breaks.length > 0) {
      attendanceData.breaks.forEach(brk => {
        log.push({
          time: new Date(brk.start_time),
          action: 'Break Started',
          icon: 'coffee',
          color: 'text-orange-600'
        });

        if (brk.end_time) {
          log.push({
            time: new Date(brk.end_time),
            action: 'Break Ended',
            icon: 'activity',
            color: 'text-blue-600'
          });
        }
      });
    }

    if (attendanceData.punch_out) {
      log.push({
        time: new Date(attendanceData.punch_out),
        action: 'Punched Out',
        icon: 'logout',
        color: 'text-red-600'
      });
      generateDaySummary(attendanceData);
    } else {
      setDaySummary(null);
    }

    log.sort((a, b) => a.time - b.time);
    setActivityLog(log);
  };

  const generateDaySummary = (attendanceData) => {
    const punchIn = new Date(attendanceData.punch_in);
    const punchOut = new Date(attendanceData.punch_out);
    const totalSeconds = Math.floor((punchOut - punchIn) / 1000);

    let breakSeconds = 0;
    if (attendanceData.breaks) {
      attendanceData.breaks.forEach(brk => {
        if (brk.end_time) {
          const start = new Date(brk.start_time);
          const end = new Date(brk.end_time);
          breakSeconds += Math.floor((end - start) / 1000);
        }
      });
    }

    const workSeconds = totalSeconds - breakSeconds;
    const breakCount = attendanceData.breaks ? attendanceData.breaks.length : 0;

    setDaySummary({
      date: punchIn.toLocaleDateString(),
      punchInTime: punchIn.toLocaleTimeString(),
      punchOutTime: punchOut.toLocaleTimeString(),
      totalTime: formatTime(totalSeconds),
      workTime: formatTime(workSeconds),
      breakTime: formatTime(breakSeconds),
      breakCount: breakCount
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'login':
        return <LogIn className="w-4 h-4" />;
      case 'logout':
        return <LogOut className="w-4 h-4" />;
      case 'coffee':
        return <Coffee className="w-4 h-4" />;
      case 'activity':
        return <Activity className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handlePunchIn = async () => {
    try {
      await punchIn();
      toast.success("Punched in successfully!");
      loadAttendance();
    } catch (error) {
      console.error("Failed to punch in:", error);
      toast.error(error.response?.data?.error || "Failed to punch in");
    }
  };

  const handlePunchOut = async () => {
    if (!confirm("Are you sure you want to punch out?")) return;

    try {
      await punchOut();
      toast.success("Punched out successfully!");
      loadAttendance();
    } catch (error) {
      console.error("Failed to punch out:", error);
      toast.error(error.response?.data?.error || "Failed to punch out");
    }
  };

  const handleStartBreak = () => {
    setShowBreakModal(true);
  };

  const handleBreakSuccess = () => {
    loadAttendance();
  };

  const handleEndBreak = async () => {
    try {
      await endBreak();
      toast.success("Break ended");
      loadAttendance();
    } catch (error) {
      console.error("Failed to end break:", error);
      toast.error(error.response?.data?.error || "Failed to end break");
    }
  };

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries(["employee-tasks"]);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const handleProfileClick = () => {
    navigate("/employee-profile");
  };

  const getProfileImageUrl = () => {
    if (user?.profile_picture) {
      return `http://localhost:8000${user.profile_picture}`;
    }
    return null;
  };

  const workTime = elapsedTime - breakTime;
  const isPunchedIn = attendance && attendance.status !== 'not_punched_in';
  const isOnBreak = attendance?.status === 'on_break';
  
  const isPunchedOut = attendance && attendance.punch_out && (() => {
    const punchOutDate = new Date(attendance.punch_out).toDateString();
    const todayDate = new Date().toDateString();
    return punchOutDate === todayDate;
  })();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (isPunchedOut) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-lg p-8 border-2 border-green-200">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              You've Punched Out!
            </h2>
            <p className="text-gray-600 text-lg">
              Great work today! See you tomorrow.
            </p>
          </div>

          {daySummary && (
            <div className="bg-white rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Today's Summary - {daySummary.date}
              </h3>
              <p className="text-center text-gray-600 mb-6">
                {daySummary.punchInTime} - {daySummary.punchOutTime}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Time</p>
                  <p className="text-2xl font-bold text-blue-600">{daySummary.totalTime}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Work Time</p>
                  <p className="text-2xl font-bold text-green-600">{daySummary.workTime}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Break Time</p>
                  <p className="text-2xl font-bold text-orange-600">{daySummary.breakTime}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Breaks Taken</p>
                  <p className="text-2xl font-bold text-purple-600">{daySummary.breakCount}</p>
                </div>
              </div>
            </div>
          )}

          {activityLog.length > 0 && (
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Activity</h3>
              <div className="space-y-2">
                {activityLog.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`${activity.color}`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.action}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {activity.time.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 italic">
              💡 You can only punch in once per day. Come back tomorrow!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 lg:p-6">
      {/* Adaptive 1/3 - 2/3 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 max-w-[1800px] mx-auto h-[calc(100vh-3rem)]">
        
        {/* LEFT SECTION (1/3) - Controls & Logs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4 flex flex-col overflow-hidden">
          
          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 flex-shrink-0">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleProfileClick}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 flex items-center justify-center hover:from-blue-200 hover:to-blue-300 transition-all duration-200 overflow-hidden hover:scale-105"
                title="View Profile"
              >
                {getProfileImageUrl() ? (
                  <img 
                    src={getProfileImageUrl()} 
                    alt={`${user?.first_name} ${user?.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-blue-600" />
                )}
              </button>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-lg">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-gray-500">@{user?.username}</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium border border-gray-200"
            >
              <Power className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Clock & Time Display */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 flex-shrink-0">
            <div className="flex flex-col items-center">
              {/* Large Circular Clock */}
              <div className="relative w-40 h-40 mb-5">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-8 border-blue-50"></div>
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="8"
                    strokeDasharray={`${(workTime / 28800) * 452} 452`}
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-800">
                    {isPunchedIn ? formatTime(workTime) : "00:00:00"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Working</p>
                </div>
              </div>

              {/* Time Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 text-center border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">Total Time</p>
                  <p className="text-lg font-bold text-blue-700">{formatTime(elapsedTime)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 text-center border border-orange-100">
                  <p className="text-xs text-gray-600 mb-1">Break Time</p>
                  <p className="text-lg font-bold text-orange-700">{formatTime(breakTime)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Break & Punch Controls */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3 flex-shrink-0">
            {/* Break Controls */}
            {isPunchedIn && (
              <div className="flex gap-2">
                {!isOnBreak ? (
                  <button
                    onClick={handleStartBreak}
                    className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                  >
                    <Coffee className="w-4 h-4" />
                    Start Break
                  </button>
                ) : (
                  <button
                    onClick={handleEndBreak}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md"
                  >
                    <Coffee className="w-4 h-4" />
                    End Break
                  </button>
                )}
              </div>
            )}

            {/* Punch In/Out */}
            {!isPunchedIn ? (
              <button
                onClick={handlePunchIn}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md"
              >
                <LogIn className="w-5 h-5" />
                Punch In
              </button>
            ) : (
              <button
                onClick={handlePunchOut}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md"
              >
                <LogOut className="w-5 h-5" />
                Punch Out
              </button>
            )}
          </div>

          {/* Activity Logs - Fixed Height with Scroll */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex-shrink-0">Activity Logs</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
              {activityLog.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>
              ) : (
                activityLog.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-gray-50 to-transparent rounded-xl hover:from-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200"
                  >
                    <div className={`${activity.color} bg-white p-1.5 rounded-full shadow-sm`}>
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 text-xs truncate">{activity.action}</p>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {activity.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SECTION (2/3) - Task Management - Fixed Height with Scroll */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Tasks Management</h2>
              <button
                onClick={() => setShowCreateTaskModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium shadow-md flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                New Task
              </button>
            </div>

            {/* Task List */}
            <TaskStripView
              tasks={tasks}
              isLoading={tasksLoading}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </div>
      </div>

      {/* Break Start Modal */}
      <BreakStartModal
        isOpen={showBreakModal}
        onClose={() => setShowBreakModal(false)}
        onSuccess={handleBreakSuccess}
      />

      {/* Create Task Modal */}
      <CreateTaskModalEmployee
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        onSuccess={handleTaskUpdate}
      />
    </div>
  );
}
