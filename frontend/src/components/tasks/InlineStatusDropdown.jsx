import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

const STATUS_OPTIONS = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'paused', label: 'Paused' }
];

export default function InlineStatusDropdown({ 
  currentStatus, 
  onStatusChange, 
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusSelect = async (newStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    
    setIsUpdating(true);
    setIsOpen(false);
    
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => !disabled && !isUpdating && setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 cursor-pointer transition-all duration-200
          ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
          ${isOpen ? 'bg-gray-100' : ''}
          rounded px-2 py-1
        `}
        title={disabled ? 'Cannot change status' : 'Click to change status'}
      >
        <StatusBadge status={currentStatus} />
        {!disabled && !isUpdating && (
          <ChevronDown 
            className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
        {isUpdating && (
          <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
          <div className="py-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusSelect(option.value)}
                className={`
                  w-full text-left px-3 py-2 text-sm transition-colors
                  ${option.value === currentStatus 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <StatusBadge status={option.value} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}