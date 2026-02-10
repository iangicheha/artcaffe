import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import OrderQR from './OrderQR';
import KitchenDisplay from './KitchenDisplay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/order/table/:tableId" element={<OrderQR />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
