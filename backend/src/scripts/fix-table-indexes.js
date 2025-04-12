// Fix table indexes script
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bill-master');
    console.log('MongoDB Connected...');
    return true;
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
};

// Fix table indexes
const fixTableIndexes = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Get the 'tables' collection
    const collection = mongoose.connection.collection('tables');
    
    // List all indexes
    console.log('Current indexes:');
    const indexes = await collection.indexes();
    console.log(indexes);
    
    // Drop problematic indexes
    try {
      if (indexes.some(index => index.name === 'tableName_1')) {
        console.log('Dropping the problematic tableName index...');
        await collection.dropIndex('tableName_1');
        console.log('Successfully dropped tableName_1 index');
      }
    } catch (err) {
      console.log('Error dropping tableName_1 index:', err.message);
    }
    
    // Ensure the correct index is in place
    try {
      console.log('Creating the correct tableNumber index...');
      await collection.createIndex({ tableNumber: 1 }, { unique: true });
      console.log('Successfully created tableNumber index');
    } catch (err) {
      console.log('Error creating tableNumber index:', err.message);
    }
    
    // Let's check the data to see if there are any null values
    const nullTables = await collection.find({ tableNumber: null }).toArray();
    if (nullTables.length > 0) {
      console.log(`Found ${nullTables.length} records with null tableNumber`);
      console.log('Sample of problematic records:', nullTables.slice(0, 3));
      
      // Fix these records or delete them
      const deleteResult = await collection.deleteMany({ tableNumber: null });
      console.log(`Deleted ${deleteResult.deletedCount} records with null tableNumber`);
    } else {
      console.log('No tables with null tableNumber found');
    }
    
    // Let's look for duplicate tableNumber values
    const aggregationResult = await collection.aggregate([
      { $group: { _id: "$tableNumber", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (aggregationResult.length > 0) {
      console.log('Found duplicate tableNumber values:', aggregationResult);
      
      // For each duplicate, keep only the newest record
      for (const duplicate of aggregationResult) {
        const duplicateTables = await collection.find({ tableNumber: duplicate._id })
          .sort({ createdAt: -1 })
          .toArray();
        
        // Skip the first one (newest) and delete the rest
        for (let i = 1; i < duplicateTables.length; i++) {
          await collection.deleteOne({ _id: duplicateTables[i]._id });
          console.log(`Deleted duplicate table with _id: ${duplicateTables[i]._id}`);
        }
      }
    } else {
      console.log('No duplicate tableNumber values found');
    }
    
    // List indexes again to verify
    console.log('New indexes:');
    const newIndexes = await collection.indexes();
    console.log(newIndexes);
    
    console.log('Database cleanup completed successfully');
  } catch (err) {
    console.error('Error fixing table indexes:', err);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
};

// Run the function
fixTableIndexes(); 