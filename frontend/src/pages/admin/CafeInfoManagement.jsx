import React, { useState, useEffect } from "react";
import { getCafeInfo, updateCafeInfo } from "../../api/api";
import { axiosInstance } from "../../lib/axios";

const CafeInfoManagement = () => {
  const [cafeInfo, setCafeInfo] = useState({
    name: "Café Ullasa",
    address: "123, Street Name, City, Uttarakhand",
    contact: "+91 9876543210",
    gstNumber: "07AABCU9603R1Z2",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [backendStatus, setBackendStatus] = useState("connecting");

  // Fetch café info from backend
  useEffect(() => {
    const fetchCafeInfo = async () => {
      try {
        setLoading(true);
        setBackendStatus("connecting");
        
        try {
          const data = await getCafeInfo();
          setCafeInfo(data);
          setBackendStatus("connected");
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setBackendStatus("not-found");
            // Endpoint doesn't exist, use default values
            setCafeInfo({
              name: "Café Ullasa",
              address: "123, Street Name, City, Uttarakhand",
              contact: "+91 9876543210",
              gstNumber: "07AABCU9603R1Z2",
            });
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Error fetching café info:", error);
        
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          setBackendStatus("no-connection");
          setError("Cannot connect to the backend server. Please make sure it's running.");
        } else {
          setBackendStatus("error");
          setError("Failed to load café information. Please try again later.");
        }
        
        // Use default values
        setCafeInfo({
          name: "Café Ullasa",
          address: "123, Street Name, City, Uttarakhand",
          contact: "+91 9876543210",
          gstNumber: "07AABCU9603R1Z2",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCafeInfo();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCafeInfo({
      ...cafeInfo,
      [name]: value,
    });
  };

  // Create info endpoint if it doesn't exist
  const createInfoEndpoint = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await axiosInstance.post(`/info`, cafeInfo);
      setCafeInfo(response.data);
      setBackendStatus("connected");
      setSuccessMessage("Café information created successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return true;
    } catch (error) {
      console.error("Error creating café info:", error);
      setError("Failed to create café information. Please check if your backend server is running.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Submit form to update café info
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      // If endpoint was not found, try to create it first
      if (backendStatus === "not-found") {
        const created = await createInfoEndpoint();
        if (!created) return;
      }
      
      try {
        const result = await updateCafeInfo(cafeInfo);
        setCafeInfo(result);
        setSuccessMessage("Café information updated successfully!");
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Try to create the endpoint instead
          const created = await createInfoEndpoint();
          if (!created) return;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error updating café info:", error);
      
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        setError("Cannot connect to the backend server. Please make sure it's running.");
      } else {
        setError("Failed to update café information. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Café Information</h2>
      
      {backendStatus === "no-connection" && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Backend Connection Issue</p>
          <p>Cannot connect to the backend server. Please make sure it's running on port 5000 (or check your vite.config.js proxy settings).</p>
          <p className="mt-2 text-sm">You can still edit the information, but changes won't be saved to the server.</p>
        </div>
      )}
      
      {backendStatus === "not-found" && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">API Endpoint Not Found</p>
          <p>The /api/info endpoint doesn't exist on your backend. When you save, we'll try to create it.</p>
          <p className="mt-2 text-sm">Make sure your backend server supports this endpoint.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading café information...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="max-w-lg">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Café Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={cafeInfo.name}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={cafeInfo.address}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contact">
              Contact Number
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={cafeInfo.contact}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="gstNumber">
              GST Number
            </label>
            <input
              type="text"
              id="gstNumber"
              name="gstNumber"
              value={cafeInfo.gstNumber}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div className="flex items-center">
            <button
              type="submit"
              disabled={saving || backendStatus === "no-connection"}
              className={`${
                saving ? 'bg-blue-400' : (backendStatus === "no-connection" ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700')
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center`}
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : backendStatus === "not-found" ? (
                'Create Café Info'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CafeInfoManagement; 