import Info from "../model/info.model.js";

// Get cafe info
export const getCafeInfo = async (req, res) => {
  try {
    const cafe = await Info.findOne(); // Fetch the first document

    if (!cafe) {
      return res.status(404).json({ message: "Café details not found" });
    }

    res.status(200).json(cafe);
  } catch (error) {
    console.error("Error fetching café details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Create cafe info
export const createCafeInfo = async (req, res) => {
  try {
    const { name, address, contact, gstNumber } = req.body;
    
    // Check if a document already exists
    const existingInfo = await Info.findOne();
    
    if (existingInfo) {
      // Update existing document
      const updatedInfo = await Info.findOneAndUpdate(
        {},
        { name, address, contact, gstNumber },
        { new: true }
      );
      return res.status(200).json(updatedInfo);
    }
    
    // Create new document if none exists
    const newInfo = new Info({
      name,
      address,
      contact,
      gstNumber
    });
    
    const savedInfo = await newInfo.save();
    res.status(201).json(savedInfo);
  } catch (error) {
    console.error("Error creating café details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update cafe info
export const updateCafeInfo = async (req, res) => {
  try {
    const { name, address, contact, gstNumber } = req.body;
    
    // Check if a document exists
    const existingInfo = await Info.findOne();
    
    if (!existingInfo) {
      // If no document exists, create a new one
      const newInfo = new Info({
        name,
        address,
        contact,
        gstNumber
      });
      
      const savedInfo = await newInfo.save();
      return res.status(201).json(savedInfo);
    }
    
    // Update existing document
    const updatedInfo = await Info.findOneAndUpdate(
      {},
      { name, address, contact, gstNumber },
      { new: true }
    );
    
    res.status(200).json(updatedInfo);
  } catch (error) {
    console.error("Error updating café details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
