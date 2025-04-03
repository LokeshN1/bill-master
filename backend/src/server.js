import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.config.js";
import itemRoutes from "./routes/item.routes.js";
import billRoutes from "./routes/bill.route.js";
import infoRoutes from "./routes/info.route.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Configure CORS with environment variables
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Log the configured URLs at startup
console.log(`Backend running on port: ${process.env.PORT}`);
console.log(`Allowing CORS for: ${process.env.FRONTEND_URL}`);

app.use('/api/items', itemRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/info', infoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
