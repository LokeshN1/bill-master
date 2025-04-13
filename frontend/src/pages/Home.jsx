import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TableSelection from "../components/TableSelection";
import ItemList from "../components/ItemList";
import Bill from "../components/Bill";
import CafeHeader from "../components/CafeHeader";
import CafeFooter from "../components/CafeFooter";
import { getCafeInfo } from "../api/api";

function Home() {
  const [cafeInfo, setCafeInfo] = useState({
    name: "Café Ullasa",
    address: "123, Street Name, City, State",
    contact: "+91 9876543210",
    gstNumber: "07AABCU9603R1Z2",
    openingHours: "9:00 AM - 11:00 PM",
  });
  const [loading, setLoading] = useState(true);

  // Fetch café info
  useEffect(() => {
    const fetchCafeInfo = async () => {
      try {
        setLoading(true);
        try {
          const data = await getCafeInfo();
          setCafeInfo(data);
        } catch (error) {
          // Use default values if endpoint not found
          console.log("Info endpoint error, using default values:", error.message);
        }
      } catch (error) {
        console.error("Error fetching café info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCafeInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Café Info Header */}
      <CafeHeader cafeInfo={cafeInfo} loading={loading} />

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Billing System</h2>
          <Link 
            to="/admin" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Admin Panel
          </Link>
        </div>
        
        {/* Table Selection at Top with reduced spacing */}
        <div className="mb-4">
          <TableSelection />
        </div>
        
        {/* Main Content - Two Column Layout with better proportions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Items List (2/3 width on large screens) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md">
            <ItemList />
          </div>
          
          {/* Right Side - Bill (1/3 width on large screens) */}
          <div className="bg-white rounded-lg shadow-md">
            <Bill />
          </div>
        </div>

        {/* Footer */}
        <CafeFooter cafeInfo={cafeInfo} />
      </div>
    </div>
  );
}

export default Home;
