import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase'; // Adjust the path to your firebase.js file
import { collection, getDocs } from 'firebase/firestore';

const Profits = () => {
  const [profits, setProfits] = useState([]); // Store profits data

  // Fetch profits data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profitsData = [];
        
        // Fetch profits data
        const profitsCollection = collection(firestore, 'profits');
        const profitsDocs = await getDocs(profitsCollection);
        
        profitsDocs.forEach((doc) => {
          const profitData = doc.data();
          profitsData.push({
            id: doc.id,
            date: profitData.date.toDate(), // Convert Firestore timestamp to JavaScript Date
            productName: profitData.productName,
            profit: profitData.profit,
            quantitySold: profitData.quantitySold,
          });
        });

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

  return (
    <section className="section">
      <h1>Profits Report</h1>
      <button onClick={handlePrint} className="primary-button"  style={{ margin: '10px', padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white' }}>
        Print Details
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Product Name</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Profit (PKR)</th>
            <th style={{ border: '1px solid #000', padding: '8px' }}>Quantity Sold</th>
          </tr>
        </thead>
        <tbody>
          {profits.map((profit) => {
            const saleDate = profit.date.toISOString().split('T')[0]; // Format the date

            return (
              <tr key={profit.id}>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{saleDate}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.productName}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.profit.toFixed(2)}</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.quantitySold}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Hidden Print Area */}
      <div id="print-area" style={{ display: 'none' }}>
        {/* Print Header */}
        <h1 >BUTT PHARMACY</h1>
        <p >{currentDate}</p>

        {/* Table for Printing */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Date</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Product Name</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Profit (PKR)</th>
              <th style={{ border: '1px solid #000', padding: '8px' }}>Quantity Sold</th>
            </tr>
          </thead>
          <tbody>
            {profits.map((profit) => {
              const saleDate = profit.date.toISOString().split('T')[0]; // Format the date

              return (
                <tr key={profit.id}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{saleDate}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.productName}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.profit.toFixed(2)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{profit.quantitySold}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Profits;
