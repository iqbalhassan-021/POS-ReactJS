import React, { useState, useEffect } from 'react';
import { setDoc,query, where, collection, getDocs, deleteDoc,getDoc, addDoc, doc, updateDoc, runTransaction } from 'firebase/firestore';

 
import { firestore } from '../firebase';

const accounts = [
  { name: 'Cash', collectionName: 'Cash' },
  { name: 'JazzCash', collectionName: 'JazzCash' },
  { name: 'EasyPesa', collectionName: 'EasyPesa' },
  { name: 'BankTransfer', collectionName: 'BankTransfer' },
];

const ProductTable = () => {

  const [vendorDetails, setVendorDetails] = useState({
    vendorName: '',
    companyName: '',
  });

  const [newProducts, setNewProducts] = useState([{
    productName: '',
    productCompany: '',
    productQuantity: '',
    purchasePrice: '',
    sellingPrice: '',
    productExpiry: '',
    tabsPerPack: '',
    gname: '',
    batch: '',
  }]);

  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [cart, setCart] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // New state to hold the balances for each account
  const [accountBalances, setAccountBalances] = useState({
    Cash: 0,
    JazzCash: 0,
    EasyPesa: 0,
    BankTransfer: 0,
  });

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

    
    const fetchPendingPayments = async () => {
      try {
        const pendingCollection = collection(firestore, 'pendingPayments');
        const pendingSnapshot = await getDocs(pendingCollection);
        const pendingList = pendingSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPendingPayments(pendingList);
      } catch (error) {
        console.error('Error fetching pending payments:', error);
      }
    };

    const fetchAccountBalances = async () => {
      try {
        const balances = {};
        for (let account of accounts) {
          const accountDocs = await getDocs(collection(firestore, account.collectionName));
          const totalBalance = accountDocs.docs.reduce((sum, doc) => {
            const data = doc.data();
            return sum + (data.amount || 0); // Ensure to sum the amount field
          }, 0);
          balances[account.name] = totalBalance;
        }
        setAccountBalances(balances);
      } catch (error) {
        console.error('Error fetching account balances:', error);
      }
    };
    

    fetchVendors();
    fetchPendingPayments();
    fetchAccountBalances();
  }, []);
  useEffect(() => {
    const fetchBalance = async () => {
      const balance = await getAccountBalance('accounts'); // Assuming 'accounts' is the collection name
      console.log('Account Balance:', balance);
    };
  
    fetchBalance();
  }, []); // Empty dependency array to call this on component mount
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

  const handleAddToCart = () => {
    setCart((prevCart) => [...prevCart, ...newProducts]);
    setNewProducts([{
      productName: '',
      productCompany: '',
      productQuantity: '',
      purchasePrice: '',
      sellingPrice: '',
      productExpiry: '',
      tabsPerPack: '',
    }]);
  };

  const handleRemoveFromCart = (index) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  };

  const handleSavePurchase = async () => {
    try {
      const pendingCollection = collection(firestore, 'pendingPayments');
  
      const totalBill = cart.reduce(
        (total, product) => total + parseFloat(product.purchasePrice) * parseInt(product.productQuantity, 10),
        0
      );
  
      if (totalBill <= 0) {
        alert("Invalid total bill amount.");
        return;
      }
  
      const newPendingPayment = {
        vendorName: vendorDetails.vendorName || "Default Vendor",
        companyName: vendorDetails.companyName || "Default Company",
        totalBill,
        totalProducts: cart.length,
        items: cart.map((item) => ({
          ...item,
          vendorName: vendorDetails.vendorName,
          companyName: vendorDetails.companyName,
        })),
        createdAt: new Date(),
      };
  
      const docRef = await addDoc(pendingCollection, newPendingPayment);
  
      // Add the new payment to the local state
      setPendingPayments((prev) => [
        ...prev,
        { id: docRef.id, ...newPendingPayment },
      ]);
  
      alert('Purchase saved successfully!');
      setCart([]); // Clear the cart after saving
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Failed to save purchase.');
    }
  };
  
  
  const handlePay = async (paymentMethod, pendingPaymentId) => {
    try {
      const pendingPaymentDocRef = doc(firestore, "pendingPayments", pendingPaymentId);
      const pendingPaymentDoc = await getDoc(pendingPaymentDocRef);
  
      if (!pendingPaymentDoc.exists()) {
        alert("Pending payment not found.");
        return;
      }
  
      const { totalBill, items } = pendingPaymentDoc.data();
  
      if (totalBill <= 0) {
        alert("Invalid total bill amount.");
        return;
      }
  
      const account = accounts.find((acc) => acc.name === paymentMethod);
      const accountRef = doc(firestore, account.collectionName, account.name);
      const accountDoc = await getDoc(accountRef);
  
      let newBalance;
      if (!accountDoc.exists()) {
        const initialBalance = await getAccountBalance(account.collectionName) || 0;
        newBalance = initialBalance - totalBill;
        await setDoc(accountRef, { amount: newBalance });
      } else {
        const existingAmount = accountDoc.data()?.amount || 0;
        newBalance = existingAmount - totalBill;
        await updateDoc(accountRef, { amount: newBalance });
      }
  
      const paymentsCollection = collection(firestore, "payments");
      await addDoc(paymentsCollection, {
        paymentMethod,
        totalBill,
        items,
        paidAt: new Date(),
      });
  
      const productsCollection = collection(firestore, "products");
      for (const item of items) {
        await addDoc(productsCollection, {
          ...item,
          vendorName: item.vendorName,
          companyName: item.companyName,
          createdAt: new Date(),
        });
      }
  
      await deleteDoc(pendingPaymentDocRef);
  
      alert("Payment successful and products added!");
      setModalVisible(false); // Close the modal
      setCart([]);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed.');
    }
  };
   
  // Function to get account balanceconst getAccountBalance = async (collectionName) => {
    const getAccountBalance = async (collectionName) => {
      const accountRef = collection(firestore, collectionName);
      const accountQuerySnapshot = await getDocs(accountRef); // Ensure this is inside an async function
    
      let balance = 0;
      accountQuerySnapshot.forEach((doc) => {
        const data = doc.data();
        balance += data.amount || 0; // Assuming you have an 'amount' field in your documents
      });
    
      return balance; // Return the balance after fetching it
    };
    
    

  
  // Function to save pending payment details
  const savePendingPayment = async (paymentMethod, totalBill) => {
    const pendingCollection = collection(firestore, 'pendingPayments');
    const newPendingPayment = {
      paymentMethod,
      totalBill,
      totalProducts: cart.length,
      vendorName: vendorDetails.vendorName, // Assuming this is part of the vendor details
      companyName: vendorDetails.companyName, // Assuming this is part of the vendor details
      cartItems: cart // Saving the cart items
    };
  
    await addDoc(pendingCollection, newPendingPayment);
    console.log("Purchase saved to pending payments!");
  };
  
  // Function to update the products database after payment
  const updateProductsAfterPayment = async () => {
    const productsCollection = collection(firestore, 'products');
  
    for (const product of cart) {
      console.log("Updating product:", product);
      const productRef = doc(productsCollection, product.id);
      const productSnapshot = await getDoc(productRef);
  
      if (productSnapshot.exists()) {
        const updatedQuantity = productSnapshot.data().quantity - product.productQuantity;
  
        // Update the product quantity in the database
        await updateDoc(productRef, { quantity: updatedQuantity });
        console.log(`Updated product ${product.name} quantity to ${updatedQuantity}`);
      } else {
        console.error("Product not found:", product.id);
      }
    }
  };
  
  // Function to save pending payment detail
  
  // Function to update the products database after payment
  
                
  const handlePaymentMethodChange = (e) => {
    setSelectedPaymentMethod(e.target.value);
  };

  const confirmPayment = async () => {
    try {
      // Get the vendor's pending payment from Firestore based on vendorName
      const vendorPaymentsRef = collection(firestore, 'pendingPayments');
      const vendorPaymentsQuery = query(vendorPaymentsRef, where('vendorName', '==', vendorDetails.vendorName));
      const vendorPaymentsSnapshot = await getDocs(vendorPaymentsQuery);
  
      if (!vendorPaymentsSnapshot.empty) {
        const pendingPaymentDoc = vendorPaymentsSnapshot.docs[0]; // Assuming one payment per vendor
        const pendingPaymentId = pendingPaymentDoc.id; // Get the ID of the pending payment document
  
        console.log("Pending Payment ID:", pendingPaymentId); // Log to confirm
  
        handlePay(selectedPaymentMethod, pendingPaymentId); // Call handlePay with the pendingPaymentId
      } else {
        console.error("Pending payment not found for this vendor.");
        alert("No pending payment found for this vendor.");
      }
    } catch (error) {
      console.error("Error fetching pending payment:", error);
      alert("Error fetching pending payment.");
    }
  };
  
  
  

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPaymentMethod('');
  };

  const openModal = (vendor) => {
    setVendorDetails({ vendorName: vendor.vendorName, companyName: vendor.companyName });
    setModalVisible(true);
  };
  return (
    <section>
      <h2>Add New Products</h2>
      {/* Vendor Selection Form */}
      <div style={{ marginBottom: '1em', display: 'flex', flexDirection: 'row' }}>
        <label>
          Vendor Name:
          <input
            type="text"
            name="vendorName"
            value={vendorDetails.vendorName}
            onChange={handleVendorChange}
            placeholder="Enter vendor name"
            required
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
            required
          />
        </label>
      </div>

      {/* Product Table */}
      <h3>Products</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Generic Name</th>
            <th>Batch Number</th>
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
              <td><input type="text" name="productName" value={product.productName} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="text" name="gname" value={product.gname} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="text" name="batch" value={product.batch} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="text" name="productCompany" value={product.productCompany} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="number" name="productQuantity" value={product.productQuantity} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="number" name="purchasePrice" value={product.purchasePrice} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="number" name="sellingPrice" value={product.sellingPrice} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="date" name="productExpiry" value={product.productExpiry} onChange={(e) => handleInputChange(e, index)} /></td>
              <td><input type="number" name="tabsPerPack" value={product.tabsPerPack} onChange={(e) => handleInputChange(e, index)} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleAddToCart}>Add to Cart</button>

      {/* Cart */}
      {cart.length > 0 && (
        <>
          <h3>Cart</h3>
          <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Company</th>
                <th>Quantity</th>
                <th>Purchase Price</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((product, index) => (
                <tr key={index}>
                  <td>{product.productName}</td>
                  <td>{product.productCompany}</td>
                  <td>{product.productQuantity}</td>
                  <td>{product.purchasePrice}</td>
                  <td><button onClick={() => handleRemoveFromCart(index)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleSavePurchase}>Save Purchase</button>
        </>
      )}

      {/* Pending Payments */}
      <h3>Pending Payments</h3>
      <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Company</th>
            <th>Total Products</th>
            <th>Total Bill</th>
            <th>Pay</th>
          </tr>
        </thead>
        <tbody>
          {pendingPayments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.vendorName}</td>
              <td>{payment.companyName}</td>
              <td>{payment.totalProducts}</td>
              <td>{payment.totalBill}</td>
              <td><button onClick={() => openModal(payment)}>Pay</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payment Modal */}
      {modalVisible && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3>Payment for {vendorDetails.vendorName}</h3>
      <p>Remaining Balance: {Math.abs(pendingPayments.find((payment) => payment.vendorName === vendorDetails.vendorName)?.totalBill || 0)}</p>
      <label>
        Select Payment Method:
        <select value={selectedPaymentMethod} onChange={handlePaymentMethodChange}>
          <option value="">Select</option>
          {accounts.map((account) => (
            <option key={account.name} value={account.name}>
              {account.name} - PKR{accountBalances[account.name]} {/* Show the balance */}
            </option>
          ))}
        </select>
      </label>

      <button onClick={confirmPayment}>Confirm Payment</button>
      <button onClick={closeModal}>Close</button>
    </div>
  </div>
)}

    </section>
  );
};

export default ProductTable;

