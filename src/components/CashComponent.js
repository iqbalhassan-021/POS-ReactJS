import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';

const CashComponent = () => {
  const [balances, setBalances] = useState({
    Cash: 0,
    JazzCash: 0,
    EasyPesa: 0,
    BankTransfer: 0,
  });
  const [pendingBills, setPendingBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');

  useEffect(() => {
    const fetchBalancesAndBills = async () => {
      try {
        const accounts = [
          { name: 'Cash', collectionName: 'Cash' },
          { name: 'JazzCash', collectionName: 'JazzCash' },
          { name: 'EasyPesa', collectionName: 'EasyPesa' },
          { name: 'BankTransfer', collectionName: 'BankTransfer' },
        ];

        const newBalances = {};
        const allPendingBills = [];

        for (const account of accounts) {
          const accountCollection = collection(firestore, account.collectionName);

          const accountDocs = await getDocs(accountCollection);
          const accountBalance = accountDocs.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
          newBalances[account.name] = accountBalance;

          const pendingQuery = query(accountCollection, where('remainingBalance', '<', 0));
          const pendingDocs = await getDocs(pendingQuery);

          pendingDocs.docs.forEach((doc) => {
            const data = doc.data();
            allPendingBills.push({
              id: doc.id,
              account: account.name,
              customerName: data.customerName,
              remainingBalance: data.remainingBalance,
              date: data.date ? new Date(data.date.seconds * 1000).toLocaleDateString() : 'N/A',
            });
          });
        }

        setBalances(newBalances);
        setPendingBills(allPendingBills);
      } catch (error) {
        console.error('Error fetching balances or bills:', error);
      }
    };

    fetchBalancesAndBills();
  }, []);

  const handleRemoveBill = async () => {
    if (!selectedBill || !selectedAccount) return;
  
    try {
      const accountCollection = collection(firestore, selectedBill.account);
      const billRef = doc(accountCollection, selectedBill.id);
  
      // Update the bill's remaining balance to 0 in Firestore
      await updateDoc(billRef, { remainingBalance: 0 });
  
      // Update the selected account balance in Firestore
      const selectedAccountCollection = collection(firestore, selectedAccount);
      const selectedAccountDocs = await getDocs(selectedAccountCollection);
  
      if (!selectedAccountDocs.empty) {
        // Assume only one document for the account
        const accountDoc = selectedAccountDocs.docs[0];
        const currentBalance = accountDoc.data().amount;
  
        // Use the absolute value of remainingBalance
        const updatedBalance = currentBalance + Math.abs(selectedBill.remainingBalance);
  
        const accountDocRef = doc(selectedAccountCollection, accountDoc.id);
        await updateDoc(accountDocRef, { amount: updatedBalance });
      }
  
      // Update the state to reflect the changes
      setPendingBills((prevBills) => prevBills.filter((bill) => bill.id !== selectedBill.id));
      setBalances((prevBalances) => ({
        ...prevBalances,
        [selectedAccount]: prevBalances[selectedAccount] + Math.abs(selectedBill.remainingBalance),
      }));
  
      // Reset selected bill and account
      setSelectedBill(null);
      setSelectedAccount('');
    } catch (error) {
      console.error('Error removing bill:', error);
    }
  };
  
  const openPrompt = (bill) => {
    setSelectedBill(bill);
    setSelectedAccount('');
  };

  return (
    <section className="cash-component">
      <h2>Account Balances</h2>
      <table className="balances-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Balance (PKR)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(balances).map(([account, balance]) => (
            <tr key={account}>
              <td>{account}</td>
              <td>{balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Customers with Pending Bills</h3>
      <table className="pending-bills-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Customer Name</th>
            <th>Remaining Balance (PKR)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingBills.length > 0 ? (
            pendingBills.map((bill) => (
              <tr key={bill.id}>
                <td>{bill.account}</td>
                <td>{bill.customerName}</td>
                <td>{bill.remainingBalance.toFixed(2)}</td>
                <td>
                  <button onClick={() => openPrompt(bill)}>Remove Bill</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No pending bills.</td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedBill && (
        <div className="modal">
          <div className="modal-content">
            <h3>Remove Bill</h3>
            <p>
              Customer: {selectedBill.customerName}
              <br />
              Remaining Balance: PKR {selectedBill.remainingBalance.toFixed(2)}
            </p>
            <label htmlFor="account">Select Account:</label>
            <select
              id="account"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">--Select Account--</option>
              {Object.keys(balances).map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={handleRemoveBill} disabled={!selectedAccount}>
                Confirm
              </button>
              <button onClick={() => setSelectedBill(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CashComponent;
