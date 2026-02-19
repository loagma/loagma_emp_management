import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Upload, Eye, X, Loader2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../app/axios';

const ProfilePictureManager = ({ currentPictureUrl, onUploadSuccess }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleProfileClick = () => {
    setShowMenu(!showMenu);
  };

  const handleViewImage = () => {
    setShowMenu(false);
    setShowViewModal(true);
  };

  const handleUploadNew = () => {
    setShowMenu(false);
    setShowUploadModal(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload JPEG, PNG, or GIF');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    // Upload file directly without showing preview
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const response = await api.post('/api/employees/upload_profile_picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Profile picture uploaded successfully');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.profile_picture);
      }
      
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to upload profile picture';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Profile Picture with Menu */}
      <div className="relative inline-block">
        <div
          onClick={handleProfileClick}
          className="relative w-32 h-32 rounded-full overflow-hidden bg-blue-100 border-4 border-white shadow-lg cursor-pointer group transition-all hover:shadow-xl"
        >
          {currentPictureUrl ? (
            <img
              src={currentPictureUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-16 h-16 text-blue-500" />
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
            <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Action Menu */}
        {showMenu && (
          <>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[160px]">
              {currentPictureUrl && (
                <button
                  onClick={handleViewImage}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Image</span>
                </button>
              )}
              <button
                onClick={handleUploadNew}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-gray-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload New</span>
              </button>
            </div>
            {/* Click outside to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
          </>
        )}
      </div>

      {/* View Image Modal - Rendered via Portal */}
      {showViewModal && currentPictureUrl && createPortal(
        <div
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowViewModal(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={currentPictureUrl}
              alt="Profile"
              className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Upload Modal - Rendered via Portal */}
      {showUploadModal && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          onClick={() => {
            if (!uploading) {
              setShowUploadModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Upload Profile Picture</h3>
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowUploadModal(false);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={!uploading ? handleClick : undefined}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif"
                onChange={handleChange}
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                  <p className="text-base text-gray-700 font-medium">Uploading to Cloudinary...</p>
                  <p className="text-sm text-gray-500 mt-2">Please wait while we optimize your image</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-blue-100 rounded-full p-4 mb-4">
                    <Upload className="w-12 h-12 text-blue-600" />
                  </div>
                  <p className="text-base text-gray-700 mb-2">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-sm text-gray-500 mb-1">
                    JPEG, PNG or GIF (max 5MB)
                  </p>
                  <p className="text-xs text-gray-400 mt-3 bg-gray-100 px-3 py-1 rounded-full">
                    Images will be optimized and stored on Cloudinary CDN
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProfilePictureManager;
