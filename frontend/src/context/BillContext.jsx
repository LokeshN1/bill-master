import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAllItems, createBill, updateBill, updateTable } from '../api/api';

// Create the context
export const BillContext = createContext();

// Create a custom hook to use the context
export const useBill = () => useContext(BillContext);

export const BillProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [bill, setBill] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [savedBillId, setSavedBillId] = useState(null);
  const [savedBillNumber, setSavedBillNumber] = useState(null);
  const [currentTableData, setCurrentTableData] = useState(null);
  
  // Fetch items when component mounts
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getAllItems();
        setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
        // Use some mock data if API fails
        setItems([
          { _id: 'mock1', name: 'Coffee', price: 3.5, category: 'Beverages' },
          { _id: 'mock2', name: 'Tea', price: 2.5, category: 'Beverages' },
          { _id: 'mock3', name: 'Sandwich', price: 6.5, category: 'Food' },
          { _id: 'mock4', name: 'Cake', price: 4.5, category: 'Desserts' },
        ]);
      }
    };
    
    fetchItems();
  }, []);

  // Reset bill and table data when table selection changes
  useEffect(() => {
    if (!selectedTable) {
      setBill([]);
      setSavedBillId(null);
      setSavedBillNumber(null);
      setCurrentTableData(null);
    }
  }, [selectedTable]);

  // Add item to the bill
  const addToBill = (item) => {
    // Check if the item already exists in the bill
    const existingItem = bill.find(i => i._id === item._id);
    
    if (existingItem) {
      // Increment quantity if item already exists
      setBill(
        bill.map(i => 
          i._id === item._id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        )
      );
    } else {
      // Add new item with quantity 1
      setBill([...bill, { ...item, quantity: 1 }]);
    }
  };

  // Remove item from the bill or decrease quantity
  const removeFromBill = (itemId) => {
    const existingItem = bill.find(i => i._id === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrease quantity if more than 1
      setBill(
        bill.map(i => 
          i._id === itemId 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        )
      );
    } else {
      // Remove item completely if quantity is 1
      setBill(bill.filter(i => i._id !== itemId));
    }
  };

  // Generate bill and send to backend
  const generateBill = async (receiptFormat = 'detailed') => {
    // Just use the saveBill method to save the bill
    return await saveBill(receiptFormat);
  };

  // Save bill to database without clearing
  const saveBill = async (receiptFormat = 'detailed') => {
    if (!selectedTable || bill.length === 0) {
      console.error('Cannot save bill: Table not selected or bill is empty');
      return;
    }

    try {
      // Create a proper bill data structure to match our backend
      const billData = {
        billNumber: savedBillNumber || `BILL-${Math.floor(Math.random() * 10000)}`,
        tableNo: selectedTable,
        items: bill.map(item => ({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: bill.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        receiptFormat
      };

      let response;

      if (savedBillId) {
        // If the bill was already saved, update it instead of creating a new one
        response = await updateBill(savedBillId, billData);
        console.log('Bill updated successfully:', response);
      } else {
        // Send bill to the backend for storage as a new bill
        response = await createBill(billData);
        console.log('Bill saved successfully:', response);
        
        // Store the ID of the saved bill for future updates
        if (response && response._id) {
          setSavedBillId(response._id);
          setSavedBillNumber(response.billNumber);
          
          // If we have table data, update the table status and link to bill
          if (currentTableData && currentTableData._id) {
            await updateTable(currentTableData._id, {
              status: 'occupied',
              lastBillId: response._id
            });
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    }
  };

  // Clear the bill
  const clearBill = async () => {
    setBill([]);
    setSavedBillId(null);
    setSavedBillNumber(null);
    
    // If we have table data, update its status back to available
    if (currentTableData && currentTableData._id) {
      try {
        await updateTable(currentTableData._id, {
          status: 'available',
          lastBillId: null
        });
      } catch (error) {
        console.error('Error updating table status:', error);
      }
    }
  };

  // Set the current table data (includes table object with ID for API calls)
  const setTableData = (tableData) => {
    setCurrentTableData(tableData);
    if (tableData) {
      setSelectedTable(tableData.tableNumber);
    } else {
      setSelectedTable(null);
    }
  };

  return (
    <BillContext.Provider 
      value={{ 
        items, 
        bill, 
        selectedTable, 
        setSelectedTable,
        currentTableData,
        setTableData, 
        addToBill, 
        removeFromBill, 
        clearBill,
        generateBill,
        saveBill,
        savedBillId
      }}
    >
      {children}
    </BillContext.Provider>
  );
};

// Export as both named and default export for backward compatibility
export default BillContext;
