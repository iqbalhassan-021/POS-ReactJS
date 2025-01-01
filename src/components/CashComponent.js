import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const CashComponent = () => {
  const [balances, setBalances] = useState(null);
  const [inputAmounts, setInputAmounts] = useState({
    Cash: '',
    JazzCash: '',
    EasyPesa: '',
    BankTransfer: '',
  });
  const [customerBalances, setCustomerBalances] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const accounts = [
    { name: 'Cash', collectionName: 'Cash' },
    { name: 'JazzCash', collectionName: 'JazzCash' },
    { name: 'EasyPesa', collectionName: 'EasyPesa' },
    { name: 'BankTransfer', collectionName: 'BankTransfer' },
  ];

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const newBalances = {};
        for (const account of accounts) {
          const accountCollection = collection(firestore, account.collectionName);
          const accountDocs = await getDocs(accountCollection);
          const accountBalance = accountDocs.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
          newBalances[account.name] = accountBalance;
        }
        setBalances(newBalances);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    const fetchCustomerBalances = async () => {
      try {
        const customerCollection = collection(firestore, 'remaings');
        const customerDocs = await getDocs(customerCollection);
        const customerData = customerDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomerBalances(customerData);
      } catch (error) {
        console.error('Error fetching customer balances:', error);
      }
    };

    fetchBalances();
    fetchCustomerBalances();
  }, []);

  const handleInputChange = (account, value) => {
    setInputAmounts((prev) => ({
      ...prev,
      [account]: value,
    }));
  };

  const handleTransaction = async (account, type) => {
    const inputAmount = parseFloat(inputAmounts[account]);
    if (isNaN(inputAmount) || inputAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
  
    if (type === 'withdraw' && inputAmount > balances[account]) {
      alert(`Insufficient balance in ${account}.`);
      return;
    }
  
    try {
      const accountCollection = collection(firestore, account);
      const accountDocs = await getDocs(accountCollection);
  
      if (!accountDocs.empty) {
        const accountDoc = accountDocs.docs[0];
        const currentBalance = accountDoc.data().amount;
  
        // Deposit: Add the amount to the current balance
        const updatedBalance =
          type === 'withdraw' ? currentBalance - inputAmount : currentBalance + inputAmount;
  
        const accountDocRef = doc(accountCollection, accountDoc.id);
        await updateDoc(accountDocRef, { amount: updatedBalance });
  
        setBalances((prev) => ({
          ...prev,
          [account]: updatedBalance,
        }));
  
        setInputAmounts((prev) => ({
          ...prev,
          [account]: '',
        }));
  
        alert(`${type === 'withdraw' ? 'Withdrawn' : 'Deposited'} PKR ${inputAmount} successfully.`);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };
  

  const handleDelete = async (customerId) => {
    try {
      const customerDocRef = doc(firestore, 'remaings', customerId);
      await deleteDoc(customerDocRef);
      setCustomerBalances(prev => prev.filter(customer => customer.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer balance:', error);
    }
  };

  const handlePay = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true); // Show modal for payment
  };

  const handlePaymentMethodChange = (event) => {
    setPaymentMethod(event.target.value);
  };

  const confirmPayment = async () => {
    if (!selectedCustomer || !paymentMethod) {
      alert('Please select a customer and payment method.');
      return;
    }

    try {
      const accountCollection = collection(firestore, paymentMethod);
      const accountDocs = await getDocs(accountCollection);
      if (!accountDocs.empty) {
        const accountDoc = accountDocs.docs[0];
        const currentBalance = accountDoc.data().amount;

        // To fix: The remaining balance is negative, so you add it to the account balance
        const updatedBalance = currentBalance + Math.abs(selectedCustomer.remainingBalance);

        const accountDocRef = doc(accountCollection, accountDoc.id);
        await updateDoc(accountDocRef, { amount: updatedBalance });

        const customerDocRef = doc(firestore, 'remaings', selectedCustomer.id);
        await deleteDoc(customerDocRef);

        setCustomerBalances(prev => prev.filter(customer => customer.id !== selectedCustomer.id));
        alert(`Payment of ${Math.abs(selectedCustomer.remainingBalance)} PKR made successfully using ${paymentMethod}`);
      } else {
        alert(`No account found for ${paymentMethod}`);
      }
    } catch (error) {
      console.error('Error making payment:', error);
    } finally {
      setSelectedCustomer(null);
      setPaymentMethod('');
      setModalVisible(false); // Close the modal after payment
    }
  };

  const closeModal = () => {
    setModalVisible(false); // Close the modal
  };

  if (!balances) {
    return <div>Loading balances...</div>;
  }

  return (
    <section className="cash-component">
      <h2>Account Balances</h2>
      <table className="balances-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance (PKR)</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(balances).map(([account, balance]) => (
            <tr key={account}>
              <td>{account}</td>
              <td>{balance.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={inputAmounts[account]}
                  onChange={(e) => handleInputChange(account, e.target.value)}
                />
              </td>
              <td>
                <button onClick={() => handleTransaction(account, 'deposit')}>Deposit</button>
                <button onClick={() => handleTransaction(account, 'withdraw')} style={{ marginLeft: '10px' }}>
                  Withdraw
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Customer Balances</h2>
      <table className="customer-balances-table">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Date</th>
            <th>Remaining Balance (PKR)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customerBalances.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.customerName}</td>
              <td>{customer.date.toDate().toLocaleString()}</td>
              <td>{customer.remainingBalance.toFixed(2)}</td>
              <td>
                <button onClick={() => handlePay(customer)} style={{ marginRight: '10px' }}>
                  Pay
                </button>
                <button onClick={() => handleDelete(customer.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Custom Modal for Payment */}
      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Payment for {selectedCustomer.customerName}</h3>
            <p>Remaining Balance: {Math.abs(selectedCustomer.remainingBalance)}</p>
            <label>
              Select Payment Method:
              <select value={paymentMethod} onChange={handlePaymentMethodChange}>
                <option value="">Select...</option>
                <option value="Cash">Cash</option>
                <option value="JazzCash">JazzCash</option>
                <option value="EasyPesa">EasyPesa</option>
                <option value="BankTransfer">BankTransfer</option>
              </select>
            </label>
            <div>
              <button onClick={confirmPayment}>Confirm Payment</button>
              <button onClick={closeModal} style={{ marginLeft: '10px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CashComponent;
