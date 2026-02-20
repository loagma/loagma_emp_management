import { useState, useEffect } from "react";
import { getCurrentAttendance, punchIn, punchOut, startBreak, endBreak, getAttendanceList } from "../features/attendance/api/attendanceApi";
import toast from "react-hot-toast";
import PageLayout from "../components/ui/PageLayout";
import Section from "../components/ui/Section";
import Button from "../components/ui/Button";
import { Clock, Coffee, LogIn, LogOut, Activity, CheckCircle2 } from "lucide-react";
import BreakStartModal from "../components/attendance/BreakStartModal";

export default function EmployeeDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakTime, setBreakTime] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [daySummary, setDaySummary] = useState(null);
  const [showBreakModal, setShowBreakModal] = useState(false);

  useEffect(() => {
    loadAttendance();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!attendance || attendance.status === 'not_punched_in') return;

    const interval = setInterval(() => {
      const now = new Date();
      const punchInTime = new Date(attendance.punch_in);
      const elapsed = Math.floor((now - punchInTime) / 1000);

      // Calculate break time
      let totalBreak = 0;
      if (attendance.breaks) {
        attendance.breaks.forEach(brk => {
          if (brk.end_time) {
            const start = new Date(brk.start_time);
            const end = new Date(brk.end_time);
            totalBreak += Math.floor((end - start) / 1000);
          } else {
            // Active break
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

      // If status is not_punched_in, check if there's a completed attendance for today
      if (data.status === 'not_punched_in') {
        // Try to get today's attendance list to find completed record
        const today = new Date().toISOString().split('T')[0];
        const attendanceList = await getAttendanceList({ start_date: today });
        const todayRecords = attendanceList.results || attendanceList || [];

        // Find today's completed attendance (must be from TODAY, not yesterday)
        const todayAttendance = todayRecords.find(record => {
          const recordDate = new Date(record.punch_in).toDateString();
          const todayDate = new Date().toDateString();
          return recordDate === todayDate && record.punch_out;
        });

        if (todayAttendance) {
          // Found completed attendance for today
          setAttendance(todayAttendance);
          buildActivityLog(todayAttendance);
        } else {
          // No attendance today - reset to allow new punch-in
          setAttendance({ status: 'not_punched_in' });
          setActivityLog([]);
          setDaySummary(null);
        }
      } else {
        // Active attendance - verify it's from today
        const attendanceDate = new Date(data.punch_in).toDateString();
        const todayDate = new Date().toDateString();

        if (attendanceDate === todayDate) {
          // Valid attendance from today
          setAttendance(data);
          buildActivityLog(data);
        } else {
          // Old attendance from previous day - reset
          setAttendance({ status: 'not_punched_in' });
          setActivityLog([]);
          setDaySummary(null);
        }
      }
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildActivityLog = (attendanceData) => {
    const log = [];

    // Punch in
    if (attendanceData.punch_in) {
      log.push({
        time: new Date(attendanceData.punch_in),
        action: 'Punched In',
        icon: 'login',
        color: 'text-green-600'
      });
    }

    // Breaks
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
            action: 'Break Ended - Resumed Work',
            icon: 'activity',
            color: 'text-blue-600'
          });
        }
      });
    }

    // Punch out
    if (attendanceData.punch_out) {
      log.push({
        time: new Date(attendanceData.punch_out),
        action: 'Punched Out',
        icon: 'logout',
        color: 'text-red-600'
      });

      // Generate day summary
      generateDaySummary(attendanceData);
    } else {
      setDaySummary(null);
    }

    // Sort by time
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
    // Open the break modal instead of directly starting break
    setShowBreakModal(true);
  };

  const handleBreakSuccess = () => {
    // Called when break is successfully started from modal
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

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'login':
        return <LogIn className="w-5 h-5" />;
      case 'logout':
        return <LogOut className="w-5 h-5" />;
      case 'coffee':
        return <Coffee className="w-5 h-5" />;
      case 'activity':
        return <Activity className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const workTime = elapsedTime - breakTime;
  const isPunchedIn = attendance && attendance.status !== 'not_punched_in';
  const isOnBreak = attendance?.status === 'on_break';

  // Check if punched out TODAY (not yesterday)
  const isPunchedOut = attendance && attendance.punch_out && (() => {
    const punchOutDate = new Date(attendance.punch_out).toDateString();
    const todayDate = new Date().toDateString();
    return punchOutDate === todayDate;
  })();

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  // Show Day Complete view if punched out
  if (isPunchedOut) {
    return (
      <PageLayout>
        <Section title="Day Complete">
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

            {/* Day Summary */}
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

            {/* Activity Log */}
            {activityLog.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Activity</h3>
                <div className="space-y-2">
                  {activityLog.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
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
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section title="Time Tracking">
        <div className="bg-white rounded-lg shadow-lg p-8">

          {/* Time Display */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <Clock className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <h2 className="text-4xl font-bold text-gray-800 mb-2">
                {isPunchedIn ? formatTime(workTime) : "00:00:00"}
              </h2>
              <p className="text-gray-600">
                {isPunchedIn ? (isOnBreak ? "On Break" : "Working") : "Not Punched In"}
              </p>
            </div>

            {isPunchedIn && (
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Time</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Break Time</p>
                  <p className="text-2xl font-semibold text-orange-600">
                    {formatTime(breakTime)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            {!isPunchedIn ? (
              <Button
                onClick={handlePunchIn}
                className="px-8 py-4 text-lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Punch In
              </Button>
            ) : (
              <>
                {!isOnBreak ? (
                  <>
                    <Button
                      onClick={handleStartBreak}
                      variant="secondary"
                      className="px-6 py-3"
                    >
                      <Coffee className="w-5 h-5 mr-2" />
                      Start Break
                    </Button>
                    <Button
                      onClick={handlePunchOut}
                      variant="danger"
                      className="px-6 py-3"
                    >
                      <LogOut className="w-5 h-5 mr-2" />
                      Punch Out
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEndBreak}
                    className="px-6 py-3"
                  >
                    <Coffee className="w-5 h-5 mr-2" />
                    End Break
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Punch In Time */}
          {isPunchedIn && attendance.punch_in && (
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>Punched in at: {new Date(attendance.punch_in).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </Section>

      {/* Activity Log */}
      {activityLog.length > 0 && (
        <Section title="Today's Activity Log">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="space-y-3">
              {activityLog.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
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
        </Section>
      )}

      {/* Day Summary */}
      {daySummary && (
        <Section title="Day Summary">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-blue-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Work Summary - {daySummary.date}
              </h3>
              <p className="text-gray-600">
                {daySummary.punchInTime} - {daySummary.punchOutTime}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Total Time</p>
                <p className="text-2xl font-bold text-gray-800">{daySummary.totalTime}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Work Time</p>
                <p className="text-2xl font-bold text-green-600">{daySummary.workTime}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Break Time</p>
                <p className="text-2xl font-bold text-orange-600">{daySummary.breakTime}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow text-center">
                <p className="text-sm text-gray-600 mb-1">Breaks Taken</p>
                <p className="text-2xl font-bold text-blue-600">{daySummary.breakCount}</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 italic">
                💡 Take a screenshot of this summary for your records
              </p>
            </div>
          </div>
        </Section>
      )}
      
      {/* Break Start Modal */}
      <BreakStartModal
        isOpen={showBreakModal}
        onClose={() => setShowBreakModal(false)}
        onSuccess={handleBreakSuccess}
      />
    </PageLayout>
  );
}
