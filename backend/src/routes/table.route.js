import express from "express";
import { 
  createTable, 
  getAllTables, 
  getTableById, 
  updateTable, 
  deleteTable,
  getTablesWithStatus,
  bulkCreateTables
} from "../controllers/table.controller.js";

const router = express.Router();

// Create a new table
router.post("/", createTable);

// Bulk create tables
router.post("/bulk", bulkCreateTables);

// Get all tables
router.get("/", getAllTables);

// Get tables with bill status
router.get("/with-status", getTablesWithStatus);

// Get a table by ID
router.get("/:id", getTableById);

// Update a table by ID
router.put("/:id", updateTable);

// Delete a table by ID
router.delete("/:id", deleteTable);

export default router; 