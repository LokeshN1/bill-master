import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ItemManagement from "./ItemManagement";
import CafeInfoManagement from "./CafeInfoManagement";
import BillManagement from "./BillManagement";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("items");
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Billing
          </Link>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === "items"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("items")}
            >
              Manage Items
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === "cafe-info"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("cafe-info")}
            >
              Café Information
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center ${
                activeTab === "bills"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("bills")}
            >
              Saved Bills
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {activeTab === "items" ? (
            <ItemManagement />
          ) : activeTab === "cafe-info" ? (
            <CafeInfoManagement />
          ) : (
            <BillManagement />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin; 