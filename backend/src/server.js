import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.config.js";
import itemRoutes from "./routes/item.routes.js";
import billRoutes from "./routes/bill.route.js";
import infoRoutes from "./routes/info.route.js";
import tableRoutes from "./routes/table.route.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Configure CORS with multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://bill-master-three.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Log the configured URLs at startup
console.log(`Server is running on port: ${process.env.PORT || 5000}`);
console.log(`Allowing CORS for: ${allowedOrigins.join(', ')}`);

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/tables', tableRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
