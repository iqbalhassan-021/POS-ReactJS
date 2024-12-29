import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';

const DuesSpending = () => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default to Cash
  const [dues, setDues] = useState([]);
  const [balance, setBalance] = useState({}); // Stores available balances for each method
  const [message, setMessage] = useState(''); // For displaying success/failure messages

  const categories = [
    'Electricity Bill',
    'Rent',
    'Software Bill',
    'Shop Maintenance',
    'Miscellaneous',
  ];

  useEffect(() => {
    // Fetch balances for payment methods
    const fetchBalances = async () => {
      try {
        const accounts = ['Cash', 'JazzCash', 'EasyPesa', 'BankTransfer'];
        const newBalances = {};

        for (const account of accounts) {
          const accountCollection = collection(firestore, account);
          const accountDocs = await getDocs(accountCollection);
          const accountBalance = accountDocs.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
          newBalances[account] = accountBalance;
        }

        setBalance(newBalances);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
  }, []);

  useEffect(() => {
    // Fetch existing dues
    const fetchDues = async () => {
      try {
        const duesCollection = collection(firestore, 'duesSpendings');
        const duesSnapshot = await getDocs(duesCollection);
        const duesData = duesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate().toLocaleDateString(),
        }));
        setDues(duesData);
      } catch (error) {
        console.error('Error fetching dues:', error);
      }
    };

    fetchDues();
  }, []);

  const handlePayment = async () => {
    const parsedAmount = parseFloat(amount); // The entered amount
    if (!paymentMethod || !category || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please select a valid payment method, category, and amount.');
      return;
    }
  
    if (balance[paymentMethod] < parsedAmount) {
      alert(`Insufficient balance in ${paymentMethod}. Available balance: ${balance[paymentMethod]}`);
      return;
    }
  
    // Payment data
    const newPayment = {
      category,
      amount: parsedAmount,
      paymentMethod,
      date: new Date(),
    };
  
    try {
      // Step 1: Save the payment in Firestore
      const paymentRef = collection(firestore, 'duesSpendings');
      await addDoc(paymentRef, newPayment);
  
      // Step 2: Deduct the balance from the selected method (e.g., EasyPesa)
      const accountCollection = collection(firestore, paymentMethod); // Payment method collection
      const accountDocs = await getDocs(accountCollection);
  
      if (!accountDocs.empty) {
        const accountDoc = accountDocs.docs[0]; // Assuming one document per payment method
        const currentBalance = accountDoc.data().amount;
        const updatedBalance = currentBalance - parsedAmount;
  
        // Update the balance in Firestore
        const accountDocRef = doc(accountCollection, accountDoc.id);
        await updateDoc(accountDocRef, { amount: updatedBalance });
  
        // Step 3: Update local state (UI update)
        setBalance((prev) => ({
          ...prev,
          [paymentMethod]: updatedBalance, // Update balance in state
        }));
  
        alert(`Payment of PKR ${parsedAmount} for ${category} via ${paymentMethod} was successful.`);
      } else {
        alert(`No account found for ${paymentMethod}.`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process the payment. Please try again.');
    }
  };
  

  const handleDelete = async (id) => {
    try {
      // Delete from Firestore
      const docRef = doc(firestore, 'duesSpendings', id);
      await deleteDoc(docRef);

      // Remove from the UI
      setDues((prev) => prev.filter((due) => due.id !== id));
      setMessage('Dues record deleted successfully.');
    } catch (error) {
      console.error('Error deleting dues record:', error);
      setMessage('Failed to delete the record. Please try again.');
    }
  };
  const handlePrint = () => {
    const printContent = document.getElementById('print-section').innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore the original page
  };
  return (
    <section className="dues-spending">
      <h2>Manage Dues and Spendings</h2>

      <div>
        {message && <div className="message">{message}</div>}
      </div>

      {/* Payment Form */}
      <table className="spendings-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">--Select--</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </th>
            <th>
              Amount (PKR)
              <input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </th>
            <th>
              Payment Method
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPesa">EasyPesa</option>
                <option value="BankTransfer">BankTransfer</option>
              </select>
            </th>
            <th>
              <button onClick={handlePayment}>Pay</button>
            </th>
          </tr>
        </thead>
      </table>

      <h3>Dues Overview</h3>
      <button onClick={handlePrint} style={{ marginBottom: '10px' }}>
        Print Data
      </button>
      <table className="dues-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Amount (PKR)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {dues.length > 0 ? (
            dues.map((due) => (
              <tr key={due.id}>
                <td>{due.date}</td>
                <td>{due.category}</td>
                <td>{due.amount.toFixed(2)}</td>
                <td>
                  <button onClick={() => handleDelete(due.id)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No dues recorded yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Hidden Print Section */}
      <div id="print-section" style={{ display: 'none' }}>
        <h1 >BUTT PHARMACY</h1>
        <p >
          {new Date().toLocaleString()}
        </p>
        <table style={{ width: '100%', border: '1px solid black', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black' }}>Date</th>
              <th style={{ border: '1px solid black' }}>Category</th>
              <th style={{ border: '1px solid black' }}>Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {dues.map((due) => (
              <tr key={due.id}>
                <td style={{ border: '1px solid black' }}>{due.date}</td>
                <td style={{ border: '1px solid black' }}>{due.category}</td>
                <td style={{ border: '1px solid black' }}>{due.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DuesSpending;
