import Bill from "../model/bill.model.js";

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { billNumber, tableNo, items, totalAmount, receiptFormat } = req.body;
    
    // Log the request body for debugging
    console.log("Creating bill with data:", JSON.stringify(req.body, null, 2));

    if (!tableNo || !items || items.length === 0) {
      return res.status(400).json({ message: "Table number and items are required" });
    }

    // Check if all items have names
    const itemsWithoutNames = items.filter(item => !item.name);
    if (itemsWithoutNames.length > 0) {
      console.error("Items missing names:", itemsWithoutNames);
      // Add default names to items without names
      itemsWithoutNames.forEach(item => {
        item.name = "Item " + item.itemId || "Unknown Item";
      });
    }

    // Generate a bill number if not provided
    let billNumberToUse = billNumber;
    if (!billNumberToUse) {
      const date = new Date();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      billNumberToUse = `T${tableNo}${hours}${minutes}`;
    }
    
    // Calculate total amount if not provided
    let calculatedTotal = totalAmount;
    if (!calculatedTotal) {
      calculatedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    const newBill = new Bill({
      billNumber: billNumberToUse,
      tableNo,
      items,
      totalAmount: calculatedTotal,
      receiptFormat: receiptFormat || 'detailed'
    });

    const savedBill = await newBill.save();
    res.status(201).json(savedBill);
  } catch (error) {
    console.error("Error creating bill:", error);
    
    // Check for duplicate key error
    if (error.code === 11000) {
      console.error("Duplicate key error. Details:", error.keyValue);
      
      // Try with a slightly modified bill number to make it unique
      try {
        // Generate a unique bill number
        const date = new Date();
        // Use the tableNo from req.body that was originally passed in
        const reqTableNo = req.body.tableNo;
        const uniqueBillNumber = `T${reqTableNo}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
        
        // Create a new bill object since the previous one might be corrupted
        const retryBill = new Bill({
          billNumber: uniqueBillNumber,
          tableNo: reqTableNo,
          items: req.body.items,
          totalAmount: calculatedTotal,
          receiptFormat: req.body.receiptFormat || 'detailed'
        });
        
        // Explicitly add billNo field to null out the old index value
        if (error.keyPattern && error.keyPattern.billNo) {
          // This is a direct MongoDB operation to work around the schema
          retryBill.$__.$setCalled.add('billNo');
          retryBill.$__.activePaths.states.modify.add('billNo');
          retryBill.$__dirty();
          retryBill._doc.billNo = uniqueBillNumber; // Set to a unique value instead of null
        }
        
        const savedBill = await retryBill.save();
        console.log("Successfully saved bill after fixing duplicate key error");
        return res.status(201).json(savedBill);
      } catch (retryError) {
        console.error("Error in retry after duplicate key:", retryError);
        return res.status(500).json({ 
          message: "Error creating bill after fixing duplicate key",
          details: retryError.message
        });
      }
      
      // If retry failed, return an error response
      return res.status(400).json({ 
        message: "A bill with this bill number already exists",
        details: error.keyValue 
      });
    }
    
    res.status(500).json({ message: "Internal Server Error", details: error.message });
  }
};

// Get all bills
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error("Error fetching bills:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a bill by ID
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    res.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a bill by ID
export const updateBill = async (req, res) => {
  try {
    // No longer need to set billNo
    
    const updatedBill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedBill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(updatedBill);
  } catch (error) {
    console.error("Error updating bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a bill by ID
export const deleteBill = async (req, res) => {
  try {
    const deletedBill = await Bill.findByIdAndDelete(req.params.id);
    if (!deletedBill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Error deleting bill:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Helper function to generate a systematic bill number
const generateSystematicBillNumber = () => {
  const date = new Date();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // In the backend, we don't know the table number yet when this function is called
  // Use T0 as a default prefix - it should be overridden by the frontend's billNumber
  return `T0${hours}${minutes}`;
};
