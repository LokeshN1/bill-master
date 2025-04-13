import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
    billNumber: { type: String, required: true },
    tableNo: { type: Number, required: true },
    items: [
        {
            itemId: { type: String },
            name: { type: String, required: true, default: "Unknown Item" },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    receiptFormat: { type: String, enum: ['detailed', 'simple'], default: 'detailed' },
    createdAt: { type: Date, default: Date.now }
}, { 
    timestamps: true
});

// Create an index on billNumber
billSchema.index({ billNumber: 1 }, { 
    unique: true,
    background: true 
});

const Bill = mongoose.model("Bill", billSchema);

// Attempt to drop the old billNo index from MongoDB collection
async function dropBillNoIndex() {
    try {
        console.log("Attempting to drop old billNo index...");
        const collection = mongoose.connection.collection('bills');
        
        // Get all indexes
        const indexes = await collection.indexes();
        const billNoIndex = indexes.find(idx => idx.key && idx.key.billNo);
        
        if (billNoIndex) {
            console.log("Found billNo index, dropping it...");
            await collection.dropIndex("billNo_1");
            console.log("Successfully dropped billNo index");
        } else {
            console.log("No billNo index found, no action needed");
        }
    } catch (error) {
        console.error("Error dropping billNo index:", error);
    }
}

// Run the index drop operation after connection is established
mongoose.connection.once('connected', () => {
    dropBillNoIndex().catch(err => console.error("Failed to drop index:", err));
});

export default Bill;
