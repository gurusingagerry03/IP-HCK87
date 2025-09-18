import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useClubsState, useClubsDispatch } from '../store/hooks';
import toast from 'react-hot-toast';
import http from '../helpers/http.jsx';
import { getAuthHeaders } from '../helpers/auth.jsx';

export default function TeamList() {
  const { teams, meta, loading, error } = useClubsState();
  const { fetchClubs } = useClubsDispatch();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = meta.totalPages || 0;
  const totalTeams = meta.total || 0;
  const [imageErrors, setImageErrors] = useState(new Set()); // Track failed images

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [deletingImageIndex, setDeletingImageIndex] = useState(null);

  const pageSize = 20;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchTeams = (page = 1, searchTerm = '') => {
    const params = {
      'page[number]': page,
      'page[size]': pageSize,
    };

    if (searchTerm.trim()) {
      params.q = searchTerm.trim();
    }

    fetchClubs(params);
  };

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPage = parseInt(searchParams.get('page')) || 1;

    setSearch(urlSearch);
    setCurrentPage(urlPage);
  }, [searchParams]);

  // Fetch teams when search or page changes
  useEffect(() => {
    fetchTeams(currentPage, search);
    setImageErrors(new Set());

    // Update URL params
    const newParams = new URLSearchParams();
    if (search.trim()) {
      newParams.set('search', search.trim());
    }
    if (currentPage > 1) {
      newParams.set('page', currentPage.toString());
    }
    setSearchParams(newParams);
  }, [currentPage, search, dispatch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) => {
      const isImage = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isImage && isValidSize;
    });

    // Limit to 4 files maximum
    const limitedFiles = validFiles.slice(0, 4);
    setSelectedFiles(limitedFiles);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  // Open upload modal
  const openUploadModal = (team) => {
    setSelectedTeam(team);
    setSelectedFiles([]);
    setIsUploadModalOpen(true);
  };

  // Close upload modal
  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedTeam(null);
    setSelectedFiles([]);
    setDragActive(false);
    setUploadError('');
  };

  // Open gallery modal
  const openGalleryModal = async (team) => {
    setSelectedTeam(team);
    setIsGalleryModalOpen(true);
    setLoadingGallery(true);
    setUploadError(''); // Clear any previous errors

    try {
      // Get team details with images
      const response = await http.get(`/teams/${team.id}`);

      const images = response.data.imgUrls || [];
      setGalleryImages(images);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load images. Please try again.';
      toast.error(errorMessage);
      setGalleryImages([]);
      setUploadError(errorMessage);
    } finally {
      setLoadingGallery(false);
    }
  };

  // Close gallery modal
  const closeGalleryModal = () => {
    setIsGalleryModalOpen(false);
    setSelectedTeam(null);
    setGalleryImages([]);
    setLoadingGallery(false);
    setUploadError(''); // Clear errors
    setDeletingImageIndex(null); // Clear deleting state
  };

  // Delete image from gallery
  const deleteImage = async (imageIndex) => {
    setDeletingImageIndex(imageIndex);

    try {
      await http({
        method: 'delete',
        url: `/teams/img-url/${selectedTeam.id}/${imageIndex}`,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      setGalleryImages((prev) => prev.filter((_, index) => index !== imageIndex));

      // Refresh team data in background
      fetchTeams(currentPage, search);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete image. Please try again.';
      toast.error(errorMessage);
      setUploadError(errorMessage);
    } finally {
      setDeletingImageIndex(null);
    }
  };

  // Remove selected file
  const removeSelectedFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError('');

    try {
      // Create FormData
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Upload to server
      const response = await http({
        method: 'patch',
        url: `/teams/img-url/${selectedTeam.id}`,
        data: formData,
        headers: {
          ...getAuthHeaders(),
        },
      });

      // Success - close modal and refresh teams
      closeUploadModal();
      fetchTeams(currentPage, search); // Refresh team data

      toast.success('Image uploaded successfully');
    } catch (error) {
      // Handle error from server
      let errorMessage = 'Upload failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 413) {
        errorMessage = 'File size too large. Maximum 5MB per file.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 mx-1 text-sm text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 py-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 mx-1 text-sm border rounded ${
            i === currentPage
              ? 'bg-blue-500 text-white border-blue-500'
              : 'text-gray-900 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 py-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 mx-1 text-sm text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              ← Back to Admin Panel
            </button>
            <button className="flex items-center px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
              🏆 Team Management
            </button>
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage teams, upload images, and view galleries
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team List Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team List</h2>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mt-3 sm:mt-0 text-sm text-gray-600">
                Showing {(teams || []).length} of {totalTeams} teams
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading teams...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">Error loading teams: {error}</p>
              </div>
            ) : (teams || []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No teams found</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Founded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(teams || []).map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full object-contain bg-gray-100"
                              src={
                                imageErrors.has(team.id)
                                  ? '/api/placeholder/40/40'
                                  : team.logoUrl || '/api/placeholder/40/40'
                              }
                              alt={team.name}
                              onError={(e) => {
                                if (!imageErrors.has(team.id)) {
                                  setImageErrors((prev) => new Set([...prev, team.id]));
                                }
                              }}
                              loading="lazy"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500">
                              {team.League?.name || 'No League'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {team.country}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {team.foundedYear || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {team.stadiumName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openUploadModal(team)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                          >
                            Upload Image
                          </button>
                          <button
                            onClick={() => openGalleryModal(team)}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                          >
                            View Gallery
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && (teams || []).length > 0 && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    Previous
                  </button>
                  {renderPagination()}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-brightness-75 transition-opacity"
            aria-hidden="true"
            onClick={closeUploadModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Upload Images for {selectedTeam?.name}
                </h3>
                <button
                  onClick={closeUploadModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  <div className="space-y-2">
                    <svg
                      className="w-8 h-8 mx-auto text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p>Max 4 images • PNG, JPG, WEBP up to 5MB each</p>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{uploadError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Selected Images ({selectedFiles.length}/4)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <button
                            onClick={() => removeSelectedFile(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
                            {file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeUploadModal}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    `Upload ${selectedFiles.length} Image${selectedFiles.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-labelledby="gallery-modal-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-brightness-75 transition-opacity"
            aria-hidden="true"
            onClick={closeGalleryModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="gallery-modal-title"
                >
                  Gallery - {selectedTeam?.name}
                </h3>
                <button
                  onClick={closeGalleryModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Gallery Content */}
              {uploadError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {uploadError}
                </div>
              )}
              {loadingGallery ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading gallery...</span>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-gray-500 mb-2">No images found</p>
                  <p className="text-sm text-gray-400">Upload some images to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative group bg-white">
                      <img
                        src={image.url || image}
                        alt={`${selectedTeam?.name} image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          toast.error('Image failed to load');
                          e.target.src =
                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA2MEw0NS41IDQ5LjVMNjUgNjlNNjUgNDVINjVNNjUgNDVINjVNMzUgNDBINjVWNDBIMzVWNDBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjx0ZXh0IHg9IjUwIiB5PSI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUNBNEFGIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                        }}
                        onLoad={() => {}}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => deleteImage(index)}
                          disabled={deletingImageIndex === index}
                          className={`bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors ${
                            deletingImageIndex === index ? 'cursor-not-allowed opacity-50' : ''
                          }`}
                          title="Delete image"
                        >
                          {deletingImageIndex === index ? (
                            <svg
                              className="animate-spin w-4 h-4"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gallery Info */}
              {galleryImages.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''} • Hover over
                  images to delete
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-3">
              <div className="flex justify-end">
                <button
                  onClick={closeGalleryModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
