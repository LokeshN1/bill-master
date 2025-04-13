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
    <div className="receipt-container text-sm leading-relaxed">
      <div className="receipt-header text-center mb-4">
        <h1 className="text-xl font-extrabold mb-2">KOT</h1>
        <p className="text-sm mb-1 font-semibold">{formattedDate} {formattedTime}</p>
        <p className="text-sm mb-1 font-semibold">{kotNumber}</p>
        <p className="text-sm mb-1 font-semibold">Dine In</p>
        <p className="text-sm font-semibold">Table No: {tableNo || 1}</p>
      </div>
      
      <hr className="my-3 border-gray-300 border-t-2" />
      
      {bill.length > 0 ? (
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-1 font-extrabold w-1/2">Item</th>
              <th className="text-left py-1 font-extrabold w-1/4">Special Note:</th>
              <th className="text-center py-1 font-extrabold w-12">Qty.</th>
            </tr>
          </thead>
          <tbody>
            {bill.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-1.5 break-words whitespace-normal font-semibold">{getItemName(item)}</td>
                <td className="py-1.5 text-sm font-semibold">--</td>
                <td className="text-center py-1.5 font-semibold">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center py-4 text-sm font-semibold">No items added</p>
      )}
    </div>
  );
});

// Add display name for debugging
KOTReceipt.displayName = 'KOTReceipt';

export default KOTReceipt; 