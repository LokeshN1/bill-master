import React from "react";

const CafeHeader = ({ cafeInfo, loading }) => {
  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-3 shadow-md">
      <div className="container mx-auto px-4">
        {!loading && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl md:text-3xl font-bold">{cafeInfo.name}</h1>
              <div className="hidden md:block bg-white w-px h-8 mx-4 opacity-30"></div>
              <p className="hidden md:block text-sm">{cafeInfo.address}</p>
            </div>
            
            {/* Mobile view address */}
            <p className="text-xs md:hidden opacity-80 mt-1">{cafeInfo.address}</p>
            
            <div className="flex items-center gap-4 text-sm mt-1 md:mt-0">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {cafeInfo.contact}
              </div>
              {cafeInfo.openingHours && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {cafeInfo.openingHours}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CafeHeader; 