import React, { useImperativeHandle } from 'react';

// Create a dedicated printable component using forwardRef
const PrintableReceipt = React.forwardRef(({
  cafeDetails,
  bill,
  total,
  billNumber
}, ref) => {
  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const formattedTime = currentDate.toLocaleTimeString();
  
  // Helper functions
  const formatCurrency = (amount) => {
    return "₹" + Number(amount).toFixed(2);
  };
  
  const truncateText = (text, maxLength = 20) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + "...";
  };

  return (
    <div className="receipt-container">
      <div className="receipt-header text-center mb-4">
        <h1 className="text-xl font-bold">{cafeDetails.name}</h1>
        <p className="text-sm">{cafeDetails.address}</p>
        <p className="text-sm">Phone: {cafeDetails.phone}</p>
        {cafeDetails.email && <p className="text-sm">Email: {cafeDetails.email}</p>}
      </div>
      
      <div className="receipt-info mb-4">
        <div className="grid grid-cols-2 text-sm">
          <div><strong>Bill #:</strong> {billNumber}</div>
          <div><strong>Date:</strong> {formattedDate}</div>
          <div><strong>Time:</strong> {formattedTime}</div>
        </div>
      </div>
      
      <hr className="my-2 border-gray-300" />
      
      {bill.length > 0 ? (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1">{truncateText(item.itemName, 16)}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">{formatCurrency(item.price)}</td>
                <td className="text-right py-1">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-4">No items added</p>
      )}
      
      <hr className="my-2 border-gray-300" />
      
      <div className="total-section mb-4">
        <div className="flex justify-between">
          <span className="font-bold">Total:</span>
          <span className="font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
      
      <div className="receipt-footer text-center text-xs mt-4">
        <p>Thank you for your visit!</p>
        <p>Please come again</p>
        <p className="mt-2">* This is a computer generated receipt *</p>
      </div>
    </div>
  );
});

// Add display name for debugging
PrintableReceipt.displayName = 'PrintableReceipt';

export default PrintableReceipt; 