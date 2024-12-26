import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';

const ProductTable = () => {
  const [vendorDetails, setVendorDetails] = useState({
    vendorName: '',
    companyName: '',
  });

  const [newProducts, setNewProducts] = useState([
    {
      productName: '',
      productCompany: '',
      productQuantity: '',
      purchasePrice: '',
      sellingPrice: '',
      productExpiry: '',
      tabsPerPack: '',
    },
  ]);

  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsCollection = collection(firestore, 'vendors');
        const vendorSnapshot = await getDocs(vendorsCollection);
        const vendorList = vendorSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVendors(vendorList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    fetchVendors();
  }, []);

  const handleVendorChange = (e) => {
    const { name, value } = e.target;
    setVendorDetails((prevDetails) => ({ ...prevDetails, [name]: value }));

    if (name === 'vendorName') {
      const searchTerm = value.toLowerCase();
      const matchedVendors = vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchTerm)
      );
      setFilteredVendors(matchedVendors);
    }
  };

  const handleVendorSelect = (vendor) => {
    setVendorDetails({ vendorName: vendor.name, companyName: vendor.companyName });
    setFilteredVendors([]);
  };

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    setNewProducts((prevProducts) =>
      prevProducts.map((product, i) =>
        i === index ? { ...product, [name]: value } : product
      )
    );
  };

  const handleAddNewRow = () => {
    setNewProducts((prevProducts) => [
      ...prevProducts,
      {
        productName: '',
        productCompany: '',
        productQuantity: '',
        purchasePrice: '',
        sellingPrice: '',
        productExpiry: '',
        tabsPerPack: '',
      },
    ]);
  };

  const handleSaveAll = async () => {
    try {
      const productsCollection = collection(firestore, 'products');
      for (const product of newProducts) {
        if (
          !product.productName ||
          !product.productCompany ||
          !product.productQuantity
        ) {
          alert('Please fill all required fields.');
          return;
        }
        const newRow = {
          ...product,
          vendorName: vendorDetails.vendorName,
          companyName: vendorDetails.companyName,
        };
        await addDoc(productsCollection, newRow);
      }
      alert('Products saved successfully!');
      setNewProducts([
        {
          productName: '',
          productCompany: '',
          productQuantity: '',
          purchasePrice: '',
          sellingPrice: '',
          productExpiry: '',
          tabsPerPack: '',
        },
      ]);
    } catch (error) {
      console.error('Error saving products:', error);
      alert('Failed to save products. Please try again.');
    }
  };

  const handlePrint = () => {
    const printContent = `
      <h2>BUTT PHARMACY</h2>
      <p><strong>Vendor Name:</strong> ${vendorDetails.vendorName} - <strong>Company Name:</strong> ${vendorDetails.companyName} - <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>

      <h2>Products</h2>
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Company</th>
            <th>Quantity</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Expiry Date</th>
            <th>Tabs per Pack</th>
          </tr>
        </thead>
        <tbody>
          ${newProducts
            .map(
              (product) => `
              <tr>
                <td>${product.productName}</td>
                <td>${product.productCompany}</td>
                <td>${product.productQuantity}</td>
                <td>${product.purchasePrice}</td>
                <td>${product.sellingPrice}</td>
                <td>${product.productExpiry}</td>
                <td>${product.tabsPerPack}</td>
              </tr>
            `
            )
            .join('')}
        </tbody>
      </table>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print</title></head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <section>
      <h2>Add New Products</h2>
      <div style={{ marginBottom: '1em', display: 'flex', flexDirection: 'row' }}>
        <label>
          Vendor Name:
          <input
            type="text"
            name="vendorName"
            value={vendorDetails.vendorName}
            onChange={handleVendorChange}
            placeholder="Enter vendor name"
          />
        </label>
        {filteredVendors.length > 0 && (
          <ul className="suggestions">
            {filteredVendors.map((vendor) => (
              <li key={vendor.id} onClick={() => handleVendorSelect(vendor)}>
                {vendor.name} - {vendor.companyName}
              </li>
            ))}
          </ul>
        )}
        <label style={{ marginLeft: '1em' }}>
          Company Name:
          <input
            type="text"
            name="companyName"
            value={vendorDetails.companyName}
            onChange={handleVendorChange}
            placeholder="Company name will auto-fill"
            disabled
          />
        </label>
      </div>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Company</th>
            <th>Quantity</th>
            <th>Purchase Price</th>
            <th>Selling Price</th>
            <th>Expiry Date</th>
            <th>Tabs per Pack</th>
          </tr>
        </thead>
        <tbody>
          {newProducts.map((product, index) => (
            <tr key={index}>
              <td>
                <input
                  type="text"
                  name="productName"
                  value={product.productName}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter product name"
                  required
                />
              </td>
              <td>
                <input
                  type="text"
                  name="productCompany"
                  value={product.productCompany}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter company"
                />
              </td>
              <td>
                <input
                  type="number"
                  name="productQuantity"
                  value={product.productQuantity}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter quantity"
                />
              </td>
              <td>
                <input
                  type="number"
                  name="purchasePrice"
                  value={product.purchasePrice}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter purchase price"
                />
              </td>
              <td>
                <input
                  type="number"
                  name="sellingPrice"
                  value={product.sellingPrice}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter selling price"
                />
              </td>
              <td>
                <input
                  type="date"
                  name="productExpiry"
                  value={product.productExpiry}
                  onChange={(e) => handleInputChange(e, index)}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="tabsPerPack"
                  value={product.tabsPerPack}
                  onChange={(e) => handleInputChange(e, index)}
                  placeholder="Enter tabs per pack"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddNewRow} style={{ marginTop: '1em' }}>
        Add New Row
      </button>
      <button onClick={handleSaveAll} style={{ marginTop: '1em', marginLeft: '1em' }}>
        Save All Products
      </button>
      <button onClick={handlePrint} style={{ marginBottom: '1em' ,  marginLeft: '1em' }}>
        Print Details
      </button>
    </section>
  );
};

export default ProductTable;
