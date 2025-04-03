import { useState, useEffect, useRef } from 'react';
import { useBill } from '../context/BillContext';

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
    
    // First, let's check for table 12 variants specifically
    const table12Variants = [];
    
    tables.forEach(t => {
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
    const numericTables = tables.filter(t => typeof t === 'number' || (typeof t === 'string' && !isNaN(Number(t))));
    
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

const TableSelection = () => {
    const { selectedTable, setSelectedTable, bill } = useBill();
    const [tables, setTables] = useState([]);
    const [isManagingTables, setIsManagingTables] = useState(false);
    const [showBulkAddModal, setShowBulkAddModal] = useState(false);
    const [showCustomTableModal, setShowCustomTableModal] = useState(false);
    const [numTablesToAdd, setNumTablesToAdd] = useState(1);
    const [customTableName, setCustomTableName] = useState('');
    const bulkModalRef = useRef(null);
    const customModalRef = useRef(null);
    
    // Initialize with 12 tables or load from localStorage if available
    useEffect(() => {
        const savedTables = localStorage.getItem('cafe-tables');
        if (savedTables) {
            setTables(JSON.parse(savedTables));
        } else {
            // Default: 12 tables, skipping 13
            setTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]);
        }
    }, []);
    
    // Save tables to localStorage whenever they change
    useEffect(() => {
        if (tables.length > 0) {
            localStorage.setItem('cafe-tables', JSON.stringify(tables));
        }
    }, [tables]);
    
    // Close modals when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (bulkModalRef.current && !bulkModalRef.current.contains(event.target)) {
                setShowBulkAddModal(false);
            }
            if (customModalRef.current && !customModalRef.current.contains(event.target)) {
                setShowCustomTableModal(false);
            }
        }
        
        if (showBulkAddModal || showCustomTableModal) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showBulkAddModal, showCustomTableModal]);
    
    // Add a single new table
    const addTable = () => {
        const nextTableNumber = getNextTableNumber(tables);
        setTables([...tables, nextTableNumber]);
    };
    
    // Add a custom named table
    const addCustomTable = () => {
        if (!customTableName.trim()) {
            alert('Please enter a table name');
            return;
        }
        
        const trimmedName = customTableName.trim();
        
        // Check for duplicate table names
        if (tables.includes(trimmedName)) {
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
        
        setTables([...tables, trimmedName]);
        setCustomTableName('');
        setShowCustomTableModal(false);
    };
    
    // Add multiple tables at once
    const bulkAddTables = () => {
        if (numTablesToAdd <= 0 || numTablesToAdd > 100) return;
        
        let currentTables = [...tables];
        const newTables = [];
        
        for (let i = 0; i < numTablesToAdd; i++) {
            const nextTable = getNextTableNumber(currentTables);
            newTables.push(nextTable);
            currentTables.push(nextTable);
        }
        
        setTables([...tables, ...newTables]);
        setShowBulkAddModal(false);
        setNumTablesToAdd(1);
    };
    
    // Delete a table
    const deleteTable = (tableNum) => {
        // Don't allow deleting selected table or if bill has items
        if (tableNum === selectedTable && bill.length > 0) {
            alert("Can't delete this table while it has items in the bill.");
            return;
        }
        
        // If deleting the selected table, clear selection
        if (tableNum === selectedTable) {
            setSelectedTable(null);
        }
        
        setTables(tables.filter(num => num !== tableNum));
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
            previewTables.push(nextTable);
        }
        
        return previewResults.length > 0 
            ? `${previewResults[0]} to ${previewResults[previewResults.length - 1]}`
            : '';
    };

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
                            <div className="flex">
                                <button
                                    onClick={addTable}
                                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-l-md text-base font-medium flex items-center transition-colors"
                                    title="Add New Table"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add
                                </button>
                                <button
                                    onClick={() => setShowBulkAddModal(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-r-md text-base flex items-center transition-colors border-l border-green-600"
                                    title="Add Multiple Tables"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Table count info */}
            <div className="mb-2 text-xs text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Total Tables: {tables.length}</span>
            </div>
            
            {/* Grid layout of tables - medium sized with 8 tables per row with scrolling for many tables */}
            <div className={`max-h-60 overflow-y-auto pr-1 mb-2 ${tables.length > 24 ? 'custom-scrollbar' : ''}`}>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {tables.map((num) => (
                        <div key={num} className="relative">
                            <button 
                                onClick={() => isManagingTables ? null : setSelectedTable(num)}
                                className={`flex flex-col items-center justify-center py-1 px-1 rounded border transition-all h-16 w-full ${
                                    selectedTable === num 
                                        ? 'bg-blue-600 text-white border-blue-600' 
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                } ${isManagingTables ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                {/* Medium sized table icon */}
                                <svg 
                                    className="w-6 h-6 mb-0.5" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <rect x="3" y="8" width="18" height="12" rx="2" strokeWidth="2" />
                                    <rect x="7" y="4" width="10" height="4" rx="1" strokeWidth="2" />
                                </svg>
                                <span className={`text-xs font-medium leading-none mt-1 ${typeof num === 'string' && num.length > 6 ? 'text-[10px]' : ''}`}>Table {num}</span>
                            </button>
                            
                            {/* Delete button - only visible in manage mode */}
                            {isManagingTables && (
                                <button 
                                    onClick={() => deleteTable(num)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                                    title="Delete Table"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
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
            
            {/* Bulk Add Modal */}
            {showBulkAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div ref={bulkModalRef} className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-3">Add Multiple Tables</h3>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Number of tables to add:
                            </label>
                            <input 
                                type="number" 
                                min="1" 
                                max="100"
                                value={numTablesToAdd}
                                onChange={(e) => setNumTablesToAdd(parseInt(e.target.value) || 0)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {numTablesToAdd > 0 && (
                                    <>Adding {numTablesToAdd} table(s): {getTableAddPreview()}</>
                                )}
                                <span className="text-purple-600 block mt-1">Note: Table 13 will be skipped (12 → 12A, 12B, ... 12Z → 12AA, 12AB, ... → 14)</span>
                            </p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBulkAddModal(false)}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 text-sm hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={bulkAddTables}
                                className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
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
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div ref={customModalRef} className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-semibold mb-3">Add Custom Table</h3>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-medium mb-2">
                                Custom table name:
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g., VIP, Patio, Bar Counter"
                                value={customTableName}
                                onChange={(e) => setCustomTableName(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter a descriptive name for your special table.
                            </p>
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

export default TableSelection;
