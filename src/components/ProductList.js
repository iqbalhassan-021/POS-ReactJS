import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
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

  if (loading) {
    return <p>Loading products...</p>;
  }

  if (products.length === 0) {
    return <p>No products have been added yet.</p>;
  }

  return (
    <section className="section">
      <h2>All Products</h2>
      <div className="product-list">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <h3>{product.productName}</h3>
            <p><strong>Price:</strong> PKR:{product.purchasePrice}</p>
            <p><strong>Expiry Date:</strong> {product.productExpiry}</p>
            <p><strong>Company:</strong> {product.productCompany}</p>
            <p><strong>Selling Price:</strong> PKR:{product.sellingPrice}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProductList;
