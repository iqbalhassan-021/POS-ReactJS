import React, { useEffect, useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

      {/* Displaying the product list in a table format */}
      <div className="product-table">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
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
              <th style={tableHeaderStyle}>Action</th>
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
                <td style={tableCellStyle}>
                  <button onClick={() => handleDelete(product.id)} className="delete-button" style={deleteButtonStyle}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden content for printing */}
      <div id="print-area" style={{ display: 'none' }}>
        <h1 >BUTT PHARMACY</h1>
        <p >{new Date().toLocaleString()}</p>
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

export default ProductList;
