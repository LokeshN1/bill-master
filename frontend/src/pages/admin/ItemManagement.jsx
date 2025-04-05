import React, { useState, useEffect } from "react";
import { getAllItems, createItem, updateItem, deleteItem } from "../../api/api";

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [backendStatus, setBackendStatus] = useState("connecting");
  const [formData, setFormData] = useState({
    itemName: "",
    price: "",
    category: "",
  });

  // Fetch items from the backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setBackendStatus("connecting");
        
        try {
          const data = await getAllItems();
          setItems(data);
          setBackendStatus("connected");
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setBackendStatus("not-found");
            setError("The items API endpoint was not found. Make sure your backend server is running and has the /api/items endpoint.");
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        
        if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
          setBackendStatus("no-connection");
          setError("Cannot connect to the backend server. Please make sure it's running.");
        } else {
          setBackendStatus("error");
          setError("Failed to load items. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    });
  };

  // Open modal for adding a new item
  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      itemName: "",
      price: "",
      category: "",
    });
    setIsModalOpen(true);
  };

  // Open modal for editing an existing item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      price: item.price,
      category: item.category || "",
    });
    setIsModalOpen(true);
  };

  // Submit the form (add or update item)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (backendStatus === "no-connection") {
      setError("Cannot save: No connection to the backend server.");
      return;
    }
    
    try {
      let result;
      
      if (editingItem) {
        // Update existing item
        result = await updateItem(editingItem._id, formData);
        // Update the item in the local state
        setItems(items.map(item => 
          item._id === editingItem._id ? result : item
        ));
      } else {
        // Create new item
        result = await createItem(formData);
        // Add the new item to the local state
        setItems([...items, result]);
      }
      
      // Close the modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving item:", error);
      
      if (error.response && error.response.status === 404) {
        setError("The API endpoint was not found. Make sure your backend server has the correct routes.");
      } else {
        setError("Failed to save item. Please try again.");
      }
    }
  };

  // Delete an item
  const handleDeleteItem = async (itemId) => {
    if (backendStatus === "no-connection") {
      setError("Cannot delete: No connection to the backend server.");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(itemId);
        
        // Remove the item from the local state
        setItems(items.filter(item => item._id !== itemId));
      } catch (error) {
        console.error("Error deleting item:", error);
        
        if (error.response && error.response.status === 404) {
          setError("The API endpoint was not found. Make sure your backend server has the correct routes.");
        } else {
          setError("Failed to delete item. Please try again.");
        }
      }
    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Menu Items</h2>
        <button
          onClick={handleAddItem}
          disabled={backendStatus === "no-connection"}
          className={`${
            backendStatus === "no-connection" 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white py-2 px-4 rounded-md flex items-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Item
        </button>
      </div>

      {backendStatus === "no-connection" && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Backend Connection Issue</p>
          <p>Cannot connect to the backend server. Please make sure it's running on port 5000 (or check your vite.config.js proxy settings).</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading items...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    {backendStatus === "not-found" 
                      ? "API endpoint not found. Make sure your backend server is configured correctly."
                      : "No items found. Add some items to get started!"}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditItem(item)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="itemName">
                    Item Name
                  </label>
                  <input
                    type="text"
                    id="itemName"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="price">
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    step="1"
                    required
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  {editingItem ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement; 