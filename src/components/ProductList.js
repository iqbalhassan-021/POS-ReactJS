import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVendor, setExpandedVendor] = useState(null); // Track which vendor's products to show

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error.message);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this product?');
    if (confirmDelete) {
      try {
        await deleteDoc(doc(firestore, 'products', productId));
        setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
        alert('Product deleted successfully.');
      } catch (error) {
        console.error('Error deleting product:', error.message);
        alert('Failed to delete the product.');
      }
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Product List</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const handleViewProducts = (vendorName) => {
    setExpandedVendor(expandedVendor === vendorName ? null : vendorName); // Toggle visibility
  };

  // Group products by vendor
  const groupedByVendor = products.reduce((acc, product) => {
    if (!acc[product.vendorName]) {
      acc[product.vendorName] = [];
    }
    acc[product.vendorName].push(product);
    return acc;
  }, {});

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (products.length === 0) {
    return <p>No products have been added yet.</p>;
  }

  return (
    <section className="section">
      <h2>All Products</h2>
      <button onClick={handlePrint} className="primary-button" style={{ marginBottom: '20px' }}>
        Print Products
      </button>

      {/* Table for vendor details */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Vendor Name</th>
            <th style={tableHeaderStyle}>Company</th>
            <th style={tableHeaderStyle}>Total Products</th>
            <th style={tableHeaderStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(groupedByVendor).map(vendorName => (
            <tr key={vendorName}>
              <td style={tableCellStyle}>{vendorName}</td>
              <td style={tableCellStyle}>{groupedByVendor[vendorName][0].companyName}</td>
              <td style={tableCellStyle}>{groupedByVendor[vendorName].length}</td>
              <td style={tableCellStyle}>
                <button
                  onClick={() => handleViewProducts(vendorName)}
                  className="view-button"
                  style={viewButtonStyle}
                >
                  {expandedVendor === vendorName ? 'Hide Products' : 'View Products'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Display product details in table for the selected vendor */}
      {Object.keys(groupedByVendor).map(vendorName => (
        expandedVendor === vendorName && (
          <div key={vendorName} style={{ marginTop: '20px' }}>
            <h3>Products for {vendorName}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Product Name</th>
                  <th style={tableHeaderStyle}>Price (PKR)</th>
                  <th style={tableHeaderStyle}>Expiry Date</th>
                  <th style={tableHeaderStyle}>Quantity</th>
                  <th style={tableHeaderStyle}>Tabs Per Pack</th>
                  <th style={tableHeaderStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedByVendor[vendorName].map(product => (
                  <tr key={product.id}>
                    <td style={tableCellStyle}>{product.productName}</td>
                    <td style={tableCellStyle}>{product.purchasePrice}</td>
                    <td style={tableCellStyle}>{product.productExpiry}</td>
                    <td style={tableCellStyle}>{product.productQuantity}</td>
                    <td style={tableCellStyle}>{product.tabsPerPack}</td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="delete-button"
                        style={deleteButtonStyle}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ))}

      {/* Hidden content for printing */}
      <div id="print-area" style={{ display: 'none' }}>
        <h1>BUTT PHARMACY</h1>
        <p>{new Date().toLocaleString()}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Product Name</th>
              <th style={tableHeaderStyle}>Price (PKR)</th>
              <th style={tableHeaderStyle}>Expiry Date</th>
              <th style={tableHeaderStyle}>Company</th>
              <th style={tableHeaderStyle}>Selling Price (PKR)</th>
              <th style={tableHeaderStyle}>Tabs Per Pack</th>
              <th style={tableHeaderStyle}>Vendor Name</th>
              <th style={tableHeaderStyle}>Vendor Company</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td style={tableCellStyle}>{product.productName}</td>
                <td style={tableCellStyle}>{product.purchasePrice}</td>
                <td style={tableCellStyle}>{product.productExpiry}</td>
                <td style={tableCellStyle}>{product.productCompany}</td>
                <td style={tableCellStyle}>{product.sellingPrice}</td>
                <td style={tableCellStyle}>{product.tabsPerPack}</td>
                <td style={tableCellStyle}>{product.vendorName || 'N/A'}</td>
                <td style={tableCellStyle}>{product.companyName || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// Inline styles for the table
const tableHeaderStyle = {
  border: '1px solid black',
  padding: '10px',
  backgroundColor: '#f4f4f4',
  fontWeight: 'bold',
};

const tableCellStyle = {
  border: '1px solid black',
  padding: '10px',
};

const deleteButtonStyle = {
  backgroundColor: 'red',
  color: 'white',
  padding: '5px 10px',
  border: 'none',
  cursor: 'pointer',
  borderRadius: '5px',
};

const viewButtonStyle = {
  backgroundColor: 'green',
  color: 'white',
  padding: '5px 10px',
  border: 'none',
  cursor: 'pointer',
  borderRadius: '5px',
};

export default ProductList;
