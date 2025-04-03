import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, default: "", trim: true },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

const Item = mongoose.model("Item", itemSchema);

export default Item;
