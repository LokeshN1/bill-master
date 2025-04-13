import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getAllItems, createBill, updateBill, updateTable, getBillById } from '../api/api';

// Create the context
const BillContext = createContext();

// Create a custom hook to use the context
export const useBill = () => useContext(BillContext);

// Helper functions for localStorage with expiry
const saveToLocalStorage = (key, data, expiryInMinutes = 10) => {
  const now = new Date();
  const item = {
    value: data,
    expiry: now.getTime() + (expiryInMinutes * 60 * 1000),
  };
  localStorage.setItem(key, JSON.stringify(item));
};

const getFromLocalStorage = (key) => {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;
  
  try {
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    // Check if the item has expired
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  } catch (e) {
    console.error('Error parsing localStorage item:', e);
    return null;
  }
};

// Debounce function to prevent too many state updates
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const BillProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [bill, setBill] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [savedBillId, setSavedBillId] = useState(null);
  const [savedBillNumber, setSavedBillNumber] = useState(null);
  const [currentTableData, setCurrentTableData] = useState(null);
  const [tableBills, setTableBills] = useState({});
  const [isTableSwitching, setIsTableSwitching] = useState(false);
  
  // Use debounced version of localStorage save to prevent performance issues
  const debouncedSaveToLocalStorage = useCallback(
    debounce((key, data, expiryInMinutes) => {
      saveToLocalStorage(key, data, expiryInMinutes);
    }, 300),
    []
  );
  
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
    
    // Try to restore tableBills from localStorage on initial load
    const savedTableBills = getFromLocalStorage('tableBills');
    if (savedTableBills) {
      console.log('Restoring bills from localStorage backup');
      setTableBills(savedTableBills);
    }
  }, []);
  
  // Save tableBills to localStorage whenever it changes, but less frequently
  useEffect(() => {
    if (Object.keys(tableBills).length > 0) {
      // Use debounced version to improve performance
      debouncedSaveToLocalStorage('tableBills', tableBills);
    }
  }, [tableBills, debouncedSaveToLocalStorage]);

  // SIMPLIFIED: Fetch a table's bill from database if it has one
  const fetchTableBill = useCallback(async (tableData) => {
    if (!tableData || !tableData.lastBillId) return null;
    
    try {
      const billData = await getBillById(tableData.lastBillId);
      
      if (billData) {
        // Transform the bill data back into our format
        return {
          billItems: billData.items.map(item => ({
            _id: item.itemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          billId: billData._id,
          billNumber: billData.billNumber
        };
      }
    } catch (error) {
      console.error(`Error fetching bill for table ${tableData.tableNumber}:`, error);
    }
    
    return null;
  }, []);

  // Update the current table data in a callback to reduce renders
  const updateCurrentTableStatus = useCallback((status, lastBillId = null) => {
    setCurrentTableData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status,
        lastBillId
      };
    });
  }, []);

  // Batch update bill state with one render
  const batchUpdateBillState = useCallback((billItems, billId, billNumber) => {
    // Use React 18 automatic batching - put all state updates in the same event handler
    const update = () => {
      setBill(billItems);
      setSavedBillId(billId);
      setSavedBillNumber(billNumber);
    };
    update();
  }, []);

  // FUNDAMENTAL CHANGE: Set the current table data with proper bill handling
  const setTableData = useCallback(async (tableData) => {
    // If trying to select the same table, do nothing to prevent flickering
    if (currentTableData && tableData && currentTableData._id === tableData._id) {
      return;
    }

    // Prevent rapid table switching
    if (isTableSwitching) return;
    setIsTableSwitching(true);
    
    try {
      // First, pre-load the bill data for the new table to minimize layout shifting
      let newTableBillData = null;
      
      if (tableData && tableData._id) {
        // Check memory first
        if (tableBills[tableData._id] && tableBills[tableData._id].billItems) {
          newTableBillData = {
            billItems: tableBills[tableData._id].billItems,
            billId: tableBills[tableData._id].billId,
            billNumber: tableBills[tableData._id].billNumber
          };
        } 
        // If not in memory but has lastBillId, fetch from database
        else if (tableData.lastBillId) {
          try {
            const fetchedBill = await fetchTableBill(tableData);
            if (fetchedBill) {
              newTableBillData = fetchedBill;
            }
          } catch (error) {
            console.error("Error pre-fetching bill:", error);
          }
        }
        // Last attempt: Check localStorage
        else {
          const localTableBill = getFromLocalStorage(`table_${tableData._id}_bill`);
          if (localTableBill && localTableBill.billItems && localTableBill.billItems.length > 0) {
            newTableBillData = {
              billItems: localTableBill.billItems,
              billId: localTableBill.billId,
              billNumber: localTableBill.billNumber
            };
          }
        }
      }
      
      // 1. Save current bill to memory if it exists and associated with a table
      if (currentTableData && currentTableData._id && bill.length > 0) {
        console.log(`Saving bill for table ${currentTableData.tableNumber} to memory`);
        
        const updatedTableBills = {
          ...tableBills,
          [currentTableData._id]: {
            billItems: [...bill],
            billId: savedBillId,
            billNumber: savedBillNumber,
            tableNumber: currentTableData.tableNumber,
            lastUpdated: new Date().toISOString()
          }
        };
        
        // Update memory immediately but don't trigger UI updates
        setTableBills(updatedTableBills);
        
        // Save to localStorage in background
        setTimeout(() => {
          saveToLocalStorage(`table_${currentTableData._id}_bill`, updatedTableBills[currentTableData._id], 30);
          
          // Set table status to occupied if it has items
          if (bill.length > 0 && currentTableData.status !== 'occupied') {
            updateTable(currentTableData._id, { status: 'occupied' })
              .catch(error => console.error('Error updating previous table status:', error));
          }
        }, 0);
      }
      
      // 2. Set the new table and bill data in a single update to prevent flickering
      // This is the most crucial change to fix UI shaking
      if (tableData) {
        setCurrentTableData(tableData);
        setSelectedTable(tableData.tableNumber);
        
        // If we have bill data for the new table, set it immediately
        if (newTableBillData) {
          batchUpdateBillState(
            newTableBillData.billItems || [],
            newTableBillData.billId || null,
            newTableBillData.billNumber || null
          );
        } else {
          batchUpdateBillState([], null, null);
        }
      } else {
        // No table selected
        setCurrentTableData(null);
        setSelectedTable(null);
        batchUpdateBillState([], null, null);
      }
      
      // Skip the async loading since we already pre-loaded the data
    } finally {
      setTimeout(() => {
        setIsTableSwitching(false);
      }, 50); // Reduced delay for smoother switching
    }
  }, [bill, currentTableData, tableBills, savedBillId, savedBillNumber, isTableSwitching, fetchTableBill, batchUpdateBillState]);

  // Add item to the bill - optimized to reduce rendering
  const addToBill = useCallback((item) => {
    // Only create new bill array once with all changes included
    setBill(prevBill => {
      const existingItem = prevBill.find(i => i._id === item._id);
      let updatedBill;
      
      if (existingItem) {
        // Increment quantity if item already exists
        updatedBill = prevBill.map(i => 
          i._id === item._id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        // Add new item with quantity 1
        // Make sure itemName is included
        const newItem = { 
          ...item, 
          quantity: 1,
          // Ensure itemName is set for validation
          itemName: item.itemName || item.name || "Unknown Item" 
        };
        updatedBill = [...prevBill, newItem];
      }
      
      // For the first item added to a bill, don't update table status immediately
      // to prevent layout shifting - do it in the background instead
      if (prevBill.length === 0 && currentTableData && currentTableData._id) {
        // Schedule status updates with a slight delay to prevent visual jank
        setTimeout(() => {
          // Update memory cache in separate operation - after UI has settled
          setTableBills(prev => {
            const tableEntry = {
              billItems: updatedBill,
              billId: savedBillId,
              billNumber: savedBillNumber,
              tableNumber: currentTableData.tableNumber,
              lastUpdated: new Date().toISOString()
            };
            
            return {
              ...prev,
              [currentTableData._id]: tableEntry
            };
          });
          
          // Update table status in the background - after UI is stable
          updateCurrentTableStatus('occupied');
          
          // Then update API in background without affecting UI responsiveness
          updateTable(currentTableData._id, {
            status: 'occupied'
          }).catch(error => {
            console.error('Error updating table status:', error);
          });
        }, 100); // Small delay to ensure bill is rendered first
      } else if (currentTableData && currentTableData._id) {
        // For subsequent items, we can update table bills in the background immediately
        // as this doesn't cause layout shifts
        setTableBills(prev => {
          const tableEntry = {
            billItems: updatedBill,
            billId: savedBillId,
            billNumber: savedBillNumber,
            tableNumber: currentTableData.tableNumber,
            lastUpdated: new Date().toISOString()
          };
          
          return {
            ...prev,
            [currentTableData._id]: tableEntry
          };
        });
      }
      
      return updatedBill;
    });
  }, [currentTableData, savedBillId, savedBillNumber, updateCurrentTableStatus]);

  // Remove item from the bill or decrease quantity - optimized
  const removeFromBill = useCallback((itemId) => {
    setBill(prevBill => {
      const existingItem = prevBill.find(i => i._id === itemId);
      let updatedBill;
      
      if (existingItem && existingItem.quantity > 1) {
        // Decrease quantity if more than 1
        updatedBill = prevBill.map(i => 
          i._id === itemId 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        );
      } else {
        // Remove item completely if quantity is 1
        updatedBill = prevBill.filter(i => i._id !== itemId);
        
        // If the bill is now empty, update the table status back to available
        if (updatedBill.length === 0 && currentTableData && currentTableData._id) {
          // Update UI immediately
          updateCurrentTableStatus('available', null);
          
          // Clear from memory
          setTableBills(prev => {
            const newBills = { ...prev };
            delete newBills[currentTableData._id];
            return newBills;
          });
          
          // Update API in background
          updateTable(currentTableData._id, {
            status: 'available',
            lastBillId: null
          }).catch(error => {
            console.error('Error updating table status:', error);
          });
          
          // Remove from localStorage in background
          setTimeout(() => {
            localStorage.removeItem(`table_${currentTableData._id}_bill`);
          }, 0);
        }
      }
      
      // Update memory cache if still items (in background)
      if (updatedBill.length > 0 && currentTableData && currentTableData._id) {
        setTimeout(() => {
          const tableEntry = {
            billItems: updatedBill,
            billId: savedBillId,
            billNumber: savedBillNumber,
            tableNumber: currentTableData.tableNumber,
            lastUpdated: new Date().toISOString()
          };
          
          setTableBills(prev => ({
            ...prev,
            [currentTableData._id]: tableEntry
          }));
          
          // Backup to localStorage with debouncing
          debouncedSaveToLocalStorage(`table_${currentTableData._id}_bill`, tableEntry, 30);
        }, 0);
      }
      
      return updatedBill;
    });
  }, [currentTableData, savedBillId, savedBillNumber, debouncedSaveToLocalStorage, updateCurrentTableStatus]);

  // Generate bill and send to backend
  const generateBill = useCallback(async (receiptFormat = 'detailed') => {
    // Just use the saveBill method to save the bill
    return await saveBill(receiptFormat);
  }, []);

  // Generate a systematic bill number
  const generateBillNumber = useCallback(() => {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Format: T[table][hour][minute]
    // If no table is selected yet, use T0 as prefix
    const tablePrefix = selectedTable ? `T${selectedTable}` : 'T0';
    
    return `${tablePrefix}${hours}${minutes}`;
  }, [selectedTable]);

  // Save bill to database without clearing
  const saveBill = useCallback(async (receiptFormat = 'detailed') => {
    if (!selectedTable || bill.length === 0) {
      console.error('Cannot save bill: Table not selected or bill is empty');
      return;
    }

    try {
      // Create a proper bill data structure to match our backend
      const billData = {
        billNumber: savedBillNumber || generateBillNumber(),
        tableNo: selectedTable,
        items: bill.map(item => ({
          itemId: item._id,
          name: item.itemName || "Item name missing",
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: bill.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        receiptFormat
      };

      let response;

      if (savedBillId) {
        // If the bill was already saved, update it instead of creating a new one
        console.log(`Updating existing bill ${savedBillId} for table ${selectedTable}`);
        response = await updateBill(savedBillId, billData);
        console.log('Bill updated successfully:', response);
      } else {
        // Send bill to the backend for storage as a new bill
        console.log(`Creating new bill for table ${selectedTable}`);
        response = await createBill(billData);
        console.log('Bill saved successfully:', response);
        
        // Store the ID of the saved bill for future updates
        if (response && response._id) {
          // Batch these updates together
          batchUpdateBillState(bill, response._id, response.billNumber);
          
          // Ensure the table is marked as occupied and linked to this bill
          if (currentTableData && currentTableData._id) {
            console.log(`Updating table ${selectedTable} status to 'occupied' and linking bill ${response._id}`);
            
            try {
              await updateTable(currentTableData._id, {
                status: 'occupied',
                lastBillId: response._id
              });
              
              // Update UI state
              updateCurrentTableStatus('occupied', response._id);
              
              // Update memory cache without re-rendering immediately
              setTimeout(() => {
                const tableEntry = {
                  billItems: [...bill],
                  billId: response._id,
                  billNumber: response.billNumber,
                  tableNumber: currentTableData.tableNumber,
                  lastUpdated: new Date().toISOString()
                };
                
                setTableBills(prev => ({
                  ...prev,
                  [currentTableData._id]: tableEntry
                }));
                
                // Save to localStorage in background
                debouncedSaveToLocalStorage(`table_${currentTableData._id}_bill`, tableEntry, 30);
              }, 0);
            } catch (tableError) {
              console.error(`Error updating table ${selectedTable}:`, tableError);
            }
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error saving bill:', error);
      throw error;
    }
  }, [bill, selectedTable, savedBillId, savedBillNumber, currentTableData, debouncedSaveToLocalStorage, batchUpdateBillState, updateCurrentTableStatus, generateBillNumber]);

  // Clear the bill - optimized for performance
  const clearBill = useCallback(async () => {
    if (!currentTableData || !currentTableData._id) {
      console.log("No table selected, nothing to clear");
      return;
    }
    
    const tableIdToUpdate = currentTableData._id;
    const tableNumber = currentTableData.tableNumber;
    
    // Clear bill state immediately in one batch
    batchUpdateBillState([], null, null);
    
    // Update UI status immediately
    updateCurrentTableStatus('available', null);
    
    // Update memory and API in background
    setTimeout(() => {
      // Remove from our table bills record
      setTableBills(prev => {
        const newTableBills = { ...prev };
        delete newTableBills[tableIdToUpdate];
        return newTableBills;
      });
      
      // Remove from ALL localStorage to ensure it's completely gone
      localStorage.removeItem(`table_${tableIdToUpdate}_bill`);
      
      // Also need to update the tableBills in localStorage to remove this table
      const savedTableBills = getFromLocalStorage('tableBills');
      if (savedTableBills && savedTableBills[tableIdToUpdate]) {
        delete savedTableBills[tableIdToUpdate];
        saveToLocalStorage('tableBills', savedTableBills);
      }
      
      // Additionally remove any legacy storage keys that might exist
      localStorage.removeItem(`bill_${tableNumber}`);
      localStorage.removeItem(`bill_table_${tableNumber}`);
      localStorage.removeItem(`bill_items_${tableNumber}`);
      
      console.log(`Completely removed bill for table ${tableNumber} from localStorage`);
      
      // Update table status in the backend
      updateTable(tableIdToUpdate, {
        status: 'available',
        lastBillId: null
      }).catch(error => {
        console.error('Error updating table status:', error);
      });
    }, 0);
    
  }, [currentTableData, batchUpdateBillState, updateCurrentTableStatus]);

  // Function to clean up expired bills from localStorage - now using a worker pattern
  const cleanExpiredBills = useCallback(() => {
    // Run in a setTimeout to prevent blocking the UI
    setTimeout(() => {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('table_') || key === 'tableBills') {
          getFromLocalStorage(key); // This will automatically remove if expired
        }
      }
    }, 0);
  }, []);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => ({
    items, 
    bill, 
    selectedTable, 
    setSelectedTable: (tableNumber) => {
      // This is now just a convenience method
      if (!tableNumber) {
        setTableData(null);
      }
      // Actual table setting should use setTableData with full table object
    },
    currentTableData,
    setTableData, 
    addToBill, 
    removeFromBill, 
    clearBill,
    generateBill,
    saveBill,
    savedBillId,
    tableBills,
    isTableSwitching,
    cleanExpiredBills,
    generateBillNumber
  }), [
    items, bill, selectedTable, currentTableData, setTableData, 
    addToBill, removeFromBill, clearBill, generateBill, saveBill, 
    savedBillId, tableBills, isTableSwitching, cleanExpiredBills, generateBillNumber
  ]);

  return (
    <BillContext.Provider value={contextValue}>
      {children}
    </BillContext.Provider>
  );
};

// Export as a named export for consistency
export { BillContext };

// Export the provider component as the default export
export default BillProvider;
