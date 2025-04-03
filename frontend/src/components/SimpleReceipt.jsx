import React from 'react';

// Simple receipt component that only shows items and quantities
const SimpleReceipt = React.forwardRef(({
  cafeDetails,
  bill,
  billNumber
}, ref) => {
  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString();
  const formattedTime = currentDate.toLocaleTimeString();
  
  // Helper function to truncate text
  const truncateText = (text, maxLength = 25) => {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength - 3) + "...";
  };

  // Helper function to get item name from different possible properties
  const getItemName = (item) => {
    return item.name || item.itemName || item.item || 'Unknown Item';
  };

  return (
    <div className="receipt-container">
      <div className="receipt-header text-center mb-4">
        <h1 className="text-xl font-bold">{cafeDetails.name}</h1>
        <p className="text-sm">{cafeDetails.address}</p>
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
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1">{truncateText(getItemName(item), 25)}</td>
                <td className="text-center py-1">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-4">No items added</p>
      )}
      
      <div className="receipt-footer text-center text-xs mt-4">
        <p>Thank you for your visit!</p>
        <p>Please come again</p>
      </div>
    </div>
  );
});

// Add display name for debugging
SimpleReceipt.displayName = 'SimpleReceipt';

export default SimpleReceipt; 