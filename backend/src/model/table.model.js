import mongoose from "mongoose";

// Drop any existing indexes that might be causing issues
mongoose.set('autoIndex', false);

const tableSchema = new mongoose.Schema({
    tableNumber: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true, 
        unique: true 
    },
    status: { 
        type: String, 
        enum: ['available', 'occupied', 'reserved'], 
        default: 'available' 
    },
    capacity: { 
        type: Number, 
        default: 4 
    },
    lastBillId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Bill',
        default: null
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Ensure we explicitly create the index on tableNumber
tableSchema.index({ tableNumber: 1 }, { unique: true });

// Drop the tableName index if it exists
const Table = mongoose.model("Table", tableSchema);

// Try to drop the problematic index
const dropOldIndex = async () => {
    try {
        await mongoose.connection.collections.tables.dropIndex('tableName_1');
        console.log('Successfully dropped old tableName index');
    } catch (err) {
        // If index doesn't exist, that's fine
        if (err.code !== 27) {
            console.error('Error dropping index:', err);
        }
    }
};

// Execute when connected
mongoose.connection.once('connected', dropOldIndex);

export default Table; 