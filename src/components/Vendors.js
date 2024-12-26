import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path as needed
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    companyName: '',
    phoneNumber: '',
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsCollection = collection(firestore, 'vendors');
        const vendorSnapshot = await getDocs(vendorsCollection);
        const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setVendors(vendorList);
      } catch (error) {
        console.error('Error fetching vendors:', error);
      }
    };

    fetchVendors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorForm({ ...vendorForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, companyName, phoneNumber } = vendorForm;

    if (!name || !companyName || !phoneNumber) {
      alert('All fields are required');
      return;
    }

    try {
      const vendorsCollection = collection(firestore, 'vendors');
      await addDoc(vendorsCollection, { name, companyName, phoneNumber });

      setVendorForm({
        name: '',
        companyName: '',
        phoneNumber: '',
      });
      const vendorSnapshot = await getDocs(vendorsCollection);
      const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorList);

      alert('Vendor added successfully!');
    } catch (error) {
      console.error('Error adding vendor:', error);
      alert('Failed to add vendor. Please try again.');
    }
  };

  const handleRemove = async (vendorId) => {
    try {
      const vendorRef = doc(firestore, 'vendors', vendorId);
      await deleteDoc(vendorRef);

      const vendorsCollection = collection(firestore, 'vendors');
      const vendorSnapshot = await getDocs(vendorsCollection);
      const vendorList = vendorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVendors(vendorList);

      alert('Vendor removed successfully!');
    } catch (error) {
      console.error('Error removing vendor:', error);
      alert('Failed to remove vendor. Please try again.');
    }
  };

  return (
    <section>
      <h2>Vendors</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2em' }}>
        <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={vendorForm.name}
              onChange={handleChange}
              placeholder="Enter vendor name"
              required
            />
          </label>
          <label>
            Company Name:
            <input
              type="text"
              name="companyName"
              value={vendorForm.companyName}
              onChange={handleChange}
              placeholder="Enter company name"
              required
            />
          </label>
          <label>
            Phone Number:
            <input
              type="tel"
              name="phoneNumber"
              value={vendorForm.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </label>
          <button type="submit">Add Vendor</button>
        </div>
      </form>

      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company Name</th>
            <th>Phone Number</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.id}>
              <td>{vendor.name}</td>
              <td>{vendor.companyName}</td>
              <td>{vendor.phoneNumber}</td>
              <td>
                <button onClick={() => handleRemove(vendor.id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default Vendors;
