import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path as needed

const AddProduct = () => {
  const [formData, setFormData] = useState({
    productName: '',
    productCompany: '',
    productQuantity: '',
    purchasePrice: '',
    sellingPrice: '',
    productExpiry: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add a document to the "products" collection
      await addDoc(collection(firestore, 'products'), formData);
      alert('Product added successfully!');
      setFormData({
        productName: '',
        productCompany: '',
        productQuantity: '',
        purchasePrice: '',
        sellingPrice: '',
        productExpiry: '',
      }); // Reset form
    } catch (error) {
      console.error('Error adding document: ', error);
      alert('Error adding product. Please try again.');
    }
  };

  return (
    <section className="section">
      <h2>Add Product</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Product Name:
          <input
            type="text"
            id="productName"
            name="productName"
            placeholder="Enter product name"
            value={formData.productName}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Company:
          <input
            type="text"
            id="productCompany"
            name="productCompany"
            placeholder="Enter company name"
            value={formData.productCompany}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Quantity:
          <input
            type="number"
            id="productQuantity"
            name="productQuantity"
            placeholder="Enter quantity"
            value={formData.productQuantity}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Purchase Price:
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            placeholder="Enter purchase price"
            value={formData.purchasePrice}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Selling Price:
          <input
            type="number"
            id="sellingPrice"
            name="sellingPrice"
            placeholder="Enter selling price"
            value={formData.sellingPrice}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Expiry Date:
          <input
            type="date"
            id="productExpiry"
            name="productExpiry"
            value={formData.productExpiry}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </section>
  );
};

export default AddProduct;
