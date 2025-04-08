import React from 'react';

// Create a dedicated printable component using forwardRef
const PrintableReceipt = React.forwardRef(({
  cafeDetails,
  bill,
  total,
  billNumber,
  tableNo
}, ref) => {
  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const formattedTime = currentDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Helper functions
  const formatCurrency = (amount) => {
    return Number(amount).toFixed(2);
  };
  

  return (
    <div className="receipt-container text-[13px] leading-tight">
      <div className="receipt-header text-center mb-3">
        <h1 className="text-base font-bold mb-1">{cafeDetails.name}</h1>
        <p className="text-xs mb-0.5">{cafeDetails.address}</p>
        <p className="text-xs">PH.: {cafeDetails.contact || cafeDetails.phone}</p>
      </div>
      
      <div className="receipt-info mb-2">
        <div className="grid grid-cols-2 gap-0.5 text-xs">
          <div>Date: {formattedDate}</div>
          <div>Dine In: {tableNo || bill.length}</div>
          <div>Time: {formattedTime}</div>
          <div>Bill No.: {billNumber}</div>
          <div>Cashier: {cafeDetails.cashierName || 'Staff'}</div>
        </div>
      </div>
      
      <hr className="my-2 border-gray-300" />
      
      {bill.length > 0 ? (
        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-0.5 font-semibold w-1/2">Item</th>
              <th className="text-center py-0.5 font-semibold w-12">Qty.</th>
              <th className="text-right py-0.5 font-semibold w-16">Price</th>
              <th className="text-right py-0.5 font-semibold w-16">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-0.5 break-words whitespace-normal">{item.itemName || item.name}</td>
                <td className="text-center py-0.5">{item.quantity}</td>
                <td className="text-right py-0.5">{formatCurrency(item.price)}</td>
                <td className="text-right py-0.5">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-2 text-xs">No items added</p>
      )}
      
      <hr className="my-2 border-gray-300" />
      
      <div className="mb-2">
        <div className="flex justify-between text-xs">
          <span>Total Qty: {bill.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <span className="font-medium">Sub Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="total-section mb-3">
        <div className="flex justify-between text-sm font-bold">
          <span>Grand Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="receipt-footer text-center text-xs mt-4">
        <p>Thanks For Visiting Us !!</p>
      </div>
    </div>
  );
});

// Add display name for debugging
PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt; 