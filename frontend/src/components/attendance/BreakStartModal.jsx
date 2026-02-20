import { useState, useEffect } from 'react';
import { X, Clock, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { getBreakCategories, startBreak } from '../../features/attendance/api/attendanceApi';

const BreakStartModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    reason: '',
    expectedHours: 0,
    expectedMinutes: 15
  });
  const [errors, setErrors] = useState({});

  // Load categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await getBreakCategories();
      console.log('Break categories response:', response); // Debug log
      console.log('Response type:', typeof response, 'Is array:', Array.isArray(response)); // Debug
      
      // Ensure data is an array
      const categoriesArray = Array.isArray(response) ? response : [];
      setCategories(categoriesArray);
      
      if (categoriesArray.length === 0) {
        console.warn('No categories found in response');
        toast.error('No break categories available. Please contact admin.');
        return;
      }
      
      // Set first category as default if available
      if (categoriesArray.length > 0 && !formData.categoryId) {
        setFormData(prev => ({
          ...prev,
          categoryId: categoriesArray[0].id,
          expectedMinutes: categoriesArray[0].default_duration_minutes
        }));
      }
    } catch (error) {
      console.error('Error loading categories - Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setCategories([]); // Set empty array on error
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error ||
                          'Failed to load break categories. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value);
    const category = categories.find(c => c.id === categoryId);
    
    if (category) {
      const hours = Math.floor(category.default_duration_minutes / 60);
      const minutes = category.default_duration_minutes % 60;
      
      setFormData(prev => ({
        ...prev,
        categoryId,
        expectedHours: hours,
        expectedMinutes: minutes
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a break category';
    }
    
    if (!formData.reason || formData.reason.trim().length < 3) {
      newErrors.reason = 'Reason must be at least 3 characters';
    }
    
    const totalMinutes = parseInt(formData.expectedHours) * 60 + parseInt(formData.expectedMinutes);
    if (totalMinutes === 0) {
      newErrors.duration = 'Expected duration must be greater than zero';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const breakData = {
        category_id: parseInt(formData.categoryId),
        reason: formData.reason.trim(),
        expected_hours: parseInt(formData.expectedHours),
        expected_minutes: parseInt(formData.expectedMinutes)
      };
      
      await startBreak(breakData);
      toast.success('Break started successfully');
      
      // Reset form
      setFormData({
        categoryId: categories[0]?.id || '',
        reason: '',
        expectedHours: 0,
        expectedMinutes: 15
      });
      setErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error starting break:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          'Failed to start break';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      categoryId: categories[0]?.id || '',
      reason: '',
      expectedHours: 0,
      expectedMinutes: 15
    });
    setErrors({});
    onClose();
  };

  const getTotalDuration = () => {
    const hours = parseInt(formData.expectedHours) || 0;
    const minutes = parseInt(formData.expectedMinutes) || 0;
    
    if (hours === 0 && minutes === 0) return '0 minutes';
    if (hours === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Coffee className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Start Break</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Break Category <span className="text-red-500">*</span>
            </label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={loading || submitting}
            >
              {loading ? (
                <option value="">Loading categories...</option>
              ) : !Array.isArray(categories) || categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                <>
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.default_duration_minutes} min)
                    </option>
                  ))}
                </>
              )}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
            )}
          </div>

          {/* Reason Text Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={3}
              placeholder="Please provide a reason for this break (min 3 characters)"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.reason ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={submitting}
            />
            <div className="flex justify-between mt-1">
              {errors.reason ? (
                <p className="text-sm text-red-500">{errors.reason}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  {formData.reason.length} characters
                </p>
              )}
            </div>
          </div>

          {/* Duration Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Duration <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Hours</label>
                <input
                  type="number"
                  name="expectedHours"
                  value={formData.expectedHours}
                  onChange={handleInputChange}
                  min="0"
                  max="23"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                <input
                  type="number"
                  name="expectedMinutes"
                  value={formData.expectedMinutes}
                  onChange={handleInputChange}
                  min="0"
                  max="59"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>
            </div>
            {errors.duration && (
              <p className="mt-1 text-sm text-red-500">{errors.duration}</p>
            )}
            <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Total: {getTotalDuration()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || loading}
            >
              {submitting ? 'Starting...' : 'Start Break'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakStartModal;
