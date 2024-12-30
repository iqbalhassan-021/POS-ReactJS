import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(firestore, 'products');
        const productDocs = await getDocs(productsCollection);

        const productData = productDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setProducts(productData);
      } catch (err) {
        setError('Error fetching products. Please try again.');
        console.error('Error fetching products:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(firestore, 'products', productId));
      setProducts(products.filter((product) => product.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err.message);
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

  return (
    <section className="section">
      <h2>Stock</h2>
      <button onClick={handlePrint} className="primary-button" style={{ marginBottom: '20px' }}>
        Print Stock
      </button>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {/* Displaying the product list in a table format */}
      <div className="product-table">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Product Name</th>
              <th style={tableHeaderStyle}>Remaining Packs</th>
              <th style={tableHeaderStyle}>Remaining Tabs</th>
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={tableCellStyle}>{product.productName}</td>
                <td style={tableCellStyle}>{product.productQuantity}</td>
                <td style={tableCellStyle}>{product.productQuantity * product.tabsPerPack}</td>
                <td style={tableCellStyle}>
                  <div className="actions">
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="delete-button"
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hidden content for printing */}
      <div id="print-area" style={{ display: 'none' }}>
        <h1 style={{ textAlign: 'center' }}>Product List</h1>
        <p style={{ textAlign: 'center' }}>{new Date().toLocaleString()}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Product Name</th>
              <th style={tableHeaderStyle}>Remaining Packs</th>
              <th style={tableHeaderStyle}>Remaining Tabs</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={tableCellStyle}>{product.productName}</td>
                <td style={tableCellStyle}>{product.productQuantity}</td>
                <td style={tableCellStyle}>{product.productQuantity * product.tabsPerPack}</td>
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
