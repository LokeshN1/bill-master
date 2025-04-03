import React from "react";

const CafeFooter = ({ cafeInfo }) => {
  return (
    <div className="mt-8 text-center text-gray-500 text-sm">
      <p>© {new Date().getFullYear()} {cafeInfo.name} - GST: {cafeInfo.gstNumber}</p>
      <p className="mt-1">For any assistance, please call {cafeInfo.contact}</p>
    </div>
  );
};

export default CafeFooter; 