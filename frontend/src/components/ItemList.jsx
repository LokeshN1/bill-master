import { useState, useMemo } from "react";
import { useBill } from "../context/BillContext";

const ItemList = () => {
  const { items, bill, addToBill, removeFromBill } = useBill();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Get unique categories and organize items by category
  const { categories, itemsByCategory } = useMemo(() => {
    const categoriesSet = new Set();
    const itemsByCat = {};
    
    items.forEach(item => {
      const category = item.category || "Uncategorized";
      categoriesSet.add(category);
      
      if (!itemsByCat[category]) {
        itemsByCat[category] = [];
      }
      
      itemsByCat[category].push(item);
    });
    
    return {
      categories: ["all", ...Array.from(categoriesSet)],
      itemsByCategory: itemsByCat
    };
  }, [items]);

  // Filter items based on search term and active category
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.itemName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || 
        (item.category || "Uncategorized") === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, activeCategory]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Menu Items</h2>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg 
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" 
            width="16" 
            height="16" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-2 -mx-1 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-3 py-1.5 mx-1 rounded-full text-sm transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === "all" ? "All Items" : category}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">Loading items or No items available.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">No items match your search criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeCategory === "all" ? (
              // Group by category when showing all items
              Object.entries(itemsByCategory).map(([category, categoryItems]) => {
                const filteredCategoryItems = categoryItems.filter(item => 
                  item.itemName?.toLowerCase().includes(searchTerm.toLowerCase())
                );
                
                if (filteredCategoryItems.length === 0) return null;
                
                return (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredCategoryItems.map(item => renderItemCard(item))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Simply show filtered items when a category is selected
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.map(item => renderItemCard(item))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Helper function to render an item card
  function renderItemCard(item) {
    const billItem = bill.find((i) => i._id === item._id);
    return (
      <div key={item._id} className="border rounded-lg p-3 hover:bg-blue-50 transition-colors">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">{item.itemName}</span>
          <span className="text-blue-600 font-bold">₹{item.price}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">{item.category || 'Uncategorized'}</span>
          <div className="flex items-center">
            {billItem && billItem.quantity > 0 && (
              <>
                <button
                  onClick={() => removeFromBill(item._id)}
                  className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-300"
                >
                  -
                </button>
                <span className="mx-2 w-6 text-center">{billItem.quantity}</span>
              </>
            )}
            <button
              onClick={() => addToBill(item)}
              className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-600"
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }
};

// Add styles to hide scrollbar but maintain scroll functionality
const styles = document.createElement('style');
styles.textContent = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(styles);

export default ItemList;
