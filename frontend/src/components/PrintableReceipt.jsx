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
    <div className="receipt-container text-sm leading-relaxed">
      <div className="receipt-header text-center mb-4">
        <h1 className="text-xl font-extrabold mb-2">{cafeDetails.name}</h1>
        <p className="text-sm mb-1 font-semibold">{cafeDetails.address}</p>
        <p className="text-sm font-semibold">PH.: {cafeDetails.contact || cafeDetails.phone}</p>
      </div>
      
      <div className="receipt-info mb-3">
        <div className="grid grid-cols-2 gap-1 text-sm">
          <div className="font-semibold">Date: {formattedDate}</div>
          <div className="font-semibold">Dine In: {tableNo || bill.length}</div>
          <div className="font-semibold">Time: {formattedTime}</div>
          <div className="font-semibold">Bill No.: {billNumber}</div>
          <div className="font-semibold">Cashier: {cafeDetails.cashierName || 'Staff'}</div>
        </div>
      </div>
      
      <hr className="my-3 border-gray-300 border-t-2" />
      
      {bill.length > 0 ? (
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1 font-extrabold w-1/2">Item</th>
              <th className="text-center py-1 font-extrabold w-12">Qty.</th>
              <th className="text-right py-1 font-extrabold w-20">Price</th>
              <th className="text-right py-1 font-extrabold w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-1.5 break-words whitespace-normal font-semibold">{item.itemName || item.name}</td>
                <td className="text-center py-1.5 font-semibold">{item.quantity}</td>
                <td className="text-right py-1.5 font-semibold">{formatCurrency(item.price)}</td>
                <td className="text-right py-1.5 font-semibold">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-4 text-sm font-semibold">No items added</p>
      )}
      
      {/* <hr className="my-3 border-gray-300 border-t-2" /> */}
      
      <div className="mb-3">
        <div className="flex justify-between text-sm font-semibold">
          <span>Total Qty: {bill.reduce((sum, item) => sum + item.quantity, 0)}</span>
          <span className="font-bold">Sub Total</span>
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="total-section mb-4 bg-gray-50 p-2 ">
        <div className="flex justify-between text-base font-extrabold">
          <span>Grand Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="receipt-footer text-center text-sm mt-6 font-semibold">
        <p>Thanks For Visiting Us !!</p>
      </div>
    </div>
  );
});

// Add display name for debugging
PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt; 