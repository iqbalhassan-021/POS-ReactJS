import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const ExpiringSoon = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsCollection = collection(firestore, 'products');
        const productDocs = await getDocs(productsCollection);

        const productData = productDocs.docs.map((doc) => {
          const data = doc.data();
          const expiryDate = new Date(data.productExpiry);
          const remainingDays = Math.ceil(
            (expiryDate - new Date()) / (1000 * 60 * 60 * 24)
          );

          return { ...data, id: doc.id, remainingDays };
        });

        // Sort products by expiry date (ascending)
        const sortedProducts = productData.sort(
          (a, b) => new Date(a.productExpiry) - new Date(b.productExpiry)
        );

        setProducts(sortedProducts);
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
    printWindow.document.write('<html><head><title>Expiring Products</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <section className="section">
      <h2>Products Expiring Soon</h2>
      <button onClick={handlePrint} className="primary-button" style={{ marginBottom: '20px' }}>
        Print Products
      </button>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      {/* Displaying the product list in a table format */}
      <div className="product-table">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Product Name</th>
              <th style={tableHeaderStyle}>Expiry Date</th>
              <th style={tableHeaderStyle}>Remaining Days</th>
              <th style={tableHeaderStyle}>Company</th>
              <th style={tableHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={tableCellStyle}>{product.productName}</td>
                <td style={tableCellStyle}>{product.productExpiry}</td>
                <td style={tableCellStyle}>
                  {product.remainingDays <= 0 ? (
                    <span className="expired" style={{ color: 'red' }}>Expired</span>
                  ) : (
                    product.remainingDays
                  )}
                </td>
                <td style={tableCellStyle}>{product.productCompany}</td>
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
        <h1 style={{ textAlign: 'center' }}>BUTT PHARMACY</h1>
        <p style={{ textAlign: 'center' }}>{new Date().toLocaleString()}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Product Name</th>
              <th style={tableHeaderStyle}>Expiry Date</th>
              <th style={tableHeaderStyle}>Remaining Days</th>
              <th style={tableHeaderStyle}>Company</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={tableCellStyle}>{product.productName}</td>
                <td style={tableCellStyle}>{product.productExpiry}</td>
                <td style={tableCellStyle}>
                  {product.remainingDays <= 0 ? (
                    <span className="expired" style={{ color: 'red' }}>Expired</span>
                  ) : (
                    product.remainingDays
                  )}
                </td>
                <td style={tableCellStyle}>{product.productCompany}</td>
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

export default ExpiringSoon;
