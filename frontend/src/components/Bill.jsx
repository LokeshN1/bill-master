import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useBill } from '../context/BillContext';
import { getCafeInfo } from '../api/api';
import PrintableReceipt from './PrintableReceipt';
import KOTReceipt from './KOTReceipt';

const Bill = () => {
  const { bill, clearBill, saveBill, savedBillId, selectedTable } = useBill();
  const [cafeDetails, setCafeDetails] = useState({ name: '', address: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [billNumber, setBillNumber] = useState(`BILL-${Math.floor(Math.random() * 1000)}`);
  const [receiptFormat, setReceiptFormat] = useState('detailed'); // 'detailed' or 'simple'
  const [isSaving, setIsSaving] = useState(false);
  const [isPrintingKOT, setIsPrintingKOT] = useState(false);
  const displayRef = useRef();
  const detailedRef = useRef();
  const kotRef = useRef();
  // Get table number from context or default to 1
  const tableNo = selectedTable || 1;

  useEffect(() => {
    const fetchCafeDetails = async () => {
      try {
        setLoading(true);
        const data = await getCafeInfo();
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

  // Safe printing function for detailed receipt
  const safePrintDetailed = useCallback(() => {
    return new Promise((resolve) => {
      // Create a print iframe to avoid issues with the main page
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.onload = () => {
        try {
          // Copy styles to the iframe
          const frameDoc = printFrame.contentDocument;
          if (!frameDoc) throw new Error('Cannot access iframe document');
          
          // Copy the receipt HTML
          if (detailedRef.current) {
            frameDoc.body.innerHTML = detailedRef.current.innerHTML;
            
            // Add print styles
            const style = frameDoc.createElement('style');
            style.textContent = `
              @page { size: 80mm auto !important; margin: 0mm !important; }
              body { width: 80mm !important; font-family: 'Courier New', monospace !important; }
              .no-print { display: none !important; }
              .receipt-container { padding: 10px !important; }
              .text-center { text-align: center !important; }
              .text-left { text-align: left !important; }
              .text-right { text-align: right !important; }
              .text-sm { font-size: 12px !important; }
              .text-xs { font-size: 10px !important; }
              .text-base { font-size: 14px !important; }
              .text-lg { font-size: 16px !important; }
              .text-xl { font-size: 18px !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              .mb-1 { margin-bottom: 4px !important; }
              .mb-2 { margin-bottom: 8px !important; }
              .mb-3 { margin-bottom: 12px !important; }
              .mb-4 { margin-bottom: 16px !important; }
              .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
              .mt-2 { margin-top: 8px !important; }
              .mt-4 { margin-top: 16px !important; }
              .py-0.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
              .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
              .border-b { border-bottom: 1px solid #ddd !important; }
              .border-gray-100 { border-color: #f7fafc !important; }
              .border-gray-200 { border-color: #edf2f7 !important; }
              .border-gray-300 { border-color: #e2e8f0 !important; }
              .w-full { width: 100% !important; }
              .w-1/2 { width: 50% !important; }
              .w-12 { width: 3rem !important; }
              .w-16 { width: 4rem !important; }
              .grid { display: grid !important; }
              .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
              .flex { display: flex !important; }
              .justify-between { justify-content: space-between !important; }
              .break-words { word-wrap: break-word !important; }
              .whitespace-normal { white-space: normal !important; }
              .gap-0.5 { gap: 2px !important; }
              .leading-tight { line-height: 1.25 !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              table, tr, td, th { page-break-inside: avoid !important; }
              th, td { vertical-align: top !important; }
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

  // Handle print with database storage
  const handlePrintAndSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // First save the bill to the database
      // Always save as detailed format for the main bill
      await saveBill('detailed');
      
      // Then print detailed receipt
      await safePrintDetailed().catch((err) => {
        console.error('Safe print failed:', err);
        // If safe print fails, use fallback
        fallbackPrintDetailed();
      });
      
      // Don't automatically clear the bill after printing
      // Let the user decide when to clear it
    } catch (error) {
      console.error('Print and save error:', error);
      alert('There was an error saving the bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [saveBill, safePrintDetailed]);

  // Fallback print method for detailed receipt
  const fallbackPrintDetailed = () => {
    if (!detailedRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this website to print receipts');
      return;
    }
    
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
        .text-base { font-size: 14px; }
        .text-lg { font-size: 16px; }
        .text-xl { font-size: 18px; }
        .font-bold { font-weight: bold; }
        .font-medium { font-weight: 500; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .my-2 { margin-top: 8px; margin-bottom: 8px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .py-0.5 { padding-top: 2px; padding-bottom: 2px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .border-b { border-bottom: 1px solid #ddd; }
        .border-gray-100 { border-color: #f7fafc; }
        .border-gray-200 { border-color: #edf2f7; }
        .border-gray-300 { border-color: #e2e8f0; }
        .w-full { width: 100%; }
        .w-1/2 { width: 50%; }
        .w-12 { width: 3rem; }
        .w-16 { width: 4rem; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .break-words { word-wrap: break-word; }
        .whitespace-normal { white-space: normal; }
        .gap-0.5 { gap: 2px; }
        .leading-tight { line-height: 1.25; }
        table { width: 100%; border-collapse: collapse; }
        th, td { vertical-align: top; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write(detailedRef.current.innerHTML);
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

  // Handle saving the bill only
  const handleSaveOnly = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Save the bill to the database (always as detailed receipt)
      const result = await saveBill('detailed');
      
      // Notify the user of successful save
      alert('Bill saved successfully!');
      
    } catch (error) {
      console.error('Save error:', error);
      alert('There was an error saving the bill. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [saveBill]);

  // Clear the bill and reset saved state
  const handleClearBill = () => {
    clearBill();
  };

  // Toggle receipt format
  const toggleReceiptFormat = () => {
    setReceiptFormat(current => current === 'detailed' ? 'simple' : 'detailed');
  };

  // Safe printing function for KOT
  const safePrintKOT = useCallback(() => {
    return new Promise((resolve) => {
      // Create a print iframe to avoid issues with the main page
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.top = '-9999px';
      printFrame.style.left = '-9999px';
      printFrame.onload = () => {
        try {
          // Copy styles to the iframe
          const frameDoc = printFrame.contentDocument;
          if (!frameDoc) throw new Error('Cannot access iframe document');
          
          // Copy the KOT HTML
          if (kotRef.current) {
            frameDoc.body.innerHTML = kotRef.current.innerHTML;
            
            // Add print styles
            const style = frameDoc.createElement('style');
            style.textContent = `
              @page { size: 80mm auto !important; margin: 0mm !important; }
              body { width: 80mm !important; font-family: 'Courier New', monospace !important; }
              .no-print { display: none !important; }
              .receipt-container { padding: 10px !important; }
              .text-center { text-align: center !important; }
              .text-left { text-align: left !important; }
              .text-right { text-align: right !important; }
              .text-sm { font-size: 12px !important; }
              .text-xs { font-size: 10px !important; }
              .text-base { font-size: 14px !important; }
              .text-lg { font-size: 16px !important; }
              .text-xl { font-size: 18px !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              .mb-1 { margin-bottom: 4px !important; }
              .mb-2 { margin-bottom: 8px !important; }
              .mb-3 { margin-bottom: 12px !important; }
              .mb-4 { margin-bottom: 16px !important; }
              .my-2 { margin-top: 8px !important; margin-bottom: 8px !important; }
              .mt-2 { margin-top: 8px !important; }
              .mt-4 { margin-top: 16px !important; }
              .py-0.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
              .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
              .border-b { border-bottom: 1px solid #ddd !important; }
              .border-gray-100 { border-color: #f7fafc !important; }
              .border-gray-200 { border-color: #edf2f7 !important; }
              .border-gray-300 { border-color: #e2e8f0 !important; }
              .w-full { width: 100% !important; }
              .w-1/2 { width: 50% !important; }
              .w-12 { width: 3rem !important; }
              .w-16 { width: 4rem !important; }
              .grid { display: grid !important; }
              .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
              .flex { display: flex !important; }
              .justify-between { justify-content: space-between !important; }
              .break-words { word-wrap: break-word !important; }
              .whitespace-normal { white-space: normal !important; }
              .gap-0.5 { gap: 2px !important; }
              .leading-tight { line-height: 1.25 !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              table, tr, td, th { page-break-inside: avoid !important; }
              th, td { vertical-align: top !important; }
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

  // Handle KOT printing
  const handlePrintKOT = useCallback(async () => {
    if (bill.length === 0) {
      alert('No items to print in KOT');
      return;
    }

    try {
      setIsPrintingKOT(true);
      
      await safePrintKOT().catch((err) => {
        console.error('Safe KOT print failed:', err);
        // If safe print fails, use fallback (add fallback here if needed)
      });
      
    } catch (error) {
      console.error('Print KOT error:', error);
      alert('There was an error printing KOT. Please try again.');
    } finally {
      setIsPrintingKOT(false);
    }
  }, [safePrintKOT, bill]);

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
          onClick={handlePrintKOT}
          className="bg-orange-500 text-white px-4 py-2 rounded"
          disabled={bill.length === 0 || isPrintingKOT}
        >
          {isPrintingKOT ? 'Printing...' : 'Print KOT'}
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
          {receiptFormat === 'detailed' ? 'KOT Format' : 'Detailed Format'}
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

      <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-inner">
        <div className="receipt-preview p-2 max-w-[300px] mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : bill.length > 0 ? (
            <div ref={displayRef} className="receipt-container bg-white p-3 shadow-sm border border-gray-100 rounded">
              {receiptFormat === 'detailed' ? (
                <PrintableReceipt 
                  cafeDetails={cafeDetails}
                  bill={bill}
                  total={total}
                  billNumber={billNumber}
                  tableNo={tableNo}
                />
              ) : (
                <KOTReceipt
                  bill={bill}
                  billNumber={billNumber}
                  tableNo={tableNo}
                />
              )}
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <p className="text-gray-500">No items added to bill yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden Receipts for Printing */}
      <div className="hidden">
        {/* Hidden Detailed Receipt */}
        <div ref={detailedRef}>
          <PrintableReceipt
            cafeDetails={cafeDetails}
            bill={bill}
            total={total}
            billNumber={billNumber}
            tableNo={tableNo}
          />
        </div>
        
        {/* Hidden KOT Receipt */}
        <div ref={kotRef}>
          <KOTReceipt
            bill={bill}
            billNumber={billNumber}
            tableNo={tableNo}
          />
        </div>
      </div>
    </div>
  );
};

export default Bill;
