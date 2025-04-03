import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useBill } from '../context/BillContext';
import api from '../utils/api';
import PrintableReceipt from './PrintableReceipt';
import SimpleReceipt from './SimpleReceipt';

const Bill = () => {
  const { bill, clearBill, saveBill, savedBillId } = useBill();
  const [cafeDetails, setCafeDetails] = useState({ name: '', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [billNumber, setBillNumber] = useState(`BILL-${Math.floor(Math.random() * 1000)}`);
  const [receiptFormat, setReceiptFormat] = useState('detailed'); // 'detailed' or 'simple'
  const [isSaving, setIsSaving] = useState(false);
  const componentRef = useRef();

  useEffect(() => {
    const fetchCafeDetails = async () => {
      try {
        setLoading(true);
        const data = await api.get('/info');
        setCafeDetails(data);
      } catch (error) {
        console.error('Error fetching cafe details:', error);
        if (error.response && error.response.status === 404) {
          setCafeDetails({
            name: 'Café Name',
            address: '123 Café Street, City',
            phone: '123-456-7890',
            email: 'info@cafe.com'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCafeDetails();
  }, []);

  // Set isBillSaved based on savedBillId
  useEffect(() => {
    // If the context says we have a saved bill ID, then the bill is saved
    if (savedBillId) {
      // Update the bill number to match the saved bill if it exists
      setBillNumber(bill && bill.billNumber ? bill.billNumber : billNumber);
    }
  }, [savedBillId, bill, billNumber]);

  // Safe printing function that handles Promise issues
  const safePrint = useCallback(() => {
    return new Promise((resolve) => {
      // Create a print iframe to avoid issues with the main page
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.onload = () => {
        try {
          // Copy styles to the iframe
          const styleSheets = document.styleSheets;
          const frameDoc = printFrame.contentDocument;
          if (!frameDoc) throw new Error('Cannot access iframe document');
          
          // Copy the receipt HTML
          if (componentRef.current) {
            frameDoc.body.innerHTML = componentRef.current.innerHTML;
            
            // Add print styles
            const style = frameDoc.createElement('style');
            style.textContent = `
              @page { size: 80mm auto !important; margin: 0mm !important; }
              body { width: 80mm !important; font-family: 'Courier New', monospace !important; }
              .no-print { display: none !important; }
              table, tr, td, th { page-break-inside: avoid !important; }
              * { color: black !important; background: white !important; }
            `;
            frameDoc.head.appendChild(style);
            
            // Print and cleanup
            setTimeout(() => {
              try {
                printFrame.contentWindow.print();
                setTimeout(() => {
                  document.body.removeChild(printFrame);
                  resolve(true);
                }, 500);
              } catch (e) {
                console.error('Print error:', e);
                document.body.removeChild(printFrame);
                resolve(false);
              }
            }, 500);
          } else {
            document.body.removeChild(printFrame);
            resolve(false);
          }
        } catch (e) {
          console.error('Print preparation error:', e);
          document.body.removeChild(printFrame);
          resolve(false);
        }
      };
      
      document.body.appendChild(printFrame);
    });
  }, []);

  // Fallback print method that doesn't rely on Promises
  const fallbackPrint = () => {
    if (!componentRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print receipts');
      return;
    }
    
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write('<style>@page { size: 80mm auto !important; margin: 0mm !important; } body { font-family: "Courier New", monospace; width: 80mm; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(componentRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.error('Fallback print error:', e);
        alert('There was an issue printing. Please try again.');
      }
    }, 500);
  };

  // Handle print with database storage
  const handlePrintAndSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // First save the bill to the database
      await saveBill(receiptFormat);
      
      // Then print it
      await safePrint().catch((err) => {
        console.error('Safe print failed:', err);
        // If safe print fails, use fallback
        fallbackPrint();
      });
      
      // Don't automatically clear the bill after printing
      // Let the user decide when to clear it
    } catch (error) {
      console.error('Print and save error:', error);
      alert('There was an error saving the bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [saveBill, receiptFormat, safePrint, fallbackPrint]);

  // Handle saving the bill only
  const handleSaveOnly = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Save the bill to the database
      const result = await saveBill(receiptFormat);
      
      // Notify the user of successful save
      alert('Bill saved successfully!');
      
    } catch (error) {
      console.error('Save error:', error);
      alert('There was an error saving the bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [saveBill, receiptFormat]);

  // Clear the bill and reset saved state
  const handleClearBill = () => {
    clearBill();
  };

  // Toggle receipt format
  const toggleReceiptFormat = () => {
    setReceiptFormat(current => current === 'detailed' ? 'simple' : 'detailed');
  };

  // Calculate total
  const total = bill.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="w-full md:w-1/3 bg-white shadow-lg p-5 h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Bill Receipt</h2>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={handlePrintAndSave}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={bill.length === 0 || isSaving}
        >
          {isSaving ? 'Processing...' : 'Print Receipt'}
        </button>
        <button
          onClick={handleSaveOnly}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={bill.length === 0 || isSaving}
        >
          {savedBillId ? 'Update Bill' : 'Save Bill'}
        </button>
        <button
          onClick={handleClearBill}
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={bill.length === 0 || isSaving}
        >
          Clear Bill
        </button>
        <button
          onClick={toggleReceiptFormat}
          className="bg-purple-500 text-white px-4 py-2 rounded"
          disabled={bill.length === 0 || isSaving}
        >
          {receiptFormat === 'detailed' ? 'Simple Format' : 'Detailed Format'}
        </button>
      </div>

      {savedBillId && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Bill saved to database</span>
        </div>
      )}

      <div className="receipt-preview bg-gray-50 p-4 rounded-lg mb-4">
        {loading ? (
          <p>Loading...</p>
        ) : bill.length > 0 ? (
          <div ref={componentRef} className="receipt-container">
            {receiptFormat === 'detailed' ? (
              <PrintableReceipt 
                cafeDetails={cafeDetails}
                bill={bill}
                total={total}
                billNumber={billNumber}
              />
            ) : (
              <SimpleReceipt
                cafeDetails={cafeDetails}
                bill={bill}
                billNumber={billNumber}
              />
            )}
          </div>
        ) : (
          <p className="text-gray-500">No items added to bill yet.</p>
        )}
      </div>
    </div>
  );
};

export default Bill;
