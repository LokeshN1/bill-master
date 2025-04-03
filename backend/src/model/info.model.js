import mongoose from "mongoose";

const infoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  gstNumber: {
    type: String,
    required: true,
  },
  logo: {
    type: String, // URL or file path of the logo image
    default: "",
  },
  website: {
    type: String, // Optional website link
  },
  email: {
    type: String, // Optional email for customer support
  },
  openingHours: {
    type: String, // Example: "9:00 AM - 11:00 PM"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Info = mongoose.model("Info", infoSchema);

export default Info;
