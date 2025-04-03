import express from "express";
import { 
  createItem, 
  getAllItems, 
  getItemById, 
  updateItem, 
  deleteItem 
} from "../controllers/item.controller.js";

const router = express.Router();

// Create a new item
router.post("/", createItem);

//  Get all items
router.get("/", getAllItems);

//  Get a single item by ID
router.get("/:id", getItemById);

// Update an item by ID
router.put("/:id", updateItem);

// Delete an item by ID
router.delete("/:id", deleteItem);

export default router;
