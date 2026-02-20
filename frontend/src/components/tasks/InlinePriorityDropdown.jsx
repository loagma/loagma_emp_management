import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-600' },
  { value: 'medium', label: 'Medium', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
];

export default function InlinePriorityDropdown({ 
  currentPriority, 
  onPriorityChange, 
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

  const handlePrioritySelect = async (newPriority) => {
    if (newPriority === currentPriority || isUpdating) return;
    
    setIsUpdating(true);
    setIsOpen(false);
    
    try {
      await onPriorityChange(newPriority);
    } catch (error) {
      console.error('Failed to update priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentPriorityOption = () => {
    return PRIORITY_OPTIONS.find(option => option.value === currentPriority) || PRIORITY_OPTIONS[1];
  };

  const currentOption = getCurrentPriorityOption();

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
        title={disabled ? 'Cannot change priority' : 'Click to change priority'}
      >
        <span className={`font-medium ${currentOption.color}`}>
          {currentOption.label}
        </span>
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
          <div className="py-1">
            {PRIORITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePrioritySelect(option.value)}
                className={`
                  w-full text-left px-3 py-2 text-sm transition-colors
                  ${option.value === currentPriority 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                  }
                `}
              >
                <span className={`font-medium ${option.color}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}