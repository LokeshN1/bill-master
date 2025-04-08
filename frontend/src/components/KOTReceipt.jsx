import React from 'react';

// Dedicated KOT (Kitchen Order Ticket) component
const KOTReceipt = React.forwardRef(({
  bill,
  billNumber,
  tableNo
}, ref) => {
  // Get current date and time
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const formattedTime = currentDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  // Helper function to get item name from different possible properties
  const getItemName = (item) => {
    return item.name || item.itemName || item.item || 'Unknown Item';
  };

  const kotNumber = billNumber ? `KOT - ${billNumber.split('-')[1] || billNumber}` : 'KOT';

  return (
    <div className="receipt-container text-[13px] leading-tight">
      <div className="receipt-header text-center mb-3">
        <h1 className="text-base font-bold mb-1">KOT</h1>
        <p className="text-xs mb-0.5">{formattedDate} {formattedTime}</p>
        <p className="text-xs mb-0.5">{kotNumber}</p>
        <p className="text-xs mb-0.5">Dine In</p>
        <p className="text-xs">Table No: {tableNo || 1}</p>
      </div>
      
      <hr className="my-2 border-gray-300" />
      
      {bill.length > 0 ? (
        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-0.5 font-semibold w-1/2">Item</th>
              <th className="text-left py-0.5 font-semibold w-1/4">Special Note:</th>
              <th className="text-center py-0.5 font-semibold w-12">Qty.</th>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-0.5 break-words whitespace-normal">{getItemName(item)}</td>
                <td className="py-0.5 text-xs">--</td>
                <td className="text-center py-0.5">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-2 text-xs">No items added</p>
      )}
    </div>
  );
});

// Add display name for debugging
KOTReceipt.displayName = 'KOTReceipt';

export default KOTReceipt; 