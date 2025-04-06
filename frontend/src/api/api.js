import { axiosInstance } from "../lib/axios";

// Fetch all items
export const getAllItems = async () => {
  try {
    const response = await axiosInstance.get(`/items`);
    return response.data;
  } catch (error) {
    console.error("Error fetching items", error);
    throw error;
  }
};

// Create a new item
export const createItem = async (itemData) => {
  try {
    const response = await axiosInstance.post(`/items`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error creating item", error);
    throw error;
  }
};

// Update an existing item
export const updateItem = async (id, itemData) => {
  try {
    const response = await axiosInstance.put(`/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error("Error updating item", error);
    throw error;
  }
};

// Delete an item
export const deleteItem = async (id) => {
  try {
    const response = await axiosInstance.delete(`/items/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting item", error);
    throw error;
  }
};

// Fetch all bills
export const getAllBills = async () => {
  try {
    const response = await axiosInstance.get(`/bills`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bills", error);
    throw error;
  }
};

// Fetch single bill by ID
export const getBillById = async (id) => {
  try {
    const response = await axiosInstance.get(`/bills/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching bill by ID", error);
    throw error;
  }
};

// Create a new bill
export const createBill = async (billData) => {
  try {
    const response = await axiosInstance.post(`/bills`, billData);
    return response.data;
  } catch (error) {
    console.error("Error creating bill", error);
    throw error;
  }
};

// Update an existing bill
export const updateBill = async (id, billData) => {
  try {
    const response = await axiosInstance.put(`/bills/${id}`, billData);
    return response.data;
  } catch (error) {
    console.error("Error updating bill", error);
    throw error;
  }
};

// Delete a bill
export const deleteBill = async (id) => {
  try {
    const response = await axiosInstance.delete(`/bills/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting bill", error);
    throw error;
  }
};

// Get cafe info
export const getCafeInfo = async () => {
  try {
    const response = await axiosInstance.get(`/info`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cafe info", error);
    throw error;
  }
};

// Update cafe info
export const updateCafeInfo = async (infoData) => {
  try {
    const response = await axiosInstance.put(`/info`, infoData);
    return response.data;
  } catch (error) {
    console.error("Error updating cafe info", error);
    throw error;
  }
}; 