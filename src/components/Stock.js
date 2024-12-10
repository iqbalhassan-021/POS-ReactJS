import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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

  return (
    <section className="section">
      <h2>Product List</h2>

      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}

      <div className="product-list">
        {products.length > 0 ? (
          products.map((product) => (
            <div className="product-card" key={product.id}>
              <h3>{product.productName}</h3>
              <p>
                <strong>Remaining Packs:</strong> {product.productQuantity}
              </p>
              <p>
                <strong>Remaining Tabs:</strong> {product.productQuantity * product.tabsPerPack}
              </p>
            </div>
          ))
        ) : (
          !loading && <p>No products available.</p>
        )}
      </div>
    </section>
  );
};

export default ProductList;
