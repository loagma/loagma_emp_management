import { useState, useRef, useEffect } from 'react';
import { Search, User, ChevronDown } from 'lucide-react';

export default function InlineEmployeeSelector({ 
  employees = [], 
  selectedEmployeeId, 
  onSelect,
  label = "Assign To",
  required = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role_display?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (employee) => {
    onSelect(employee.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Employee Display / Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between gap-3 px-4 py-3 
            border rounded-lg transition-all duration-200
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'}
            ${!selectedEmployee ? 'text-gray-400' : 'text-gray-900'}
            hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          `}
        >
          <div className="flex items-center gap-3 flex-1 text-left">
            {selectedEmployee ? (
              <>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{selectedEmployee.username}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedEmployee.role_display}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <span>Select employee</span>
              </>
            )}
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
              </div>
            </div>

            {/* Employee List */}
            <div className="overflow-y-auto flex-1">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No employees found
                </div>
              ) : (
                <div className="py-1">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleSelect(employee)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
                        ${employee.id === selectedEmployeeId 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-900'
                        }
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                        ${employee.id === selectedEmployeeId ? 'bg-blue-100' : 'bg-gray-100'}
                      `}>
                        <User className={`w-5 h-5 ${employee.id === selectedEmployeeId ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{employee.username}</p>
                        <p className="text-xs text-gray-500 truncate">{employee.role_display}</p>
                        {employee.email && (
                          <p className="text-xs text-gray-400 truncate">{employee.email}</p>
                        )}
                      </div>
                      {employee.id === selectedEmployeeId && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
