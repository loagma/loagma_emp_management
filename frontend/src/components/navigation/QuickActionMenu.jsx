import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Zap, UserPlus } from "lucide-react";
import useClickOutside from "../../hooks/useClickOutside";
import useEscapeKey from "../../hooks/useEscapeKey";

export default function QuickActionMenu({ onCreateTask, onAddEmployee }) {

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useClickOutside(menuRef, () => setOpen(false));
  
  // Close dropdown on Escape key
  useEscapeKey(() => setOpen(false));

  const handleCreateTask = () => {
    setOpen(false);
    if (onCreateTask) {
      onCreateTask();
    } else {
      navigate('/tasks');
    }
  };

  const handleAddEmployee = () => {
    setOpen(false);
    if (onAddEmployee) {
      onAddEmployee();
    } else {
      navigate('/employees');
    }
  };

  const handleCreateAutomation = () => {
    setOpen(false);
    navigate('/automation');
  };

  return (
    <div className="relative" ref={menuRef}>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
      >
        <Plus size={16}/>
        Quick Action
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[220px] bg-white border rounded-lg shadow-lg p-2 text-sm z-40">

          <button 
            onClick={handleCreateTask}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 rounded transition text-left"
          >
            <Plus size={14}/>
            Create Task
          </button>

          <button 
            onClick={handleAddEmployee}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 rounded transition text-left"
          >
            <UserPlus size={14}/>
            Add Employee
          </button>

          <button 
            onClick={handleCreateAutomation}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 rounded transition text-left"
          >
            <Zap size={14}/>
            Create Automation
          </button>

        </div>
      )}

    </div>
  );
}
