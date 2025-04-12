import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useBill } from '../context/BillContext';
import { 
  getAllTables, 
  getTablesWithStatus,
  createTable, 
  deleteTable as deleteTableApi, 
  bulkCreateTables 
} from '../api/api';
import './TableSelection.css';

// Function to format table number, skipping 13 and handling special cases like 12A, 12B, etc.
const formatTableNumber = (num) => {
    // If num is a string and has a format like "12A" or "Custom Name", return as is
    if (typeof num === 'string') {
        return num;
    }
    
    // Convert to number to handle numeric comparisons
    const tableNum = Number(num);
    
    // Skip table 13 (considered unlucky)
    if (tableNum > 13) {
        return String(tableNum - 1);
    } else if (tableNum === 13) {
        return "14";
    } else if (tableNum === 12) {
        return "12";
    } else {
        return String(tableNum);
    }
};

// Helper function to generate the next letter suffix after Z
const getNextSuffix = (currentSuffix) => {
    if (!currentSuffix) return 'A';
    
    // If single letter
    if (currentSuffix.length === 1) {
        // If Z, go to AA
        if (currentSuffix === 'Z') {
            return 'AA';
        } else {
            // Otherwise increment the letter
            return String.fromCharCode(currentSuffix.charCodeAt(0) + 1);
        }
    } 
    // If multi-letter (AA, AB, etc.)
    else {
        // Get the last letter
        const lastChar = currentSuffix.charAt(currentSuffix.length - 1);
        const restChars = currentSuffix.substring(0, currentSuffix.length - 1);
        
        // If last letter is Z, increment the prefix and reset last letter to A
        if (lastChar === 'Z') {
            return getNextSuffix(restChars) + 'A';
        } else {
            // Otherwise just increment the last letter
            return restChars + String.fromCharCode(lastChar.charCodeAt(0) + 1);
        }
    }
};

// Function to get next table number in sequence
const getNextTableNumber = (tables) => {
    if (tables.length === 0) return 1;
    
    // Extract tableNumber from DB objects if needed
    const tableNumbers = tables.map(t => 
        typeof t === 'object' && t.tableNumber !== undefined ? t.tableNumber : t
    );
    
    // First, let's check for table 12 variants specifically
    const table12Variants = [];
    
    tableNumbers.forEach(t => {
        // Check if it's a number 12 or string '12'
        if (t === 12 || t === '12') {
            table12Variants.push(t);
        }
        // Check if it's a string starting with '12' followed by uppercase letters only
        else if (typeof t === 'string' && t.startsWith('12') && /^12[A-Z]+$/.test(t)) {
            table12Variants.push(t);
        }
    });
    
    if (table12Variants.length > 0) {
        // If we only have the plain table 12 and no variants, add 12A
        if (table12Variants.length === 1 && (table12Variants[0] === 12 || table12Variants[0] === '12')) {
            return '12A';
        }
        
        // Extract all suffixes from table 12 variants
        const suffixes = [];
        table12Variants.forEach(t => {
            if (typeof t === 'string' && t.length > 2) {
                suffixes.push(t.substring(2));
            }
        });
        
        if (suffixes.length > 0) {
            // First sort by length, then alphabetically within each length
            const sortedSuffixes = [...suffixes].sort((a, b) => {
                if (a.length !== b.length) {
                    return a.length - b.length;
                }
                return a.localeCompare(b);
            });
            
            // Get the last suffix and generate the next one
            const lastSuffix = sortedSuffixes[sortedSuffixes.length - 1];
            const nextSuffix = getNextSuffix(lastSuffix);
            
            return `12${nextSuffix}`;
        } else {
            return '12A';
        }
    }
    
    // For regular table numbering, find max and add 1
    const numericTables = tableNumbers.filter(t => 
        typeof t === 'number' || (typeof t === 'string' && !isNaN(Number(t)))
    );
    
    if (numericTables.length === 0) {
        return 1;
    }
    
    let maxTable = Math.max(...numericTables.map(t => Number(t)));
        
    // Skip table 13
    if (maxTable === 12) {
        // If max is 12, next would be 14 (skip 13)
        return 14;
    } else if (maxTable >= 13) {
        // If max is already past 13, increment by 1
        return maxTable + 1;
    } else {
        // Otherwise, just increment by 1
        return maxTable + 1;
    }
};

// Create a memoized Table component to prevent unnecessary re-renders
const Table = memo(({ table, selectedTable, onTableClick, hasLocalBill }) => {
  // Determine the class based on status and selection outside render to reduce calculations
  // If there's a local bill, override the server status to always show as occupied
  const tableClass = 
    table.tableNumber === selectedTable ? 'table-card selected' : 
    hasLocalBill || table.status === 'occupied' ? 'table-card occupied' : 
    'table-card';

  return (
    <div 
      className={tableClass}
      onClick={() => onTableClick(table)}
    >
      <h3>Table {table.tableNumber}</h3>
      {/* <p>Status: {hasLocalBill || table.status === 'occupied' ? 'occupied' : 'available'}</p> */}
      {(hasLocalBill || table.status === 'occupied') && <div className="status-indicator"></div>}
    </div>
  );
});

// Main TableSelection component
const TableSelection = () => {
    const { selectedTable, setTableData, bill, currentTableData, tableBills, savedBillId, isTableSwitching } = useBill();
    const [tables, setTables] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isManagingTables, setIsManagingTables] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showCustomTableModal, setShowCustomTableModal] = useState(false);
    const [numTablesToAdd, setNumTablesToAdd] = useState(1);
    const [customTableName, setCustomTableName] = useState('');
    const [error, setError] = useState(null);
    const bulkModalRef = useRef(null);
    const customModalRef = useRef(null);
    const refreshTimerRef = useRef(null);
    const lastTableUpdateRef = useRef(Date.now());
    const tableDataCacheRef = useRef({});
    const initialLoadCompleteRef = useRef(false);
    
    // Memoize this function to prevent recreating it on each render
    const fetchTables = useCallback(async (silent = false) => {
        // Skip frequent updates once initially loaded
        if (silent && initialLoadCompleteRef.current) {
            const now = Date.now();
            // Only refresh every 30 seconds at most when in silent mode
            if (now - lastTableUpdateRef.current < 30000) {
                return;
            }
        }

        if (!silent) {
            setIsLoading(true);
        }
        
        try {
            // Only use the full status endpoint on initial load, then use simpler endpoint
            const data = initialLoadCompleteRef.current && silent
                ? await getAllTables() // Faster API call for background refreshes
                : await getTablesWithStatus(); // Detailed call for initial load
            
            // Apply local bill status overrides - this is crucial for performance
            const tablesWithLocalStatus = data.map(table => {
                // If we have a local bill for this table, it's always occupied regardless of backend status
                const hasLocalBill = tableBills[table._id] && 
                                    tableBills[table._id].billItems && 
                                    tableBills[table._id].billItems.length > 0;
                
                if (hasLocalBill) {
                    return {
                        ...table,
                        // Only override if the API disagrees with our local state
                        status: 'occupied'
                    };
                }
                
                return table;
            });
            
            // Update the cache with the latest table data
            tablesWithLocalStatus.forEach(table => {
                tableDataCacheRef.current[table._id] = table;
            });
            
            setTables(tablesWithLocalStatus);
            
            // Only do currentTableData updates on initial load and explicit refreshes
            if (!silent || !initialLoadCompleteRef.current) {
                // If we have a selected table, make sure it's updated with latest data
                if (selectedTable && currentTableData) {
                    const updatedSelectedTable = tablesWithLocalStatus.find(t => 
                        t.tableNumber === selectedTable && t._id === currentTableData._id
                    );
                    
                    if (updatedSelectedTable) {
                        // Only update if there's a critical change that's not already reflected
                        const currentHasBill = bill.length > 0 || savedBillId;
                        const serverSaysOccupied = updatedSelectedTable.status === 'occupied';
                        
                        // Only update when server state and local state disagree
                        if ((currentHasBill && !serverSaysOccupied) || (!currentHasBill && serverSaysOccupied)) {
                            setTableData(updatedSelectedTable);
                        }
                    }
                }
            }
            
            setError(null);
            lastTableUpdateRef.current = Date.now();
            initialLoadCompleteRef.current = true;
        } catch (err) {
            console.error('Error fetching tables:', err);
            
            if (!silent) {
                setError('Failed to fetch tables. Using backup data if available.');
                
                try {
                    // Simple fallback
                    const fallbackData = await getAllTables();
                    setTables(fallbackData);
                    initialLoadCompleteRef.current = true;
                } catch (fallbackErr) {
                    console.error('Fallback also failed:', fallbackErr);
                    if (Object.keys(tableDataCacheRef.current).length > 0) {
                        setTables(Object.values(tableDataCacheRef.current));
                    }
                }
            }
        } finally {
            if (!silent) {
                setIsLoading(false);
            }
        }
    }, [selectedTable, currentTableData, setTableData, tableBills, bill, savedBillId]);

    // Set up automatic refresh at regular intervals - but less frequent
    useEffect(() => {
        // Initial load
        fetchTables();
        
        // Set up interval for background refresh every 30 seconds
        refreshTimerRef.current = setInterval(() => {
            fetchTables(true); // Silent refresh
        }, 30000); // Increased to 30 seconds for better performance
        
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, [fetchTables]);

    // Handle table selection
    const handleTableClick = useCallback((table) => {
        // Prevent selecting the same table again or during table switching
        if (
            (selectedTable === table.tableNumber && table._id === currentTableData?._id) ||
            isTableSwitching
        ) {
            return;
        }
        
        // Apply local bill status before updating context
        const hasLocalBill = tableBills[table._id] && 
                           tableBills[table._id].billItems && 
                           tableBills[table._id].billItems.length > 0;
                           
        const tableWithCorrectStatus = {
            ...table,
            // Use local state to determine status instead of waiting for API
            status: hasLocalBill ? 'occupied' : table.status
        };
        
        // Update the table data in the BillContext
        setTableData(tableWithCorrectStatus);
        
        // Update cache
        tableDataCacheRef.current[table._id] = tableWithCorrectStatus;
    }, [selectedTable, currentTableData, setTableData, isTableSwitching, tableBills]);

    // Add a single new table
    const addTable = async () => {
        try {
            const nextTableNumber = getNextTableNumber(tables);
            console.log("Attempting to add table with number:", nextTableNumber);
            
            if (!nextTableNumber) {
                alert("Invalid table number. Please try again.");
                return;
            }
            
            const tableData = {
                tableNumber: nextTableNumber,
                status: 'available'
            };
            
            const newTable = await createTable(tableData);
            console.log("Table created successfully:", newTable);
            setTables([...tables, newTable]);
        } catch (err) {
            console.error("Error adding table:", err);
            
            // More user-friendly error message
            if (err.response && err.response.data) {
                alert(`Failed to create new table: ${err.response.data.message || err.message}`);
            } else {
                alert("Failed to create new table. Please try again.");
            }
        }
    };
    
    // Add a custom named table
    const addCustomTable = async () => {
        if (!customTableName.trim()) {
            alert('Please enter a table name');
            return;
        }
        
        const trimmedName = customTableName.trim();
        
        // Check for duplicate table names
        if (tables.some(t => t.tableNumber === trimmedName)) {
            alert('A table with this name already exists');
            return;
        }
        
        // Special handling for 12XX format tables to avoid sequence conflicts
        if (/^12[A-Z]+$/.test(trimmedName)) {
            // Check if this would conflict with the auto-generated sequence
            const nextAutoTable = getNextTableNumber([...tables]);
            
            // If the custom name is the same as what would be auto-generated,
            // we should warn the user because this could cause duplicates later
            if (nextAutoTable === trimmedName) {
                const confirmAdd = window.confirm(
                    `Table ${trimmedName} would be the next automatically generated table. ` +
                    `Adding it manually might cause numbering issues. Proceed anyway?`
                );
                
                if (!confirmAdd) {
                    return;
                }
            }
        }
        
        try {
            console.log("Attempting to add custom table with number:", trimmedName);
            
            const tableData = {
                tableNumber: trimmedName,
                status: 'available'
            };
            
            const newTable = await createTable(tableData);
            console.log("Custom table created successfully:", newTable);
            setTables([...tables, newTable]);
            setCustomTableName('');
            setShowCustomTableModal(false);
        } catch (err) {
            console.error("Error adding custom table:", err);
            
            // More user-friendly error message
            if (err.response && err.response.data) {
                alert(`Failed to create custom table: ${err.response.data.message || err.message}`);
            } else {
                alert("Failed to create custom table. Please try again.");
            }
        }
    };
    
    // Add multiple tables at once
    const bulkAddTables = async () => {
        if (numTablesToAdd <= 0 || numTablesToAdd > 100) return;
        
        const tablesToCreate = [];
        let currentTables = [...tables];
        
        for (let i = 0; i < numTablesToAdd; i++) {
            const nextTable = getNextTableNumber(currentTables);
            if (!nextTable) {
                alert("Error generating table numbers. Please try again.");
                return;
            }
            
            tablesToCreate.push({
                tableNumber: nextTable,
                status: 'available'
            });
            currentTables.push({ tableNumber: nextTable });
        }
        
        console.log("Attempting to bulk create tables:", tablesToCreate.map(t => t.tableNumber));
        
        try {
            const createdTables = await bulkCreateTables(tablesToCreate);
            console.log("Tables created successfully:", createdTables);
            setTables([...tables, ...createdTables]);
            setShowBulkAddModal(false);
            setNumTablesToAdd(1);
        } catch (err) {
            console.error("Error bulk adding tables:", err);
            
            // More user-friendly error message
            if (err.response && err.response.data) {
                alert(`Failed to create tables: ${err.response.data.message || err.message}`);
            } else {
                alert("Failed to create tables. Please try again.");
            }
        }
    };
    
    // Delete a table
    const deleteTable = async (tableNum) => {
        // Find the table object
        const tableToDelete = tables.find(t => t.tableNumber === tableNum);
        if (!tableToDelete) return;
        
        // Check if table has an active bill
        const hasActiveBill = (tableToDelete.hasBill && tableToDelete.bill) || 
                             (tableBills[tableToDelete._id] && 
                              tableBills[tableToDelete._id].billItems && 
                              tableBills[tableToDelete._id].billItems.length > 0);
        
        // Don't allow deleting if it has an active bill
        if (hasActiveBill) {
            alert("Cannot delete a table with an active bill. Please clear the bill first.");
            return;
        }
        
        // Don't allow deleting selected table or if bill has items
        if (currentTableData && currentTableData._id === tableToDelete._id && bill.length > 0) {
            alert("Can't delete this table while it has items in the bill.");
            return;
        }
        
        // If deleting the selected table, clear selection
        if (currentTableData && currentTableData._id === tableToDelete._id) {
            setTableData(null);
        }
        
        try {
            await deleteTableApi(tableToDelete._id);
            setTables(tables.filter(t => t.tableNumber !== tableNum));
        } catch (err) {
            console.error("Error deleting table:", err);
            alert("Failed to delete table. Please try again.");
        }
    };
    
    // Toggle table management mode
    const toggleManageMode = () => {
        setIsManagingTables(!isManagingTables);
    };

    // Function to display preview of tables to be added
    const getTableAddPreview = () => {
        if (numTablesToAdd <= 0) return '';
        
        let previewTables = [...tables];
        const previewResults = [];
        
        for (let i = 0; i < numTablesToAdd; i++) {
            const nextTable = getNextTableNumber(previewTables);
            previewResults.push(nextTable);
            previewTables.push({ tableNumber: nextTable });
        }
        
        return previewResults.length > 0 
            ? `${previewResults[0]} to ${previewResults[previewResults.length - 1]}`
            : '';
    };

    // Render the table components efficiently 
    const renderTables = useMemo(() => {
        return tables.map((table) => {
            // Check if this table has a local bill record which overrides server status
            const hasLocalBill = tableBills[table._id] && 
                               tableBills[table._id].billItems && 
                               tableBills[table._id].billItems.length > 0;
            
            return (
                <div key={table._id || table.tableNumber} className="relative">
                    <Table
                        table={table}
                        selectedTable={selectedTable}
                        onTableClick={handleTableClick}
                        hasLocalBill={hasLocalBill}
                    />
                    
                    {/* Delete button - only visible in manage mode */}
                    {isManagingTables && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteTable(table.tableNumber);
                            }}
                            className={`absolute -top-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center shadow-sm transition-colors ${
                                hasLocalBill || table.status === 'occupied'
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            title={(hasLocalBill || table.status === 'occupied') ? "Cannot delete table with active bill" : "Delete Table"}
                            disabled={hasLocalBill || table.status === 'occupied'}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            );
        });
    }, [tables, selectedTable, handleTableClick, isManagingTables, tableBills, deleteTable]);

    // Show loading indicator
    if (isLoading && tables.length === 0) {
        return <div className="loading">Loading tables...</div>;
    }

    // Show error message
    if (error && tables.length === 0) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-xxl font-semibold text-gray-800">Select Table</h2>
                <div className="flex gap-3">
                    <button
                        onClick={toggleManageMode}
                        className={`py-2 px-4 rounded-md text-base font-medium flex items-center transition-colors ${
                            isManagingTables 
                                ? 'bg-gray-200 text-gray-800' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title={isManagingTables ? "Exit Management Mode" : "Manage Tables"}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isManagingTables ? 'Done' : 'Manage'}
                    </button>
                    {isManagingTables && (
                        <div className="flex">
                            <button
                                onClick={() => setShowCustomTableModal(true)}
                                className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md text-base font-medium flex items-center transition-colors mr-2"
                                title="Add Custom Table"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Custom
                            </button>
                            <button
                                onClick={() => setShowBulkAddModal(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-base font-medium flex items-center transition-colors mr-2"
                                title="Add Multiple Tables"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                                </svg>
                                Bulk Add
                            </button>
                            <button
                                onClick={addTable}
                                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-base font-medium flex items-center transition-colors"
                                title="Add Single Table"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {error}
                </div>
            )}
            
            {isLoading && tables.length === 0 ? (
                <div className="py-8 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    <div className="mb-2 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Total Tables: {tables.length}</span>
                    </div>
                    
                    {/* Grid layout of tables - medium sized with 8 tables per row with scrolling for many tables */}
                    <div className={`max-h-60 overflow-y-auto pr-1 mb-2 ${tables.length > 24 ? 'custom-scrollbar' : ''}`}>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {renderTables}
                        </div>
                    </div>
                    
                    {/* Current selection display - more compact */}
                    {selectedTable && (
                        <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-200 text-center text-xs">
                            <p className="text-blue-800">
                                <span className="font-bold">Table {selectedTable}</span> selected
                            </p>
                        </div>
                    )}
                </>
            )}
            
            {/* Bulk Add Modal */}
            {showBulkAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div 
                        ref={bulkModalRef} 
                        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md p-5"
                    >
                        <h3 className="text-lg font-semibold mb-4">Add Multiple Tables</h3>
                        <div className="mb-4">
                            <label htmlFor="numTables" className="block text-sm font-medium text-gray-700 mb-1">
                                Number of Tables to Add (1-100)
                            </label>
                            <input 
                                id="numTables"
                                type="number" 
                                value={numTablesToAdd}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value, 10);
                                    if (!isNaN(value) && value >= 1 && value <= 100) {
                                        setNumTablesToAdd(value);
                                    } else if (e.target.value === '') {
                                        setNumTablesToAdd('');
                                    }
                                }}
                                min="1"
                                max="100"
                                className="shadow-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm rounded-md p-2"
                            />
                        </div>
                        
                        {numTablesToAdd > 0 && (
                            <div className="mt-2 mb-4 text-sm">
                                <p className="text-gray-600">
                                    Preview: Tables {getTableAddPreview()}
                                </p>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowBulkAddModal(false);
                                    setNumTablesToAdd(1);
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={bulkAddTables}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                                disabled={numTablesToAdd <= 0 || numTablesToAdd > 100}
                            >
                                Add Tables
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Table Name Modal */}
            {showCustomTableModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div 
                        ref={customModalRef} 
                        className="bg-white rounded-lg shadow-xl w-11/12 max-w-md p-5"
                    >
                        <h3 className="text-lg font-semibold mb-4">Add Custom Named Table</h3>
                        <div className="mb-4">
                            <label htmlFor="customTableName" className="block text-sm font-medium text-gray-700 mb-1">
                                Table Name or Number
                            </label>
                            <input 
                                id="customTableName"
                                type="text" 
                                value={customTableName}
                                onChange={(e) => setCustomTableName(e.target.value)}
                                placeholder="e.g., Patio1, VIP, 12A, etc."
                                className="shadow-sm border border-gray-300 focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm rounded-md p-2"
                            />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowCustomTableModal(false);
                                    setCustomTableName('');
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addCustomTable}
                                className="px-3 py-1.5 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600"
                                disabled={!customTableName.trim()}
                            >
                                Add Custom Table
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(TableSelection);
