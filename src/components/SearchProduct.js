import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const SearchProduct = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setProduct(null); // Clear previous search results
    setError('');
    setLoading(true);

    try {
      const q = query(
        collection(firestore, 'products'),
        where('productName', '==', searchTerm)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const productData = querySnapshot.docs[0].data(); // Assuming only one product matches
        setProduct(productData);
      } else {
        setError('Product not found.');
      }
    } catch (err) {
      setError('Error searching for product. Please try again.');
      console.error('Error searching for product:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <h2>Search Product</h2>
      <form className="search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter product name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          required
        />
        <button type="submit">Search</button>
      </form>

      <div className="product-results">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {product && (
          <div className="product-card">
            <h3>{product.productName}</h3>
            <p><strong>Price:</strong> ${product.purchasePrice}</p>
            <p><strong>Selling Price:</strong> ${product.sellingPrice}</p>
            <p><strong>Expiry Date:</strong> {product.productExpiry}</p>
            <p><strong>Company:</strong> {product.productCompany}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchProduct;
