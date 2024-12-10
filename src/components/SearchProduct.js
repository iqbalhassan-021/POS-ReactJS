import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file

const SearchProduct = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const q = query(
        collection(firestore, 'products'),
        where('productName', '>=', term),
        where('productName', '<=', term + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSuggestions(productsData);
    } catch (err) {
      console.error('Error fetching suggestions:', err.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const q = query(
        collection(firestore, 'products'),
        where('productName', '>=', searchTerm),
        where('productName', '<=', searchTerm + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
      } else {
        setProducts([]);
        setError('No products found.');
      }
    } catch (err) {
      setError('Error searching for products. Please try again.');
      console.error('Error searching for products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    fetchSuggestions(term);
  };

  const handleSuggestionClick = (productName) => {
    setSearchTerm(productName);
    setSuggestions([]); // Clear suggestions once a suggestion is clicked
  };

  return (
    <section className="section">
      <h2>Search Product</h2>
      <form className="search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter product name"
          value={searchTerm}
          onChange={handleInputChange}
        />

{suggestions.length > 0 && (
        <div className="suggestions" style={{ border: '1px solid #ccc', marginTop: '-10px', zIndex: 1000 }}>
          <ul style={{ listStyle: 'none', padding: '0', margin: '0', background: 'white' }}>
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.productName)}
                style={{
                  padding: '8px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {suggestion.productName}
              </li>
            ))}
          </ul>
        </div>
      )}
        <button type="submit">Search</button>
      </form>



      <div className="product-results">
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {products.length > 0 && (
          <div className="product-list">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <h3>{product.productName}</h3>
                <p><strong>Price:</strong> PKR:{product.purchasePrice}</p>
                <p><strong>Selling Price:</strong> PKR:{product.sellingPrice}</p>
                <p><strong>Expiry Date:</strong> {product.productExpiry}</p>
                <p><strong>Company:</strong> {product.productCompany}</p>
                <p>
                <strong>Remaining Packs:</strong> {product.productQuantity}
              </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchProduct;
