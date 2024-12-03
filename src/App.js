// App.js
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductList from './components/ProductList';
import AddProduct from './components/AddProduct';
import SearchProduct from './components/SearchProduct';
import POS from './components/POS';
import ExpiringSoon from './components/ExpiringSoon';
import Sellings from './components/Sellings';
import Stock from './components/Stock';
import Login from './Pages/Login'; // Import the Login page
import './App.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track if user is logged in
  const [activeSection, setActiveSection] = useState('productList');

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true); // After successful login, show the dashboard
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />; // Show login page if not logged in
  }

  return (
    <div className="dashboard">
      <Sidebar onSectionChange={handleSectionChange} />
      <main className="content">
        <Header title="Product Dashboard" />
        {activeSection === 'productList' && <ProductList />}
        {activeSection === 'addProduct' && <AddProduct />}
        {activeSection === 'searchProduct' && <SearchProduct />}
        {activeSection === 'pos' && <POS />}
        {activeSection === 'expiringSoon' && <ExpiringSoon />}
        {activeSection === 'sellings' && <Sellings />}
        {activeSection === 'stock' && <Stock />}
      </main>
    </div>
  );
};

export default App;
