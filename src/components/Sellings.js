import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file
import { collection, getDocs } from 'firebase/firestore';

const accounts = [
  { name: 'Cash', collectionName: 'Cash' },
  { name: 'JazzCash', collectionName: 'JazzCash' },
  { name: 'EasyPesa', collectionName: 'EasyPesa' },
  { name: 'BankTransfer', collectionName: 'BankTransfer' },
];

const Sellings = () => {
  const [sales, setSales] = useState([]);
  const [profits, setProfits] = useState({}); // Store profits for each bill

  // Fetch sales and profits data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const salesData = [];
        const profitsData = {};

        // Fetch sales data from each account collection
        for (const account of accounts) {
          const salesCollection = collection(firestore, account.collectionName);
          const salesDocs = await getDocs(salesCollection);

          salesDocs.forEach((doc) => {
            const saleData = doc.data();
            salesData.push({
              id: doc.id,
              ...saleData,
              account: account.name, // Add account name for reference
            });
          });
        }

        // Fetch profits data
        const profitsCollection = collection(firestore, 'profits');
        const profitsDocs = await getDocs(profitsCollection);
        profitsDocs.forEach((doc) => {
          const profit = doc.data().profit;
          profitsData[doc.id] = profit; // Map sale ID to profit
        });

        setSales(salesData);
        setProfits(profitsData);
      } catch (error) {
        console.error('Error fetching data: ', error.message);
      }
    };

    fetchData();
  }, []);

  const handlePrint = () => {
    const printArea = document.getElementById('print-area');
    const printWindow = window.open('', '', 'height=500, width=800');
    printWindow.document.write('<html><head><title>Print</title><style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #000; padding: 8px; text-align: left; }</style></head><body>');
    printWindow.document.write(printArea.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const currentDate = new Date().toLocaleString(); // Get the current date in a readable format

  // Calculate the total sale amount
  const totalSale = sales.reduce((total, sale) => {
    const totalPrice = sale.items.reduce((sum, item) => sum + item.subtotal, 0);
    return total + totalPrice;
  }, 0).toFixed(2); // Format to 2 decimal places

  return (
    <section className="section">
      {/* UI section */}
      <h1>Sales Report</h1>
      <button onClick={handlePrint} className="primary-button" style={{ margin: '10px', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white' }}>
        Print Details
      </button>

      {/* Display Total Sale */}
      <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
        <p>Total Sale: {totalSale} PKR</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Customer Name</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Product Name</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Quantity</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Total Price (PKR)</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Payment Method</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const saleDate = new Date(sale.date.seconds * 1000).toISOString().split('T')[0];
            const totalQuantity = sale.items.reduce((total, item) => total + item.quantity, 0);
            const totalPrice = sale.items.reduce((total, item) => total + item.subtotal, 0).toFixed(2);
            const productNames = sale.items.map((item) => item.product.productName).join(', '); // Extract productName

            // Check if profit data exists for this sale
            const profit = profits[sale.id] !== undefined ? profits[sale.id].toFixed(2) : '0.00';

            return (
              <tr key={sale.id}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{saleDate}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{sale.customerName}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{productNames}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{totalQuantity}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{totalPrice}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{sale.paymentMethod}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Hidden Print Area */}
      <div id="print-area" style={{ display: 'none' }}>
        {/* Print Header */}
        <h1>BUTT PHARMACY</h1>
        <p>{currentDate}</p>
        <p>Total Sale: {totalSale} PKR</p>

        {/* Table for Printing */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Customer Name</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Product Name</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Quantity</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Total Price (PKR)</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Profit (PKR)</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const saleDate = new Date(sale.date.seconds * 1000).toISOString().split('T')[0];
              const totalQuantity = sale.items.reduce((total, item) => total + item.quantity, 0);
              const totalPrice = sale.items.reduce((total, item) => total + item.subtotal, 0).toFixed(2);
              const productNames = sale.items.map((item) => item.product.productName).join(', '); // Extract productName

              const profit = profits[sale.id] !== undefined ? profits[sale.id].toFixed(2) : '0.00';

              return (
                <tr key={sale.id}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{saleDate}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{sale.customerName}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{productNames}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{totalQuantity}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{totalPrice}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{profit}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{sale.paymentMethod}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Sellings;
