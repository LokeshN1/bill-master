import express from "express";
import { 
  createBill, 
  getAllBills, 
  getBillById, 
  updateBill, 
  deleteBill 
} from "../controllers/bill.controller.js";

const router = express.Router();

// Create a new bill
router.post("/", createBill);

// Get all bills
router.get("/", getAllBills);

// Get a bill by ID
router.get("/:id", getBillById);

// Update a bill by ID
router.put("/:id", updateBill);

// Delete a bill by ID
router.delete("/:id", deleteBill);

export default router;
