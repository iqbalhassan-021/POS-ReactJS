import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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

          return { ...data, remainingDays };
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

  return (
    <section className="section">
      <h2>Products Expiring Soon</h2>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      <div className="product-list">
        {products.length > 0 ? (
          products.map((product, index) => (
            <div className="product-card" key={index}>
              <h3>{product.productName}</h3>
              <p><strong>Expiry Date:</strong> {product.productExpiry}</p>
              <p
                className={product.remainingDays < 180 ? 'expiry-warning' : ''}
              >
                <strong>Remaining Days:</strong> {product.remainingDays} days
              </p>
              <p><strong>Company:</strong> {product.productCompany}</p>
            </div>
          ))
        ) : (
          !loading && <p>No products are expiring soon.</p>
        )}
      </div>
    </section>
  );
};

export default ExpiringSoon;
