import { Clock, LogIn, LogOut, Plus } from "lucide-react";

/**
 * TimeTrackingHeader - Ultra-flat header matching reference pixel-perfect
 * NO containers, NO borders, NO elevation - just placed elements
 */
export default function TimeTrackingHeader({
  attendance,
  elapsedTime,
  breakTime,
  workTime,
  onPunchIn,
  onPunchOut,
  onStartBreak,
  onEndBreak,
  onNewTask,
  isPunchedIn,
  isOnBreak,
  formatTime
}) {
  return (
    <div className="flex items-center justify-between px-8 py-6 mb-6">
      {/* Left: Clock + Time Stats */}
      <div className="flex items-center gap-6">
        {/* Circular Clock Indicator */}
        <div className="w-10 h-10 rounded-full border-3 border-blue-400 flex items-center justify-center bg-white">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        
        {/* Time Display */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-400">Total time:</span>
            <span className="text-sm font-medium text-gray-700">
              {isPunchedIn ? formatTime(elapsedTime) : "00:00:00"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-gray-400">Break time:</span>
            <span className="text-sm font-medium text-gray-700">
              {isPunchedIn ? formatTime(breakTime) : "00:00:00"}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Break Buttons */}
      {isPunchedIn && (
        <div className="flex gap-2">
          {!isOnBreak ? (
            <>
              <button
                onClick={onStartBreak}
                className="px-3 py-1 text-xs font-normal bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition"
              >
                Tea Break
              </button>
              <button
                onClick={onStartBreak}
                className="px-3 py-1 text-xs font-normal bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition"
              >
                Lunch Break
              </button>
              <button
                onClick={onStartBreak}
                className="px-3 py-1 text-xs font-normal bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-50 transition"
              >
                Emergency Break
              </button>
            </>
          ) : (
            <button
              onClick={onEndBreak}
              className="px-3 py-1 text-xs font-normal bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition"
            >
              End Break
            </button>
          )}
        </div>
      )}

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {!isPunchedIn ? (
          <button
            onClick={onPunchIn}
            className="px-5 py-1.5 bg-blue-400 text-white text-sm font-normal rounded hover:bg-blue-500 transition flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Punch In
          </button>
        ) : (
          <button
            onClick={onPunchOut}
            className="px-5 py-1.5 bg-blue-400 text-white text-sm font-normal rounded hover:bg-blue-500 transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Punch Out
          </button>
        )}
        
        <button
          onClick={onNewTask}
          className="px-5 py-1.5 bg-green-400 text-white text-sm font-normal rounded hover:bg-green-500 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New task
        </button>
      </div>
    </div>
  );
}
