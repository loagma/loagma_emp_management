import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

export default function EmbeddedCalendar({ 
  selectedDateTime, 
  onSelect,
  label = "Deadline" 
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDateTime) {
      return new Date(selectedDateTime);
    }
    return new Date();
  });

  const [selectedTime, setSelectedTime] = useState(() => {
    if (selectedDateTime) {
      const date = new Date(selectedDateTime);
      return {
        hours: date.getHours().toString().padStart(2, '0'),
        minutes: date.getMinutes().toString().padStart(2, '0')
      };
    }
    return { hours: '09', minutes: '00' };
  });

  const selectedDate = selectedDateTime ? new Date(selectedDateTime) : null;

  // Calendar calculations
  const { daysInMonth, firstDayOfMonth, daysInPrevMonth } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    return { daysInMonth, firstDayOfMonth, daysInPrevMonth };
  }, [currentMonth]);

  const calendarDays = useMemo(() => {
    const days = [];
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, daysInPrevMonth - i)
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
      });
    }
    
    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i)
      });
    }
    
    return days;
  }, [currentMonth, daysInMonth, firstDayOfMonth, daysInPrevMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    const newDateTime = new Date(date);
    newDateTime.setHours(parseInt(selectedTime.hours), parseInt(selectedTime.minutes), 0, 0);
    onSelect(newDateTime.toISOString().slice(0, 16));
  };

  const handleTimeChange = (field, value) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    
    if (selectedDate) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(newTime.hours), parseInt(newTime.minutes), 0, 0);
      onSelect(newDateTime.toISOString().slice(0, 16));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateSelect(today);
  };

  const handleNow = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    setSelectedTime({ hours, minutes });
    
    if (selectedDate) {
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onSelect(newDateTime.toISOString().slice(0, 16));
    } else {
      handleDateSelect(now);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        {/* Quick Actions */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={handleToday}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Today
          </button>
          <button
            type="button"
            onClick={handleNow}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Now
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="text-lg font-semibold text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const isCurrentMonth = dayInfo.isCurrentMonth;
            const isTodayDate = isToday(dayInfo.date);
            const isSelectedDate = isSelected(dayInfo.date);

            return (
              <button
                key={index}
                type="button"
                onClick={() => isCurrentMonth && handleDateSelect(dayInfo.date)}
                disabled={!isCurrentMonth}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                  ${!isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900'}
                  ${isSelectedDate 
                    ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' 
                    : isTodayDate 
                      ? 'bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100' 
                      : isCurrentMonth 
                        ? 'hover:bg-gray-100' 
                        : ''
                  }
                `}
              >
                {dayInfo.day}
              </button>
            );
          })}
        </div>

        {/* Time Picker */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-2 flex-1">
              <input
                type="number"
                min="0"
                max="23"
                value={selectedTime.hours}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                  handleTimeChange('hours', value.toString().padStart(2, '0'));
                }}
                className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-gray-500 font-medium">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={selectedTime.minutes}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                  handleTimeChange('minutes', value.toString().padStart(2, '0'));
                }}
                className="w-16 px-3 py-2 text-center border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-sm text-gray-500 ml-2">
                {parseInt(selectedTime.hours) >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
          </div>
        </div>

        {/* Selected DateTime Display */}
        {selectedDateTime && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Selected: <span className="font-medium text-gray-900">
                {new Date(selectedDateTime).toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
