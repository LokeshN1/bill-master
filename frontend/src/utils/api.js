/**
 * API utility for making requests to the backend
 */

// Base URL for API requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get full API URL
 * @param {string} endpoint - API endpoint (e.g., "/items")
 * @returns {string} Full API URL
 */
export const getApiUrl = (endpoint) => {
  // If the endpoint already starts with "/api", we use it as-is
  // This will be automatically proxied by Vite in development
  if (endpoint.startsWith('/api/')) {
    return endpoint;
  }
  
  // Otherwise, add /api/ prefix
  // We ensure the endpoint starts with a slash
  const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `/api${sanitizedEndpoint}`;
};

/**
 * Make a GET request to the API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Response data
 */
export const get = async (endpoint) => {
  try {
    const response = await fetch(getApiUrl(endpoint));
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API GET Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make a POST request to the API
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {Promise<any>} Response data
 */
export const post = async (endpoint, data) => {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API POST Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make a PUT request to the API
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data
 * @returns {Promise<any>} Response data
 */
export const put = async (endpoint, data) => {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API PUT Error for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Make a DELETE request to the API
 * @param {string} endpoint - API endpoint
 * @returns {Promise<any>} Response data
 */
export const del = async (endpoint) => {
  try {
    const response = await fetch(getApiUrl(endpoint), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API DELETE Error for ${endpoint}:`, error);
    throw error;
  }
};

// Export all API methods 
export default {
  get,
  post,
  put,
  delete: del,
  getApiUrl
}; 