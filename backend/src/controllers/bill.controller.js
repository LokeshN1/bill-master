import Bill from "../model/bill.model.js";

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const { billNumber, tableNo, items, totalAmount, receiptFormat } = req.body;

    if (!tableNo || !items || items.length === 0) {
      return res.status(400).json({ message: "Table number and items are required" });
    }

    // Generate a bill number if not provided
    const billNumberToUse = billNumber || `BILL-${Math.floor(Math.random() * 10000)}`;
    
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
    res.status(500).json({ message: "Internal Server Error" });
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
