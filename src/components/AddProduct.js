import React, { useState } from 'react';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase'; // Adjust the path as needed

const AddProduct = () => {
  const [formData, setFormData] = useState({
    productName: '',
    productCompany: '',
    productQuantity: '',
    purchasePrice: '',
    sellingPrice: '',
    productExpiry: '',
    tabsPerPack: '', // New field added
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Check if a product with the same name already exists
      const productsCollection = collection(firestore, 'products');
      const q = query(productsCollection, where('productName', '==', formData.productName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // If product exists, update all fields
        const existingProduct = querySnapshot.docs[0];
        const productRef = doc(firestore, 'products', existingProduct.id);

        await updateDoc(productRef, {
          productCompany: formData.productCompany,
          productQuantity: formData.productQuantity,
          purchasePrice: formData.purchasePrice,
          sellingPrice: formData.sellingPrice,
          productExpiry: formData.productExpiry,
          tabsPerPack: formData.tabsPerPack, // Update the tabs per pack
        });

        alert('Product updated successfully!');
      } else {
        // If no product with the same name, add it as a new product
        await addDoc(productsCollection, formData);
        alert('Product added successfully!');
      }

      // Reset form data after submitting
      setFormData({
        productName: '',
        productCompany: '',
        productQuantity: '',
        purchasePrice: '',
        sellingPrice: '',
        productExpiry: '',
        tabsPerPack: '', // Reset new field
      });
    } catch (error) {
      console.error('Error adding or updating document: ', error);
      alert('Error adding or updating product. Please try again.');
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
        <label>
          Tabs per Pack: {/* New field */}
          <input
            type="number"
            id="tabsPerPack"
            name="tabsPerPack"
            placeholder="Enter number of tabs per pack"
            value={formData.tabsPerPack}
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
