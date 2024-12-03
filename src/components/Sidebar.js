import React from 'react';

const Sidebar = ({ onSectionChange }) => (
  <aside className="sidebar">
    <h2 className="logo" style={{color:'white'}}>Butt Pharmacy</h2>
    <nav className="menu">
      <button onClick={() => onSectionChange('pos')}>POS</button>
      <button onClick={() => onSectionChange('addProduct')}>Add Product</button>
      <button onClick={() => onSectionChange('productList')}>Product List</button>
      <button onClick={() => onSectionChange('searchProduct')}>Search Product</button>
      <button onClick={() => onSectionChange('expiringSoon')}>Expiries</button>
      <button onClick={() => onSectionChange('sellings')}>Sellings</button>
      <button onClick={() => onSectionChange('stock')}>Stock</button>
    </nav>
  </aside>
);

export default Sidebar;