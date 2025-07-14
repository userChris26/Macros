// utils/apiUtils.js
// Frontend API utility functions for Cloudinary integration

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : 'http://localhost:5000';

// Upload profile picture
export const uploadProfilePicture = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('profilePic', file);

    const response = await fetch(`${API_BASE_URL}/api/upload-profile-pic/${userId}`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Delete profile picture
export const deleteProfilePicture = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/delete-profile-pic/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete image');
    }

    return data;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user profile');
    }

    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data;
  } catch (error) {
    console.error('Update error:', error);
    throw error;
  }
}; 