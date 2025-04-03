import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { BillProvider } from "./context/BillContext"; // ✅ Import context provider
import Home from "./pages/Home";
import Admin from "./pages/admin/Admin";

function App() {
  return (
    <BillProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </BillProvider>
  );
}

export default App;
