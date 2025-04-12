import Table from "../model/table.model.js";
import Bill from "../model/bill.model.js";

// Create a new table
export const createTable = async (req, res) => {
  try {
    const { tableNumber, status, capacity } = req.body;

    if (!tableNumber) {
      return res.status(400).json({ message: "Table number is required" });
    }

    console.log("Creating table with number:", tableNumber);

    // Check if table already exists
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({ message: "A table with this number already exists" });
    }

    const newTable = new Table({
      tableNumber,
      status: status || 'available',
      capacity: capacity || 4
    });

    const savedTable = await newTable.save();
    console.log("Table created successfully:", savedTable);
    res.status(201).json(savedTable);
  } catch (error) {
    console.error("Error creating table:", error);
    // Send more detailed error for debugging
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message,
      code: error.code 
    });
  }
};

// Get all tables
export const getAllTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ createdAt: 1 });
    res.json(tables);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a table by ID
export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }
    res.json(table);
  } catch (error) {
    console.error("Error fetching table:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a table by ID
export const updateTable = async (req, res) => {
  try {
    const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedTable) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json(updatedTable);
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a table by ID
export const deleteTable = async (req, res) => {
  try {
    // Check if table has active bills
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    if (table.lastBillId) {
      const bill = await Bill.findById(table.lastBillId);
      if (bill) {
        return res.status(400).json({ 
          message: "Cannot delete table with active bills. Please clear bills first." 
        });
      }
    }

    const deletedTable = await Table.findByIdAndDelete(req.params.id);
    if (!deletedTable) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json({ message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get tables with bill status
export const getTablesWithStatus = async (req, res) => {
  try {
    // Get all tables
    const tables = await Table.find().sort({ createdAt: 1 });
    
    // Get all bills to check which tables have active bills
    const activeBills = await Bill.find();
    
    const tablesWithStatus = tables.map(table => {
      const tableBill = activeBills.find(
        bill => bill.tableNo === table.tableNumber || 
               bill.tableNo.toString() === table.tableNumber.toString()
      );
      
      return {
        ...table.toObject(),
        hasBill: !!tableBill,
        billId: tableBill ? tableBill._id : null
      };
    });
    
    res.json(tablesWithStatus);
  } catch (error) {
    console.error("Error fetching tables with status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Bulk create tables
export const bulkCreateTables = async (req, res) => {
  try {
    const { tables } = req.body;
    
    if (!tables || !Array.isArray(tables) || tables.length === 0) {
      return res.status(400).json({ message: "Tables array is required" });
    }
    
    // Check for duplicates in the request
    const tableNumbers = tables.map(t => t.tableNumber);
    
    // Log for debugging
    console.log("Attempting to create tables with numbers:", tableNumbers);
    
    // Validate that all tableNumbers are provided
    if (tableNumbers.some(num => num === undefined || num === null)) {
      return res.status(400).json({ 
        message: "All tables must have a tableNumber" 
      });
    }
    
    const uniqueTableNumbers = [...new Set(tableNumbers)];
    
    if (uniqueTableNumbers.length !== tableNumbers.length) {
      return res.status(400).json({ message: "Request contains duplicate table numbers" });
    }
    
    // Check for existing tables in the database
    const existingTables = await Table.find({
      tableNumber: { $in: tableNumbers }
    });
    
    if (existingTables.length > 0) {
      return res.status(400).json({ 
        message: "Some tables already exist", 
        existingTables: existingTables.map(t => t.tableNumber) 
      });
    }
    
    // Create all tables
    const tablesToCreate = tables.map(t => ({
      tableNumber: t.tableNumber,
      status: t.status || 'available',
      capacity: t.capacity || 4
    }));
    
    const createdTables = await Table.insertMany(tablesToCreate);
    console.log(`Successfully created ${createdTables.length} tables`);
    
    res.status(201).json(createdTables);
  } catch (error) {
    console.error("Error creating tables in bulk:", error);
    // Send more detailed error for debugging
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message,
      code: error.code 
    });
  }
}; 