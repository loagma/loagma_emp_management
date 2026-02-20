import { AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { 
    value: 'low', 
    label: 'Low', 
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    hoverBg: 'hover:bg-green-100',
    selectedBg: 'bg-green-100',
    selectedBorder: 'border-green-500',
    icon: ArrowDown,
    description: 'Can be done later'
  },
  { 
    value: 'medium', 
    label: 'Medium', 
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
    selectedBg: 'bg-blue-100',
    selectedBorder: 'border-blue-500',
    icon: Minus,
    description: 'Normal priority'
  },
  { 
    value: 'high', 
    label: 'High', 
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverBg: 'hover:bg-orange-100',
    selectedBg: 'bg-orange-100',
    selectedBorder: 'border-orange-500',
    icon: ArrowUp,
    description: 'Important task'
  },
  { 
    value: 'critical', 
    label: 'Critical', 
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
    selectedBg: 'bg-red-100',
    selectedBorder: 'border-red-500',
    icon: AlertCircle,
    description: 'Urgent - needs immediate attention'
  }
];

export default function InlinePrioritySelector({ 
  selectedPriority = 'medium', 
  onSelect,
  label = "Priority",
  showDescription = true 
}) {
  const handleSelect = (priority) => {
    onSelect(priority);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {PRIORITY_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedPriority === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                relative flex flex-col items-start gap-2 p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? `${option.selectedBg} ${option.selectedBorder} ring-2 ring-offset-1 ${option.borderColor.replace('border-', 'ring-')}` 
                  : `${option.bgColor} ${option.borderColor} ${option.hoverBg}`
                }
              `}
            >
              {/* Icon and Label */}
              <div className="flex items-center gap-2 w-full">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${isSelected ? option.selectedBg : 'bg-white'}
                `}>
                  <Icon className={`w-4 h-4 ${option.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold ${option.color}`}>
                    {option.label}
                  </p>
                </div>
                {isSelected && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${option.color.replace('text-', 'bg-')}`}>
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Description */}
              {showDescription && (
                <p className="text-xs text-gray-600 w-full text-left">
                  {option.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
