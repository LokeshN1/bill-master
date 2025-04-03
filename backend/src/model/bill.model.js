import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
    billNumber: { type: String, required: true },
    tableNo: { type: Number, required: true },
    items: [
        {
            itemId: { type: String },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    receiptFormat: { type: String, enum: ['detailed', 'simple'], default: 'detailed' },
    createdAt: { type: Date, default: Date.now }
});

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
