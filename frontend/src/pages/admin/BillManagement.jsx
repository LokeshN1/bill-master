import React, { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { format } from "date-fns";
import PrintableReceipt from "../../components/PrintableReceipt";
import SimpleReceipt from "../../components/SimpleReceipt";

const BillManagement = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef();
  const [cafeDetails, setCafeDetails] = useState({
    name: 'Café Name',
    address: '123 Café Street, City',
    phone: '123-456-7890',
    email: 'info@cafe.com'
  });

  // Fetch bills when component mounts
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const data = await api.get('/bills');
        setBills(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bills:', err);
        setError('Failed to load bills. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // Fetch cafe details
  useEffect(() => {
    const fetchCafeDetails = async () => {
      try {
        const data = await api.get('/info');
        setCafeDetails(data);
      } catch (error) {
        console.error('Error fetching cafe details:', error);
        // Default values already set in state
      }
    };

    fetchCafeDetails();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return "₹" + Number(amount).toFixed(2);
  };

  // Handle bill deletion
  const handleDeleteBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      await api.del(`/bills/${billId}`);
      setBills(bills.filter(bill => bill._id !== billId));
      if (selectedBill && selectedBill._id === billId) {
        setSelectedBill(null);
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill. Please try again.');
    }
  };

  // Toggle expanded bill
  const toggleExpandBill = (billId) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null);
    } else {
      setExpandedBillId(billId);
    }
  };

  // View bill details
  const viewBillDetails = (bill) => {
    setSelectedBill(bill);
  };

  // Print bill
  const handlePrint = () => {
    if (!selectedBill) return;
    
    setIsPrinting(true);
    
    // Create a print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print receipts');
      setIsPrinting(false);
      return;
    }
    
    // Prepare the receipt content based on format
    let receiptContent = '';
    if (selectedBill.receiptFormat === 'detailed') {
      // Detailed receipt HTML
      receiptContent = `
        <div class="receipt-container">
          <div class="receipt-header text-center mb-4">
            <h1 class="text-xl font-bold">${cafeDetails.name}</h1>
            <p class="text-sm">${cafeDetails.address}</p>
            <p class="text-sm">Phone: ${cafeDetails.phone}</p>
            ${cafeDetails.email ? `<p class="text-sm">Email: ${cafeDetails.email}</p>` : ''}
          </div>
          
          <div class="receipt-info mb-4">
            <div class="grid grid-cols-2 text-sm">
              <div><strong>Bill #:</strong> ${selectedBill.billNumber}</div>
              <div><strong>Date:</strong> ${formatDate(selectedBill.createdAt)}</div>
              <div><strong>Table:</strong> ${selectedBill.tableNo}</div>
            </div>
          </div>
          
          <hr class="my-2 border-gray-300" />
          
          <table class="w-full text-sm mb-4">
            <thead>
              <tr class="border-b">
                <th class="text-left py-1">Item</th>
                <th class="text-center py-1">Qty</th>
                <th class="text-right py-1">Price</th>
                <th class="text-right py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedBill.items.map(item => `
                <tr class="border-b border-gray-200">
                  <td class="py-1">${item.name}</td>
                  <td class="text-center py-1">${item.quantity}</td>
                  <td class="text-right py-1">${formatCurrency(item.price)}</td>
                  <td class="text-right py-1">${formatCurrency(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <hr class="my-2 border-gray-300" />
          
          <div class="total-section mb-4">
            <div class="flex justify-between">
              <span class="font-bold">Total:</span>
              <span class="font-bold">${formatCurrency(selectedBill.totalAmount)}</span>
            </div>
          </div>
          
          <div class="receipt-footer text-center text-xs mt-4">
            <p>Thank you for your visit!</p>
            <p>Please come again</p>
            <p class="mt-2">* This is a computer generated receipt *</p>
          </div>
        </div>
      `;
    } else {
      // Simple receipt HTML
      receiptContent = `
        <div class="receipt-container">
          <div class="receipt-header text-center mb-4">
            <h1 class="text-xl font-bold">${cafeDetails.name}</h1>
            <p class="text-sm">${cafeDetails.address}</p>
          </div>
          
          <div class="receipt-info mb-4">
            <div class="grid grid-cols-2 text-sm">
              <div><strong>Bill #:</strong> ${selectedBill.billNumber}</div>
              <div><strong>Date:</strong> ${formatDate(selectedBill.createdAt)}</div>
              <div><strong>Table:</strong> ${selectedBill.tableNo}</div>
            </div>
          </div>
          
          <hr class="my-2 border-gray-300" />
          
          <table class="w-full text-sm mb-4">
            <thead>
              <tr class="border-b">
                <th class="text-left py-1">Item</th>
                <th class="text-center py-1">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${selectedBill.items.map(item => `
                <tr class="border-b border-gray-200">
                  <td class="py-1">${item.name}</td>
                  <td class="text-center py-1">${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="receipt-footer text-center text-xs mt-4">
            <p>Thank you for your visit!</p>
            <p>Please come again</p>
          </div>
        </div>
      `;
    }
    
    // Write to the print window
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write(`
      <style>
        @page { size: 80mm auto !important; margin: 0mm !important; }
        body { font-family: "Courier New", monospace; width: 80mm; }
        .receipt-container { padding: 10px; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 10px; }
        .text-xl { font-size: 18px; }
        .font-bold { font-weight: bold; }
        .mb-4 { margin-bottom: 16px; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .border-b { border-bottom: 1px solid #ddd; }
        .border-gray-200 { border-color: #eee; }
        .border-gray-300 { border-color: #ddd; }
        .w-full { width: 100%; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        table { width: 100%; border-collapse: collapse; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(receiptContent);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.error('Print error:', e);
        alert('There was an issue printing. Please try again.');
      } finally {
        setIsPrinting(false);
      }
    }, 500);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Saved Bills</h2>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">No bills found. Create some bills first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bill listing */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Bill History</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {bills.map((bill) => (
                <div 
                  key={bill._id} 
                  className={`bg-white border ${selectedBill && selectedBill._id === bill._id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition-colors`}
                  onClick={() => viewBillDetails(bill)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{bill.billNumber}</h4>
                      <p className="text-sm text-gray-500">
                        {formatDate(bill.createdAt)}
                      </p>
                      <p className="text-sm mt-1">
                        <span className="font-medium">Table:</span> {bill.tableNo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(bill.totalAmount)}</p>
                      <p className="text-xs text-gray-500">
                        {bill.items.length} {bill.items.length === 1 ? 'item' : 'items'}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${bill.receiptFormat === 'detailed' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {bill.receiptFormat === 'detailed' ? 'Detailed' : 'Simple'}
                      </span>
                    </div>
                  </div>
                  <div className="flex mt-2 justify-end space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandBill(bill._id);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {expandedBillId === bill._id ? 'Hide Items' : 'Show Items'}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBill(bill._id);
                      }}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {/* Expanded bill items */}
                  {expandedBillId === bill._id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h5 className="text-sm font-medium mb-2">Items</h5>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {bill.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>
                              {item.quantity} × {item.name}
                            </span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Bill details */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Bill Details</h3>
            
            {selectedBill ? (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-xl">{selectedBill.billNumber}</h4>
                  <div className={`px-3 py-1 rounded-full text-sm ${selectedBill.receiptFormat === 'detailed' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {selectedBill.receiptFormat === 'detailed' ? 'Detailed Receipt' : 'Simple Receipt'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p>{formatDate(selectedBill.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Table Number</p>
                    <p>{selectedBill.tableNo}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h5 className="font-medium mb-2 pb-2 border-b">Items</h5>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedBill.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1 border-b border-gray-100">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.price)}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <p className="font-bold text-lg">Total</p>
                  <p className="font-bold text-xl">{formatCurrency(selectedBill.totalAmount)}</p>
                </div>
                
                <div className="mt-6 flex gap-3 justify-end">
                  <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                  >
                    {isPrinting ? 'Printing...' : 'Print Receipt'}
                  </button>
                  <button
                    onClick={() => handleDeleteBill(selectedBill._id)}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                  >
                    Delete Bill
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 10c0 5-4.5 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9z" />
                </svg>
                <p>Select a bill to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden reference for printing */}
      <div className="hidden">
        <div ref={printRef}></div>
      </div>
    </div>
  );
};

export default BillManagement; 