import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';

const CashComponent = () => {
  const [balances, setBalances] = useState(null); // Start with null
  const [inputAmounts, setInputAmounts] = useState({
    Cash: '',
    JazzCash: '',
    EasyPesa: '',
    BankTransfer: '',
  });
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const accounts = [
          { name: 'Cash', collectionName: 'Cash' },
          { name: 'JazzCash', collectionName: 'JazzCash' },
          { name: 'EasyPesa', collectionName: 'EasyPesa' },
          { name: 'BankTransfer', collectionName: 'BankTransfer' },
        ];

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
      } finally {
        setLoading(false); // Set loading to false after fetch
      }
    };

    fetchBalances();
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

  if (loading) {
    return <div>Loading balances...</div>; // Display loading indicator
  }

  if (!balances) {
    return <div>Error fetching balances. Please try again later.</div>; // Error fallback
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
    </section>
  );
};

export default CashComponent;
